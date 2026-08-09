const { supabase } = require("../lib/supabase");

const engine = require("../services/assessmentEngine");
const scoring = require("../services/scoringService");
const session = require("../services/studentSessionService");
const liveEvents = require("../services/liveEvents");

/* ============================================================
   PRIVATE HELPERS
============================================================ */

async function refreshLeaderboard(assessmentId) {
  /*
  ----------------------------------------------------
  Assessment
  ----------------------------------------------------
  */

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("total_questions, marks_per_question")
    .eq("id", assessmentId)
    .single();

  if (assessmentError) throw assessmentError;

  /*
  ----------------------------------------------------
  Submitted Attempts
  ----------------------------------------------------
  */

  const { data, error } = await supabase
    .from("assessment_attempts")
    .select(
      `
      id,
      student_id,
      score,
      correct,
      wrong,
      unanswered,
      percentage,
      submitted_at,
      started_at,
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

  if (error) throw error;

  /*
  ----------------------------------------------------
  Calculate Leaderboard
  ----------------------------------------------------
  */

  const maximumMarks =
    Number(assessment.total_questions || 0) *
    Number(assessment.marks_per_question || 0);

  const leaderboard = (data || [])
    .map((student) => {
      const submittedAt = student.submitted_at
        ? new Date(student.submitted_at).getTime()
        : null;

      const startedAt = student.started_at
        ? new Date(student.started_at).getTime()
        : null;

      const timeTaken =
        submittedAt !== null && startedAt !== null
          ? Math.max(0, Math.floor((submittedAt - startedAt) / 1000))
          : 0;

      const scorePercentage =
        maximumMarks > 0
          ? Number(
              ((Number(student.score || 0) / maximumMarks) * 100).toFixed(2),
            )
          : 0;

      return {
        attemptId: student.id,

        studentId: student.student_id,

        name: student.assessment_allowed_students?.name,

        rollNo: student.assessment_allowed_students?.roll_no,

        department: student.assessment_allowed_students?.department,

        section: student.assessment_allowed_students?.section,

        status: "SUBMITTED",

        score: Number(student.score || 0),

        correct: Number(student.correct || 0),

        wrong: Number(student.wrong || 0),

        unanswered: Number(student.unanswered || 0),

        percentage: Number(Number(student.percentage || 0).toFixed(2)),

        scorePercentage,

        timeTaken,

        submittedAt: student.submitted_at,

        startedAt: student.started_at,
      };
    })
    .sort((a, b) => {
      /*
      --------------------------------------------------
      1. Higher score first
      --------------------------------------------------
      */

      if (b.score !== a.score) {
        return b.score - a.score;
      }

      /*
      --------------------------------------------------
      2. Earlier submission first
      --------------------------------------------------
      */

      const aTime = a.submittedAt
        ? new Date(a.submittedAt).getTime()
        : Number.MAX_SAFE_INTEGER;

      const bTime = b.submittedAt
        ? new Date(b.submittedAt).getTime()
        : Number.MAX_SAFE_INTEGER;

      if (aTime !== bTime) {
        return aTime - bTime;
      }

      /*
      --------------------------------------------------
      3. Roll number
      --------------------------------------------------
      */

      return (a.rollNo || "").localeCompare(b.rollNo || "");
    })
    .map((student, index) => ({
      ...student,
      rank: index + 1,
    }));

  /*
  ----------------------------------------------------
  Emit same structure used by REST leaderboard
  ----------------------------------------------------
  */

  liveEvents.emitLeaderboard(assessmentId, leaderboard);
}

async function refreshDashboard(assessmentId) {
  const { count: registeredStudents } = await supabase
    .from("assessment_allowed_students")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("assessment_id", assessmentId);

  const { data: attempts } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("assessment_id", assessmentId);

  const analytics = {
    registeredStudents,

    startedStudents: attempts.length,

    submittedStudents: attempts.filter((a) => a.status === "SUBMITTED").length,

    inProgressStudents: attempts.filter((a) => a.status === "IN_PROGRESS")
      .length,

    disqualifiedStudents: attempts.filter((a) => a.status === "DISQUALIFIED")
      .length,
  };

  liveEvents.emitDashboardAnalytics(assessmentId, analytics);
}

/* ============================================================
   FORCE SUBMIT ONE STUDENT
============================================================ */

exports.forceSubmit = async (req, res) => {
  try {
    const { attemptId } = req.params;

    if (!attemptId) {
      return res.status(400).json({
        success: false,
        message: "Attempt ID is required.",
      });
    }

    const attempt = await engine.getAttempt(attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found.",
      });
    }

    if (attempt.status === "SUBMITTED" || attempt.status === "DISQUALIFIED") {
      return res.json({
        success: true,
        message: "Attempt already finished.",
      });
    }

    const result = await scoring.calculateScore(attemptId);

    const updated = await engine.finishAttempt(attemptId, result);

    await supabase.from("assessment_activity").insert({
      attempt_id: attemptId,
      activity_type: "FORCE_SUBMIT",
      metadata: {
        source: "ADMIN",
      },
    });

    await session.unlockStudent(updated.assessment_id, updated.student_id);

    liveEvents.emitSubmitted(updated.assessment_id, updated);

    liveEvents.emitStudentSubmitted(updated.assessment_id);

    await refreshLeaderboard(updated.assessment_id);

    await refreshDashboard(updated.assessment_id);

    return res.json({
      success: true,
      message: "Assessment force submitted successfully.",

      score: result.score,

      correct: result.correct,

      wrong: result.wrong,

      unanswered: result.unanswered,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================================================
   FORCE SUBMIT ALL
============================================================ */

exports.forceSubmitAll = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data: attempts, error } = await supabase
      .from("assessment_attempts")
      .select("*")
      .eq("assessment_id", assessmentId)
      .eq("status", "IN_PROGRESS");

    if (error) throw error;

    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const attempt of attempts || []) {
      try {
        if (
          attempt.status === "SUBMITTED" ||
          attempt.status === "DISQUALIFIED"
        ) {
          skipped++;
          continue;
        }

        const result = await scoring.calculateScore(attempt.id);

        const updated = await engine.finishAttempt(attempt.id, result);

        await supabase.from("assessment_activity").insert({
          attempt_id: attempt.id,
          activity_type: "FORCE_SUBMIT",
          metadata: {
            source: "ADMIN",
          },
        });

        await session.unlockStudent(updated.assessment_id, updated.student_id);

        liveEvents.emitSubmitted(updated.assessment_id, updated);

        liveEvents.emitStudentSubmitted(updated.assessment_id);

        processed++;
      } catch (err) {
        console.error(
          `Force submit failed for attempt ${attempt.id}:`,
          err.message,
        );

        failed++;
      }
    }

    /*
--------------------------------------------------------
Refresh Dashboard + Leaderboard once
--------------------------------------------------------
*/

    await refreshLeaderboard(assessmentId);

    await refreshDashboard(assessmentId);

    return res.json({
      success: true,

      processed,
      skipped,
      failed,

      message: "Force submit completed successfully.",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================================================
   DISQUALIFY ONE STUDENT
============================================================ */

exports.disqualify = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { reason } = req.body;

    if (!attemptId) {
      return res.status(400).json({
        success: false,
        message: "Attempt ID is required.",
      });
    }

    const disqualifiedReason = reason?.trim() || "Disqualified by admin";

    /* --------------------------------------------------------
       Get Attempt
    -------------------------------------------------------- */

    const attempt = await engine.getAttempt(attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found.",
      });
    }

    /* --------------------------------------------------------
       Already Finished
    -------------------------------------------------------- */

    if (attempt.status === "SUBMITTED") {
      return res.status(400).json({
        success: false,
        message: "Submitted attempt cannot be disqualified.",
      });
    }

    if (attempt.status === "DISQUALIFIED") {
      return res.json({
        success: true,
        message: "Attempt already disqualified.",
      });
    }

    /* --------------------------------------------------------
       Mark Attempt as Disqualified
    -------------------------------------------------------- */

    const result = await scoring.calculateScore(attemptId);

    const updated = await engine.finishAttempt(
      attemptId,
      result,
      "DISQUALIFIED",
    );

    const { data: updatedWithReason, error: reasonError } = await supabase
      .from("assessment_attempts")
      .update({
        disqualified_reason: disqualifiedReason,
      })
      .eq("id", attemptId)
      .select()
      .single();

    if (reasonError) throw reasonError;

    /* --------------------------------------------------------
       Unlock Student Session
    -------------------------------------------------------- */

    await session.unlockStudent(updated.assessment_id, updated.student_id);

    /* --------------------------------------------------------
       Live Events
    -------------------------------------------------------- */

    liveEvents.emitSubmitted(
      updatedWithReason.assessment_id,
      updatedWithReason,
    );

    liveEvents.emitDisqualified(
      updatedWithReason.assessment_id,
      updatedWithReason,
    );

    /* --------------------------------------------------------
       Refresh Leaderboard + Dashboard
    -------------------------------------------------------- */

    await refreshLeaderboard(updatedWithReason.assessment_id);

    await refreshDashboard(updatedWithReason.assessment_id);

    return res.json({
      success: true,
      message: "Student disqualified successfully.",
      attempt: updatedWithReason,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
