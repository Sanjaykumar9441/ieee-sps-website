const { supabase } = require("../lib/supabase");
const session = require("./studentSessionService");
const scoring = require("./scoringService");
const engine = require("./assessmentEngine");
const liveEvents = require("./liveEvents");

/*
============================================================
CONFIGURATION
============================================================
*/

/*
 * Maximum number of recorded infractions before the
 * assessment is automatically submitted.
 *
 * IMPORTANT:
 * There is NO DISQUALIFIED state in this service.
 */
const MAX_INFRACTIONS = 5;

/*
============================================================
PRIVATE HELPERS
============================================================
*/

/*
 * Refresh leaderboard after an automatic submission.
 */
async function refreshLeaderboard(assessmentId) {
  const { data, error } = await supabase
    .from("assessment_attempts")
    .select(
      `
        id,
        score,
        correct,
        wrong,
        unanswered,
        percentage,
        submitted_at,
        started_at,
        student_id,
        assessment_allowed_students(
          name,
          roll_no,
          department,
          section
        )
      `,
    )
    .eq("assessment_id", assessmentId)
    .eq("status", "SUBMITTED");

  if (error) {
    console.error("[ANTI-CHEAT] Leaderboard query failed:", error);

    return;
  }

  const leaderboard = (data || [])
    .sort((a, b) => {
      const scoreDifference = Number(b.score || 0) - Number(a.score || 0);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      const aTime = a.submitted_at
        ? new Date(a.submitted_at).getTime()
        : Number.MAX_SAFE_INTEGER;

      const bTime = b.submitted_at
        ? new Date(b.submitted_at).getTime()
        : Number.MAX_SAFE_INTEGER;

      if (aTime !== bTime) {
        return aTime - bTime;
      }

      return (a.assessment_allowed_students?.roll_no || "").localeCompare(
        b.assessment_allowed_students?.roll_no || "",
      );
    })
    .map((student, index) => ({
      rank: index + 1,

      attemptId: student.id,

      studentId: student.student_id,

      name: student.assessment_allowed_students?.name || "",

      rollNo: student.assessment_allowed_students?.roll_no || "",

      department: student.assessment_allowed_students?.department || "",

      section: student.assessment_allowed_students?.section || "",

      status: "SUBMITTED",

      score: Number(student.score || 0),

      correct: Number(student.correct || 0),

      wrong: Number(student.wrong || 0),

      unanswered: Number(student.unanswered || 0),

      percentage: Number(student.percentage || 0),

      submittedAt: student.submitted_at,

      startedAt: student.started_at,
    }));

  liveEvents.emitLeaderboard(assessmentId, leaderboard);
}

/*
 * Refresh dashboard statistics after submission.
 *
 * There is intentionally NO disqualifiedStudents
 * value generated here.
 */
async function refreshDashboard(assessmentId) {
  const { count: registeredStudents, error: registeredError } = await supabase
    .from("assessment_allowed_students")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("assessment_id", assessmentId);

  if (registeredError) {
    console.error(
      "[ANTI-CHEAT] Registered student count failed:",
      registeredError,
    );
  }

  const { data: attempts, error: attemptsError } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("assessment_id", assessmentId);

  if (attemptsError) {
    console.error(
      "[ANTI-CHEAT] Dashboard attempt query failed:",
      attemptsError,
    );

    return;
  }

  const allAttempts = attempts || [];

  const analytics = {
    registeredStudents: registeredStudents || 0,

    startedStudents: allAttempts.length,

    submittedStudents: allAttempts.filter(
      (attempt) => attempt.status === "SUBMITTED",
    ).length,

    inProgressStudents: allAttempts.filter(
      (attempt) => attempt.status === "IN_PROGRESS",
    ).length,
  };

  liveEvents.emitDashboardAnalytics(assessmentId, analytics);
}

/*
============================================================
AUTO SUBMIT ATTEMPT
============================================================
*/

/*
 * Automatically submit an assessment.
 *
 * This function is used for anti-cheat violations.
 *
 * IMPORTANT:
 *
 * - NEVER writes DISQUALIFIED.
 * - NEVER calls emitDisqualified().
 * - NEVER returns disqualified: true.
 * - Always finishes the attempt as SUBMITTED.
 *
 * It also re-reads the attempt immediately before
 * submitting so simultaneous TAB_SWITCH and WINDOW_BLUR
 * events do not submit the same attempt twice.
 */
