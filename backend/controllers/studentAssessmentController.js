const assessmentService = require("../services/assessmentService");
const engine = require("../services/assessmentEngine");
const session = require("../services/studentSessionService");
const scoring = require("../services/scoringService");
const { setAttemptStartTime, getSecondsRemaining } = require("../lib/redis");
const { supabase } = require("../lib/supabase");
const liveEvents = require("../services/liveEvents");
const antiCheat = require("../services/antiCheatService");

function calculateAllowedDurationSeconds(assessment, startTime = new Date()) {
  const configuredDurationSeconds = Number(assessment.duration_minutes) * 60;

  const endTime = new Date(assessment.end_time);

  const secondsUntilEnd = Math.floor(
    (endTime.getTime() - startTime.getTime()) / 1000,
  );

  return Math.max(0, Math.min(configuredDurationSeconds, secondsUntilEnd));
}

function getAttemptAllowedDurationSeconds(assessment, attempt) {
  const configuredDurationSeconds = Number(assessment.duration_minutes) * 60;

  const startedAt = new Date(attempt.started_at);
  const endTime = new Date(assessment.end_time);

  const secondsAvailableFromStart = Math.floor(
    (endTime.getTime() - startedAt.getTime()) / 1000,
  );

  return Math.max(
    0,
    Math.min(configuredDurationSeconds, secondsAvailableFromStart),
  );
}

/* ============================================================
   CHECK ASSESSMENT
============================================================ */

