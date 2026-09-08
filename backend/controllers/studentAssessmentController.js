const assessmentService = require("../services/assessmentService");
const engine = require("../services/assessmentEngine");
const session = require("../services/studentSessionService");
const { setAttemptStartTime, getSecondsRemaining } = require("../lib/redis");
const liveEvents = require("../services/liveEvents");
const antiCheat = require("../services/antiCheatService");
const crypto = require("crypto");
const { enqueueSubmission } = require("../services/submissionQueue");

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

    if (!assessment.is_active) {
      return res.status(400).json({
        success: false,
        message: "Assessment is not active.",
      });
    }

    const now = new Date();
    const startTime = new Date(assessment.start_time);
    const endTime = new Date(assessment.end_time);

    let examStatus = "NOT_STARTED";

    if (now >= startTime && now < endTime) {
      examStatus = "LIVE";
    } else if (now >= endTime) {
      examStatus = "CLOSED";
    }

    return res.json({
      success: true,
      assessment,
      examStatus,
      serverTime: now.toISOString(),
      startTime: assessment.start_time,
      endTime: assessment.end_time,
    });
  } catch (err) {
    console.error("CHECK ASSESSMENT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================================================
   START ASSESSMENT
============================================================ */

exports.startAssessment = async (req, res) => {
  let lockAcquired = false;

  try {
    const { assessmentId } = req.params;
    const student = req.student;
    const teamId = student.team_id || null;

    // Generate unique session ID
    const sessionId = crypto.randomUUID();

    // --------------------------------
    // Assessment
    // --------------------------------
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

    // --------------------------------
    // Already Submitted?
    // --------------------------------
    const { data: submittedAttempt, error: submittedAttemptError } =
      await assessmentService.getSubmittedAttempt(
        assessment.id,
        student.id,
        teamId,
      );

    if (submittedAttemptError) {
      throw submittedAttemptError;
    }

    if (submittedAttempt) {
      return res.status(400).json({
        success: false,
        message: "Assessment already submitted.",
      });
    }

    // --------------------------------
    // Running Attempt?
    // --------------------------------
    const { data: runningAttempt, error: runningAttemptError } =
      await assessmentService.hasRunningAttempt(
        assessment.id,
        student.id,
        teamId,
      );

    if (runningAttemptError) {
      throw runningAttemptError;
    }

    if (runningAttempt) {
      return res.status(409).json({
        success: false,
        code: "ASSESSMENT_ALREADY_RUNNING",
        message: "Assessment already running. Resume the existing attempt.",
        attemptId: runningAttempt.id,
      });
    }

    // If there is no database attempt in progress, a remaining Redis lock is
    // stale (for example after a crashed process before the attempt row was
    // created). Clear only that stale lock before acquiring a fresh session.
    await session.clearStaleSession(assessment.id, teamId || student.id);

    // --------------------------------
    // Redis Lock
    // --------------------------------
    lockAcquired = await session.lockStudent(
      assessment.id,
      teamId || student.id,
      sessionId,
      actualDurationSeconds,
    );

    if (!lockAcquired) {
      return res.status(409).json({
        success: false,
        code: "ASSESSMENT_SESSION_ACTIVE",
        message: "This assessment is already active in another session.",
      });
    }

    // --------------------------------
    // Generate Paper
    // --------------------------------
    const frozenQuestions = await engine.generateAttempt(assessment);

    // --------------------------------
    // Create Attempt
    // --------------------------------
    const attempt = await engine.createAttempt(
      assessment,
      student,
      frozenQuestions,
      null,
      teamId,
    );

    // --------------------------------
    // Redis Timer
    // --------------------------------
    await setAttemptStartTime(attempt.id, actualDurationSeconds);

    // --------------------------------
    // One-time complete paper fetch
    // --------------------------------
    const paper = await engine.getAttemptPaper(attempt.id);

    return res.json({
      success: true,
      attemptId: attempt.id,
      sessionId,
      remainingSeconds: actualDurationSeconds,
      totalQuestions: paper.length,
      currentQuestion: 1,
      questions: paper,
      question: paper[0] || null,
    });
  } catch (err) {
    if (lockAcquired) {
      try {
        await session.unlockStudent(
          req.params.assessmentId,
          req.student.team_id || req.student.id,
        );
      } catch (unlockError) {
        console.error("FAILED TO RELEASE ASSESSMENT LOCK:", unlockError);
      }
    }

    console.error("START ASSESSMENT ERROR:", err);

    return res.status(500).json({
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
      console.error("❌ attemptQuestionId missing");

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

    if (!attempt) {
      throw new Error("Attempt not found after saving answer.");
    }

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
    console.error("\n❌ SAVE ANSWER CONTROLLER ERROR");
    console.error("Error message:", err.message);
    console.error("Full error:", err);
    console.error("============================================\n");

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================================================
   GET COMPLETE ATTEMPT PAPER
============================================================ */

exports.getPaper = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const attempt =
      req.assessmentAttempt || (await engine.getAttempt(attemptId));
    if (!attempt) {
      return res
        .status(404)
        .json({ success: false, message: "Attempt not found." });
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
    const questions = await engine.getAttemptPaper(attemptId);

    return res.json({
      success: true,
      totalQuestions: questions.length,
      remainingSeconds,
      questions,
    });
  } catch (err) {
    console.error("GET ATTEMPT PAPER ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ============================================================
   GET QUESTION (LEGACY COMPATIBILITY)
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
    const attempt =
      req.assessmentAttempt || (await engine.getAttempt(attemptId));

    if (!attempt) {
      return res
        .status(404)
        .json({ success: false, message: "Attempt not found." });
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

    if (remainingSeconds <= 0 && attempt.status === "IN_PROGRESS") {
      return res.json({
        success: false,
        expired: true,
        status: "EXPIRED",
        remainingSeconds: 0,
        totalQuestions: Number(attempt.total_questions || 0),
        message: "Assessment time completed. Submit the local answer snapshot.",
      });
    }

    return res.json({
      success: true,
      assessmentId: attempt.assessment_id,
      remainingSeconds,
      status: attempt.status,
      currentQuestion: Number(attempt.current_question || 1),
      answeredQuestions: Number(attempt.answered_questions || 0),
      totalQuestions: Number(attempt.total_questions || 0),
    });
  } catch (err) {
    console.error("GET ASSESSMENT STATUS ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ============================================================
   SUBMIT ASSESSMENT — QUEUED BATCH WRITE
============================================================ */

exports.submitAssessment = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const attempt =
      req.assessmentAttempt || (await engine.getAttempt(attemptId));

    if (!attempt) {
      return res
        .status(404)
        .json({ success: false, message: "Attempt not found." });
    }

    if (attempt.status === "SUBMITTED" || attempt.status === "EXPIRED") {
      return res.json({
        success: true,
        alreadySubmitted: true,
        queued: false,
        status: attempt.status,
      });
    }

    const requestedReason = String(req.body?.reason || "STUDENT_SUBMIT");
    const allowedReasons = new Set([
      "STUDENT_SUBMIT",
      "AUTO_SUBMIT",
      "SECURITY_AUTO_SUBMIT",
    ]);
    const reason = allowedReasons.has(requestedReason)
      ? requestedReason
      : "STUDENT_SUBMIT";
    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];

    if (answers.length > 500) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Too many answer records were submitted.",
        });
    }

    await enqueueSubmission({
      attemptId,
      reason,
      answers,
      queuedAt: new Date().toISOString(),
    });

    return res.status(202).json({
      success: true,
      queued: true,
      status: "PROCESSING",
      message: "Assessment submission accepted and queued for processing.",
    });
  } catch (err) {
    console.error("QUEUE ASSESSMENT SUBMISSION ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ============================================================
   REPORT INFRACTION
============================================================ */

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

/* ============================================================
   ASSESSMENT SESSION HEARTBEAT
============================================================ */

exports.heartbeat = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt =
      req.assessmentAttempt || (await engine.getAttempt(attemptId));

    if (!attempt) {
      return res.status(404).json({
        success: false,
        code: "ATTEMPT_NOT_FOUND",
        message: "Assessment attempt not found.",
      });
    }

    /*
     * Get assessment duration.
     */

    const { data: assessment, error } = await assessmentService.getAssessment(
      attempt.assessment_id,
    );

    if (error || !assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    /*
     * Calculate the authoritative duration
     * for this particular attempt.
     */

    const allowedDurationSeconds = getAttemptAllowedDurationSeconds(
      assessment,
      attempt,
    );

    /*
     * Get authoritative Redis timer.
     */

    const remainingSeconds = await getSecondsRemaining(
      attemptId,
      allowedDurationSeconds,
    );

    /*
     * If time has expired, do NOT refresh
     * the session.
     */

    if (remainingSeconds <= 0 && attempt.status !== "SUBMITTED") {
      return res.json({
        success: false,
        expired: true,
        status: "EXPIRED",
        remainingSeconds: 0,
        message: "Assessment time completed. Submit the local answer snapshot.",
      });
    }

    /*
     * Refresh Redis session TTL.
     */

    const refreshed = await session.refreshSession(
      attempt.assessment_id,
      attempt.team_id || attempt.student_id,
      req.assessmentSessionId,
      Math.max(remainingSeconds, 1),
    );

    if (!refreshed) {
      return res.status(409).json({
        success: false,
        code: "SESSION_NOT_OWNER",
        message: "This assessment session is no longer active.",
      });
    }

    return res.json({
      success: true,
      remainingSeconds,
      status: attempt.status,
      currentQuestion: attempt.current_question,
      answeredQuestions: attempt.answered_questions,
    });
  } catch (err) {
    console.error("ASSESSMENT HEARTBEAT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