async function autoSubmitAttempt(attempt, reason = "ANTI_CHEAT_AUTO_SUBMIT") {
  if (!attempt?.id) {
    throw new Error("Attempt ID is required.");
  }

  /*
   * Re-read the latest database state.
   */
  const latestAttempt = await engine.getAttempt(attempt.id);

  if (!latestAttempt) {
    throw new Error("Attempt not found.");
  }

  /*
   * If another request already submitted
   * the assessment, do not submit again.
   */
  if (latestAttempt.status === "SUBMITTED") {
    return {
      success: true,
      alreadyFinished: true,
      autoSubmitted: true,
      status: "SUBMITTED",
    };
  }

  /*
   * Do not process a non-active/finished attempt.
   */
  if (latestAttempt.status !== "IN_PROGRESS") {
    return {
      success: true,
      alreadyFinished: true,
      autoSubmitted: false,
      status: latestAttempt.status,
    };
  }

  /*
   * Calculate the score using the latest
   * saved answers.
   */
  const result = await scoring.calculateScore(latestAttempt.id);

  /*
   * Finish the attempt.
   *
   * assessmentEngine.finishAttempt()
   * writes status = SUBMITTED.
   */
  const updatedAttempt = await engine.finishAttempt(latestAttempt.id, result);

  /*
   * Release the student's Redis/session lock.
   */
  try {
    await session.unlockStudent(
      updatedAttempt.assessment_id,
      updatedAttempt.student_id,
    );
  } catch (error) {
    /*
     * Submission has already happened.
     * A lock-release problem must not turn a
     * successful submission into a failed response.
     */
    console.error("[ANTI-CHEAT] Failed to unlock student:", error);
  }

  /*
   * Record the automatic submission.
   *
   * Only ONE attempt_id property is used.
   */
  try {
    const { error: activityError } = await supabase
      .from("assessment_activity")
      .insert({
        attempt_id: updatedAttempt.id,

        activity_type: "AUTO_SUBMIT",

        metadata: {
          source: "anti_cheat",

          reason: reason || "ANTI_CHEAT_AUTO_SUBMIT",

          submitted_at: new Date().toISOString(),
        },
      });

    if (activityError) {
      console.error(
        "[ANTI-CHEAT] Failed to record AUTO_SUBMIT activity:",
        activityError,
      );
    }
  } catch (error) {
    console.error("[ANTI-CHEAT] Activity logging failed:", error);
  }

  /*
   * Notify the dashboard that the student
   * has submitted the assessment.
   */
  liveEvents.emitSubmitted(updatedAttempt.assessment_id, updatedAttempt);

  liveEvents.emitStudentSubmitted(updatedAttempt.assessment_id);

  /*
   * Refresh leaderboard.
   */
  await refreshLeaderboard(updatedAttempt.assessment_id);

  /*
   * Refresh dashboard analytics.
   */
  await refreshDashboard(updatedAttempt.assessment_id);

  /*
   * Return normal SUBMITTED status.
   */
  return {
    success: true,

    alreadyFinished: false,

    autoSubmitted: true,

    status: "SUBMITTED",

    reason,

    score: Number(result.score || 0),

    correct: Number(result.correct || 0),

    wrong: Number(result.wrong || 0),

    unanswered: Number(result.unanswered || 0),
  };
}

/*
============================================================
REPORT INFRACTION
============================================================
*/