exports.checkAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const { data: assessment, error } =
      await assessmentService.getAssessment(assessmentId);

    if (error || !assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    const now = new Date();

    const startTime = new Date(assessment.start_time);
    const endTime = new Date(assessment.end_time);

    if (now < startTime) {
      return res.status(403).json({
        success: false,
        code: "ASSESSMENT_NOT_STARTED",
        message: "Assessment has not started yet.",
        startTime: assessment.start_time,
        serverTime: now.toISOString(),
      });
    }

    if (now >= endTime) {
      return res.status(403).json({
        success: false,
        code: "ASSESSMENT_CLOSED",
        message: "Assessment has already ended.",
        endTime: assessment.end_time,
        serverTime: now.toISOString(),
      });
    }

    const actualDurationSeconds = calculateAllowedDurationSeconds(
      assessment,
      now,
    );

    if (actualDurationSeconds <= 0) {
      return res.status(403).json({
        success: false,
        code: "ASSESSMENT_CLOSED",
        message: "Assessment has already ended.",
      });
    }

    if (!assessment.is_active) {
      return res.status(400).json({
        success: false,
        message: "Assessment is not active.",
      });
    }

    res.json({
      success: true,
      assessment,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================================================
   START ASSESSMENT
============================================================ */

exports.startAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const student = req.student;

    /*
    --------------------------------
    Assessment
    --------------------------------
    */

    const { data: assessment, error } =
      await assessmentService.getAssessment(assessmentId);

    if (error || !assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    const now = new Date();

    const startTime = new Date(assessment.start_time);
    const endTime = new Date(assessment.end_time);

    if (now < startTime) {
      return res.status(403).json({
        success: false,
        code: "ASSESSMENT_NOT_STARTED",
        message: "Assessment has not started yet.",
        startTime: assessment.start_time,
        serverTime: now.toISOString(),
      });
    }

    if (now >= endTime) {
      return res.status(403).json({
        success: false,
        code: "ASSESSMENT_CLOSED",
        message: "Assessment has already ended.",
        endTime: assessment.end_time,
        serverTime: now.toISOString(),
      });
    }

    const actualDurationSeconds = calculateAllowedDurationSeconds(
      assessment,
      now,
    );

    if (actualDurationSeconds <= 0) {
      return res.status(403).json({
        success: false,
        code: "ASSESSMENT_CLOSED",
        message: "Assessment has already ended.",
      });
    }

    /*
    --------------------------------
    Already Submitted?
    --------------------------------
    */

    const { data: submittedAttempt } =
      await assessmentService.getSubmittedAttempt(assessment.id, student.id);

    if (submittedAttempt) {
      return res.status(400).json({
        success: false,
        message: "Assessment already submitted.",
      });
    }

    /*
    --------------------------------
    Running Attempt?
    --------------------------------
    */

    const { data: runningAttempt } = await assessmentService.hasRunningAttempt(
      assessment.id,
      student.id,
    );

    if (runningAttempt) {
      return res.status(409).json({
        success: false,
        message: "Assessment already running.",
      });
    }

    /*
    --------------------------------
    Redis Lock
    --------------------------------
    */

    await session.lockStudent(assessment.id, student.id, actualDurationSeconds);

    /*
    --------------------------------
    Generate Paper
    --------------------------------
    */

    const frozenQuestions = await engine.generateAttempt(assessment);

    /*
    --------------------------------
    Create Attempt
    --------------------------------
    */

    const attempt = await engine.createAttempt(
      assessment,
      student,
      frozenQuestions,
    );

    /*
    --------------------------------
    Redis Timer
    --------------------------------
    */

    await setAttemptStartTime(attempt.id, actualDurationSeconds);

    /*
    --------------------------------
    First Question
    --------------------------------
    */

    const firstQuestion = await engine.getQuestion(attempt.id, 1);

    res.json({
      success: true,

      attemptId: attempt.id,

      remainingSeconds: actualDurationSeconds,

      totalQuestions: frozenQuestions.length,

      currentQuestion: 1,

      question: firstQuestion,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================================================
   SAVE ANSWER
============================================================ */

exports.saveAnswer = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const { attemptQuestionId, selectedAnswers } = req.body;

    if (!attemptQuestionId) {
      return res.status(400).json({
        success: false,
        message: "Attempt question ID is required.",
      });
    }

    const answer = await engine.saveAnswer(
      attemptId,
      attemptQuestionId,
      selectedAnswers,
    );

    const attempt = await engine.getAttempt(attemptId);

    liveEvents.emitAnswerSaved(attempt.assessment_id, {
      attemptId,
      attemptQuestionId,
      selectedAnswers,
    });

    liveEvents.emitProgress(attempt.assessment_id, {
      attemptId,

      studentId: attempt.student_id,

      currentQuestion: attempt.current_question,

      answeredQuestions: attempt.answered_questions,
    });

    return res.json({
      success: true,
      answer,
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
   GET QUESTION
============================================================ */

exports.getQuestion = async (req, res) => {
  try {
    const { attemptId, number } = req.params;

    const question = await engine.getQuestion(attemptId, Number(number));

    const attempt = await engine.getAttempt(attemptId);

    const { data: assessment } = await assessmentService.getAssessment(
      attempt.assessment_id,
    );

    const allowedDurationSeconds = getAttemptAllowedDurationSeconds(
      assessment,
      attempt,
    );

    const remainingSeconds = await getSecondsRemaining(
      attemptId,
      allowedDurationSeconds,
    );

    await engine.updateCurrentQuestion(attemptId, Number(number));

    return res.json({
      success: true,

      remainingSeconds,

      question,
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
   QUESTION PALETTE
============================================================ */

exports.getPalette = async (req, res) => {
  try {
    const palette = await engine.getPalette(req.params.attemptId);

    return res.json({
      success: true,
      palette,
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
   GET STATUS
============================================================ */

exports.getStatus = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await engine.getAttempt(attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found.",
      });
    }

    const { data: assessment } = await assessmentService.getAssessment(
      attempt.assessment_id,
    );

    const allowedDurationSeconds = getAttemptAllowedDurationSeconds(
      assessment,
      attempt,
    );

    const remainingSeconds = await getSecondsRemaining(
      attemptId,
      allowedDurationSeconds,
    );

    liveEvents.emitTimer(attempt.assessment_id, {
      attemptId,
      remainingSeconds,
    });

    /*
    ------------------------------------
    AUTO SUBMIT
    ------------------------------------
    */

    if (
      remainingSeconds <= 0 &&
      attempt.status !== "SUBMITTED" &&
      attempt.status !== "DISQUALIFIED"
    ) {
      const result = await scoring.calculateScore(attemptId);

      const updatedAttempt = await engine.finishAttempt(attemptId, result);

      await session.unlockStudent(
        updatedAttempt.assessment_id,
        updatedAttempt.student_id,
      );

      /*
----------------------------------------------------
Refresh Leaderboard
----------------------------------------------------
*/

      const { data: leaderboard } = await supabase
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
        .eq("assessment_id", updatedAttempt.assessment_id)
        .eq("status", "SUBMITTED");

      const sortedLeaderboard = (leaderboard || [])
        .sort((a, b) => {
          if (Number(b.score) !== Number(a.score)) {
            return Number(b.score) - Number(a.score);
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

          name: student.assessment_allowed_students?.name,

          rollNo: student.assessment_allowed_students?.roll_no,

          department: student.assessment_allowed_students?.department,

          section: student.assessment_allowed_students?.section,

          status: "SUBMITTED",

          score: Number(student.score || 0),

          correct: Number(student.correct || 0),

          wrong: Number(student.wrong || 0),

          unanswered: Number(student.unanswered || 0),

          percentage: Number(student.percentage || 0),

          timeTaken:
            student.submitted_at && student.started_at
              ? Math.max(
                  0,
                  Math.floor(
                    (new Date(student.submitted_at).getTime() -
                      new Date(student.started_at).getTime()) /
                      1000,
                  ),
                )
              : 0,

          submittedAt: student.submitted_at,

          startedAt: student.started_at,
        }));

      liveEvents.emitLeaderboard(
        updatedAttempt.assessment_id,
        sortedLeaderboard,
      );

      /*
----------------------------------------------------
Refresh Dashboard
----------------------------------------------------
*/

      const { count: registeredStudents } = await supabase
        .from("assessment_allowed_students")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("assessment_id", updatedAttempt.assessment_id);

      const { data: attempts } = await supabase
        .from("assessment_attempts")
        .select("*")
        .eq("assessment_id", updatedAttempt.assessment_id);

      const dashboard = {
        registeredStudents: registeredStudents || 0,

        startedStudents: (attempts || []).length,

        submittedStudents: (attempts || []).filter(
          (a) => a.status === "SUBMITTED",
        ).length,

        inProgressStudents: (attempts || []).filter(
          (a) => a.status === "IN_PROGRESS",
        ).length,

        disqualifiedStudents: (attempts || []).filter(
          (a) => a.status === "DISQUALIFIED",
        ).length,
      };

      liveEvents.emitDashboardAnalytics(
        updatedAttempt.assessment_id,
        dashboard,
      );

      liveEvents.emitSubmitted(updatedAttempt.assessment_id, updatedAttempt);

      liveEvents.emitStudentSubmitted(updatedAttempt.assessment_id);

      return res.json({
        success: false,
        expired: true,
        message: "Assessment time completed.",
      });
    }

    const palette = await engine.getPalette(attemptId);

    const answered = palette.filter((q) => q.answered).length;

    return res.json({
      success: true,

      remainingSeconds,

      answered,

      totalQuestions: palette.length,

      palette,
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
   SUBMIT ASSESSMENT
============================================================ */

exports.submitAssessment = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await engine.getAttempt(attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found.",
      });
    }

    if (attempt.status === "SUBMITTED") {
      return res.status(400).json({
        success: false,
        message: "Assessment already submitted.",
      });
    }

    /*
      ------------------------------------
      SCORE
      ------------------------------------
      */

    const result = await scoring.calculateScore(attemptId);

    /*
      ------------------------------------
      FINISH ATTEMPT
      ------------------------------------
      */

    const updatedAttempt = await engine.finishAttempt(attemptId, result);

    /*
      ------------------------------------
      RELEASE REDIS LOCK
      ------------------------------------
      */

    await session.unlockStudent(
      updatedAttempt.assessment_id,
      updatedAttempt.student_id,
    );

    /*
      ------------------------------------
      LEADERBOARD
      ------------------------------------
      */

    const { data: leaderboard } = await supabase
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
      .eq("assessment_id", updatedAttempt.assessment_id)
      .eq("status", "SUBMITTED");

    const sortedLeaderboard = (leaderboard || [])
      .sort((a, b) => {
        if (Number(b.score) !== Number(a.score)) {
          return Number(b.score) - Number(a.score);
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

        name: student.assessment_allowed_students?.name,

        rollNo: student.assessment_allowed_students?.roll_no,

        department: student.assessment_allowed_students?.department,

        section: student.assessment_allowed_students?.section,

        status: "SUBMITTED",

        score: Number(student.score || 0),

        correct: Number(student.correct || 0),

        wrong: Number(student.wrong || 0),

        unanswered: Number(student.unanswered || 0),

        percentage: Number(student.percentage || 0),

        timeTaken:
          student.submitted_at && student.started_at
            ? Math.max(
                0,
                Math.floor(
                  (new Date(student.submitted_at).getTime() -
                    new Date(student.started_at).getTime()) /
                    1000,
                ),
              )
            : 0,

        submittedAt: student.submitted_at,

        startedAt: student.started_at,
      }));

    liveEvents.emitLeaderboard(updatedAttempt.assessment_id, sortedLeaderboard);

    /*
      ------------------------------------
      DASHBOARD
      ------------------------------------
      */

    const { count: registeredStudents } = await supabase
      .from("assessment_allowed_students")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("assessment_id", updatedAttempt.assessment_id);

    const { data: attempts } = await supabase
      .from("assessment_attempts")
      .select("*")
      .eq("assessment_id", updatedAttempt.assessment_id);

    const dashboard = {
      registeredStudents: registeredStudents || 0,

      startedStudents: (attempts || []).length,

      submittedStudents: (attempts || []).filter(
        (a) => a.status === "SUBMITTED",
      ).length,

      inProgressStudents: (attempts || []).filter(
        (a) => a.status === "IN_PROGRESS",
      ).length,

      disqualifiedStudents: (attempts || []).filter(
        (a) => a.status === "DISQUALIFIED",
      ).length,
    };

    liveEvents.emitDashboardAnalytics(updatedAttempt.assessment_id, dashboard);

    /*
      ------------------------------------
      SUBMITTED EVENT
      ------------------------------------
      */

    liveEvents.emitSubmitted(updatedAttempt.assessment_id, updatedAttempt);

    liveEvents.emitStudentSubmitted(updatedAttempt.assessment_id);

    return res.json({
      success: true,

      score: result.score,

      correct: result.correct,

      wrong: result.wrong,

      unanswered: result.unanswered,

      percentage: result.percentage,

      submittedAt: updatedAttempt.submitted_at,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================================
   REPORT INFRACTION
========================================================== */

exports.reportInfraction = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const { type, metadata } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Infraction type is required.",
      });
    }

    const result = await antiCheat.reportInfraction(
      attemptId,
      type,
      metadata || {},
    );

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================================
   GET ATTEMPT INFRACTIONS
========================================================== */

exports.getInfractions = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const infractions = await antiCheat.getAttemptInfractions(attemptId);

    return res.json({
      success: true,
      infractions,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================================
   RESET INFRACTIONS
========================================================== */

exports.resetInfractions = async (req, res) => {
  try {
    const { attemptId } = req.params;

    await antiCheat.resetInfractions(attemptId);

    return res.json({
      success: true,
      message: "Infractions reset successfully.",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================================
   ANTI CHEAT CONFIG
========================================================== */

exports.getAntiCheatConfig = async (req, res) => {
  try {
    return res.json({
      success: true,
      config: antiCheat.getConfiguration(),
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
