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

const MAX_INFRACTIONS = 5;

async function autoSubmitAttempt(attempt) {
  if (!attempt || ["SUBMITTED", "DISQUALIFIED", "EXPIRED"].includes(attempt.status)) {
    return { success: true, alreadyFinished: true };
  }

  const result = await scoring.calculateScore(attempt.id);
  const updatedAttempt = await engine.finishAttempt(attempt.id, result, "SUBMITTED");

  await session.unlockStudent(updatedAttempt.assessment_id, updatedAttempt.student_id);

  // These events cause the admin Students/Leaderboard/Analytics views to refresh.
  liveEvents.emitStudentSubmitted(updatedAttempt.assessment_id);
  liveEvents.emitLeaderboard(updatedAttempt.assessment_id, []);
  liveEvents.emitDashboardRefresh(updatedAttempt.assessment_id);

  return {
    success: true,
    autoSubmitted: true,
    status: updatedAttempt.status,
    score: result.score,
  };
}

/*
============================================================
SAVE INFRACTION
============================================================
*/

exports.reportInfraction = async (attemptId, type, metadata = {}) => {
  /*
  --------------------------------------------------------
  Get Attempt
  --------------------------------------------------------
  */

  const attempt = await engine.getAttempt(attemptId);

  if (!attempt) {
    throw new Error("Attempt not found.");
  }

  /*
  --------------------------------------------------------
  Ignore completed attempts
  --------------------------------------------------------
  */

  if (attempt.status === "SUBMITTED" || attempt.status === "DISQUALIFIED") {
    return {
      ignored: true,
    };
  }

  /*
  --------------------------------------------------------
  Save Infraction
  --------------------------------------------------------
  */

  const { data: infraction, error } = await supabase
    .from("assessment_infractions")
    .insert({
      attempt_id: attempt.id,

      type,

      details: metadata ?? null,

      occurred_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  /*
  --------------------------------------------------------
  Count Infractions
  --------------------------------------------------------
  */

  const { count: totalInfractions } = await supabase
    .from("assessment_infractions")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("attempt_id", attempt.id);

  /*
  --------------------------------------------------------
  Notify Dashboard
  --------------------------------------------------------
  */

  liveEvents.emitInfraction(attempt.assessment_id, {
    attemptId: attempt.id,

    studentId: attempt.student_id,

    infractionType: type,

    totalInfractions,
  });

  // A tab/window exit ends the attempt immediately. FULLSCREEN_EXIT is
  // intentionally excluded because the first Escape is only a warning.
  if (type === "TAB_SWITCH" || type === "WINDOW_BLUR") {
    return await autoSubmitAttempt(attempt);
  }

  /*
  --------------------------------------------------------
  Auto Disqualify
  --------------------------------------------------------
  */

  if (totalInfractions >= MAX_INFRACTIONS) {
    return await exports.disqualifyAttempt(attempt);
  }

  return {
    disqualified: false,

    totalInfractions,

    infraction,
  };
};

/*
============================================================
DISQUALIFY ATTEMPT
============================================================
*/

exports.disqualifyAttempt = async (attempt) => {
  /*
  --------------------------------------------------------
  Already Finished
  --------------------------------------------------------
  */

  if (attempt.status === "SUBMITTED" || attempt.status === "DISQUALIFIED") {
    return {
      success: true,
      alreadyFinished: true,
    };
  }

  /*
  --------------------------------------------------------
  Calculate Score
  --------------------------------------------------------
  */

  const result = await scoring.calculateScore(attempt.id);

  /*
  --------------------------------------------------------
  Finish Attempt
  --------------------------------------------------------
  */

  const updatedAttempt = await engine.finishAttempt(
    attempt.id,
    result,
    "DISQUALIFIED",
  );

  /*
  --------------------------------------------------------
  Release Redis Lock
  --------------------------------------------------------
  */

  await session.unlockStudent(attempt.assessment_id, attempt.student_id);

  /*
  --------------------------------------------------------
  Notify Dashboard
  --------------------------------------------------------
  */

  liveEvents.emitDisqualified(attempt.assessment_id, updatedAttempt);

  liveEvents.emitStudentSubmitted(attempt.assessment_id);

  /*
  --------------------------------------------------------
  Refresh Leaderboard
  --------------------------------------------------------
  */

  const { data: leaderboard } = await supabase
    .from("assessment_attempts")
    .select(
      `
        id,
        score,
        submitted_at,
        student_id,
        assessment_allowed_students(
          name,
          roll_no,
          branch
        )
      `,
    )
    .eq("assessment_id", attempt.assessment_id)
    .eq("status", "SUBMITTED");

  liveEvents.emitLeaderboard(attempt.assessment_id, leaderboard || []);

  /*
  --------------------------------------------------------
  Refresh Dashboard Analytics
  --------------------------------------------------------
  */

  const { data: attempts } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("assessment_id", attempt.assessment_id);

  const analytics = {
    startedStudents: attempts.length,

    submittedStudents: attempts.filter((a) => a.status === "SUBMITTED").length,

    inProgressStudents: attempts.filter((a) => a.status === "IN_PROGRESS")
      .length,

    disqualifiedStudents: attempts.filter((a) => a.status === "DISQUALIFIED")
      .length,
  };

  liveEvents.emitDashboardAnalytics(attempt.assessment_id, analytics);

  return {
    success: true,

    disqualified: true,

    score: result.score,

    correct: result.correct,

    wrong: result.wrong,

    unanswered: result.unanswered,
  };
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

  if (error) throw error;

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

  if (error) throw error;

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

  if (error) throw error;

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
    .select(`
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
          branch
        )
      )
    `)
    .eq("assessment_attempts.assessment_id", assessmentId)
    .order("occurred_at", {
      ascending: false,
    });

  if (error) throw error;

  return data || [];
};
/*
============================================================
GET CONFIGURATION
============================================================
*/

exports.getConfiguration = () => ({
  MAX_INFRACTIONS,
});