exports.reportInfraction = async (attemptId, type, metadata = {}) => {
  if (!attemptId) {
    throw new Error("Attempt ID is required.");
  }

  if (!type) {
    throw new Error("Infraction type is required.");
  }

  /*
   * Get latest attempt.
   */
  const attempt = await engine.getAttempt(attemptId);

  if (!attempt) {
    throw new Error("Attempt not found.");
  }

  /*
   * Ignore an attempt that has already
   * been submitted.
   */
  if (attempt.status === "SUBMITTED") {
    return {
      ignored: true,

      alreadyFinished: true,

      status: "SUBMITTED",
    };
  }

  /*
   * Only an active attempt can generate
   * an anti-cheat submission.
   */
  if (attempt.status !== "IN_PROGRESS") {
    return {
      ignored: true,

      alreadyFinished: true,

      status: attempt.status,
    };
  }

  /*
   * Save the infraction.
   */
  const { data: infraction, error: infractionError } = await supabase
    .from("assessment_infractions")
    .insert({
      attempt_id: attempt.id,

      type,

      details: metadata ?? null,

      occurred_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (infractionError) {
    throw infractionError;
  }

  /*
   * Count all infractions for this attempt.
   */
  const { count: totalInfractions, error: countError } = await supabase
    .from("assessment_infractions")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("attempt_id", attempt.id);

  if (countError) {
    throw countError;
  }

  /*
   * Notify dashboard about the infraction.
   */
  liveEvents.emitInfraction(attempt.assessment_id, {
    attemptId: attempt.id,

    studentId: attempt.student_id,

    infractionType: type,

    totalInfractions: totalInfractions || 0,
  });

  /*
   * ========================================================
   * AUTOMATIC SUBMISSION
   * ========================================================
   *
   * Once the maximum number of infractions is reached,
   * automatically submit the assessment.
   *
   * NEVER disqualify the student.
   */
  if (Number(totalInfractions || 0) >= MAX_INFRACTIONS) {
    return await autoSubmitAttempt(attempt, `MAX_INFRACTIONS:${type}`);
  }

  /*
   * Normal infraction response.
   */
  return {
    success: true,

    disqualified: false,

    autoSubmitted: false,

    totalInfractions: totalInfractions || 0,

    maxInfractions: MAX_INFRACTIONS,

    infraction,
  };
};

/*
============================================================
IMMEDIATE AUTO-SUBMISSION FOR TAB/WINDOW EVENTS
============================================================
*/

/*
 * This helper can be used directly by controllers
 * or anti-cheat routes when a TAB_SWITCH or WINDOW_BLUR
 * must immediately submit the assessment.
 *
 * The requirement is:
 *
 * TAB_SWITCH  -> SUBMITTED
 * WINDOW_BLUR -> SUBMITTED
 *
 * No DISQUALIFIED status.
 */
exports.autoSubmitAttempt = async (
  attemptId,
  reason = "ANTI_CHEAT_AUTO_SUBMIT",
) => {
  if (!attemptId) {
    throw new Error("Attempt ID is required.");
  }

  const attempt = await engine.getAttempt(attemptId);

  if (!attempt) {
    throw new Error("Attempt not found.");
  }

  return await autoSubmitAttempt(attempt, reason);
};

/*
============================================================
GET ATTEMPT INFRACTIONS
============================================================
*/

exports.getAttemptInfractions = async (attemptId) => {
  const { data, error } = await supabase
    .from("assessment_infractions")
    .select("*")
    .eq("attempt_id", attemptId)
    .order("occurred_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
};

/*
============================================================
GET STUDENT INFRACTION COUNT
============================================================
*/

exports.getInfractionCount = async (attemptId) => {
  const { count, error } = await supabase
    .from("assessment_infractions")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("attempt_id", attemptId);

  if (error) {
    throw error;
  }

  return count || 0;
};

/*
============================================================
RESET ATTEMPT INFRACTIONS
============================================================
*/

exports.resetInfractions = async (attemptId) => {
  const { error } = await supabase
    .from("assessment_infractions")
    .delete()
    .eq("attempt_id", attemptId);

  if (error) {
    throw error;
  }

  return {
    success: true,
  };
};

/*
============================================================
GET ALL INFRACTIONS OF AN ASSESSMENT
============================================================
*/

exports.getAssessmentInfractions = async (assessmentId) => {
  const { data, error } = await supabase
    .from("assessment_infractions")
    .select(
      `
          id,
          attempt_id,
          type,
          details,
          occurred_at,
          assessment_attempts(
            assessment_id,
            student_id,
            assessment_allowed_students(
              name,
              roll_no,
              department,
              section
            )
          )
        `,
    )
    .eq("assessment_attempts.assessment_id", assessmentId)
    .order("occurred_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
};

/*
============================================================
CONFIGURATION
============================================================
*/

exports.getConfiguration = () => ({
  MAX_INFRACTIONS,
});
