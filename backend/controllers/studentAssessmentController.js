const assessmentService = require("../services/assessmentService");
const engine = require("../services/assessmentEngine");
const session = require("../services/studentSessionService");
const liveEvents = require("../services/liveEvents");
const antiCheat = require("../services/antiCheatService");
const { supabase } = require("../lib/supabase");
const scoring = require("../services/scoringService");
const crypto = require("crypto");
const {
  processSubmission,
  getSubmissionStatus,
} = require("../services/submissionQueue");

function getRemainingSecondsFromAttempt(attempt) {
  if (!attempt?.expires_at) return 0;
  return Math.max(
    0,
    Math.floor((new Date(attempt.expires_at).getTime() - Date.now()) / 1000),
  );
}

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
    if (now >= startTime && now < endTime) examStatus = "LIVE";
    else if (now >= endTime) examStatus = "CLOSED";

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
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.startAssessment = async (req, res) => {
  let lockAcquired = false;

  try {
    const { assessmentId } = req.params;
    const student = req.student;
    const teamId = student.team_id || null;
    const sessionId = crypto.randomUUID();

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

    const { data: submittedAttempt, error: submittedAttemptError } =
      await assessmentService.getSubmittedAttempt(
        assessment.id,
        student.id,
        teamId,
      );

    if (submittedAttemptError) throw submittedAttemptError;

    if (submittedAttempt) {
      return res.status(400).json({
        success: false,
        message: "Assessment already submitted.",
      });
    }

    const { data: runningAttempt, error: runningAttemptError } =
      await assessmentService.hasRunningAttempt(
        assessment.id,
        student.id,
        teamId,
      );

    if (runningAttemptError) throw runningAttemptError;

    if (runningAttempt) {
      return res.status(409).json({
        success: false,
        code: "ASSESSMENT_ALREADY_RUNNING",
        message: "Assessment already running. Resume the existing attempt.",
        attemptId: runningAttempt.id,
      });
    }

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

    const frozenQuestions = await engine.generateAttempt(assessment);

    const attempt = await engine.createAttempt(
      assessment,
      student,
      frozenQuestions,
      null,
      teamId,
    );

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
    return res.status(500).json({ success: false, message: err.message });
  }
};

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
    if (!attempt) throw new Error("Attempt not found after saving answer.");

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

    return res.json({ success: true, answer });
  } catch (err) {
    console.error("SAVE ANSWER CONTROLLER ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPaper = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const attempt =
      req.assessmentAttempt || (await engine.getAttempt(attemptId));

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found.",
      });
    }

    const { data: assessment } = await assessmentService.getAssessment(
      attempt.assessment_id,
    );
    getAttemptAllowedDurationSeconds(assessment, attempt);

    const remainingSeconds = getRemainingSecondsFromAttempt(attempt);
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

exports.getQuestion = async (req, res) => {
  try {
    const { attemptId, number } = req.params;
    const question = await engine.getQuestion(attemptId, Number(number));
    const attempt = await engine.getAttempt(attemptId);

    const { data: assessment } = await assessmentService.getAssessment(
      attempt.assessment_id,
    );
    getAttemptAllowedDurationSeconds(assessment, attempt);

    const remainingSeconds = getRemainingSecondsFromAttempt(attempt);
    await engine.updateCurrentQuestion(attemptId, Number(number));

    return res.json({ success: true, remainingSeconds, question });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPalette = async (req, res) => {
  try {
    const palette = await engine.getPalette(req.params.attemptId);
    return res.json({ success: true, palette });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const attempt =
      req.assessmentAttempt || (await engine.getAttempt(attemptId));

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found.",
      });
    }

    const { data: assessment } = await assessmentService.getAssessment(
      attempt.assessment_id,
    );
    getAttemptAllowedDurationSeconds(assessment, attempt);

    const remainingSeconds = getRemainingSecondsFromAttempt(attempt);

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

/*
 * Final submission is processed synchronously so the database status becomes
 * SUBMITTED before the response is returned. This prevents Live Monitor from
 * showing a student as LIVE while Redis submission processing is delayed.
 */
exports.submitAssessment = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const attempt =
      req.assessmentAttempt || (await engine.getAttempt(attemptId));

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found.",
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

    // IMPORTANT: timer/security auto-submit can race with the server's
    // expiry reconciliation. The reconciliation may mark the attempt
    // SUBMITTED before the browser's final answer snapshot arrives.
    // Persist that snapshot even when the attempt is already terminal, so
    // the admin question-wise review sees the same answers as a normal submit.
    if (attempt.status === "SUBMITTED") {
      if (answers.length) {
        const { data: attemptQuestions, error: questionError } = await supabase
          .from("assessment_attempt_questions")
          .select("id")
          .eq("attempt_id", attemptId);

        if (questionError) throw questionError;

        const validIds = new Set(
          (attemptQuestions || []).map((row) => String(row.id)),
        );
        const latest = new Map();

        for (const row of answers) {
          const id =
            row?.attemptQuestionId || row?.attempt_question_id || row?.id;
          if (!id || !validIds.has(String(id))) continue;

          const selected = Array.isArray(row.selectedAnswers)
            ? row.selectedAnswers
            : Array.isArray(row.selected_answers)
              ? row.selected_answers
              : [];

          latest.set(String(id), {
            attempt_question_id: id,
            selected_answers: selected,
            answered_at: new Date().toISOString(),
          });
        }

        const rows = [...latest.values()];
        if (rows.length) {
          const { error: answerError } = await supabase
            .from("assessment_answers")
            .upsert(rows, { onConflict: "attempt_question_id" });
          if (answerError) throw answerError;
        }

        // If this was an auto/security submission, refresh the stored score
        // from the final browser snapshot as well. This covers the race where
        // expiry reconciliation submitted first using an older DB snapshot.
        if (reason !== "STUDENT_SUBMIT") {
          const result = await scoring.calculateScoreFromAnswers(
            attemptId,
            answers,
          );

          const { data: refreshedAttempt, error: refreshError } = await supabase
            .from("assessment_attempts")
            .update({
              score: result.score,
              correct: result.correct,
              wrong: result.wrong,
              unanswered: result.unanswered,
              answered_questions: result.answeredQuestions,
              percentage: result.percentage,
            })
            .eq("id", attemptId)
            .select()
            .single();

          if (refreshError) throw refreshError;

          liveEvents.emitSubmitted(attempt.assessment_id, refreshedAttempt);
          liveEvents.emitStudentSubmitted(attempt.assessment_id);
          liveEvents.emitDashboardRefresh(attempt.assessment_id);
          liveEvents.emitLeaderboard(attempt.assessment_id, []);

          return res.json({
            success: true,
            alreadySubmitted: true,
            queued: false,
            status: "SUBMITTED",
            submittedAt: refreshedAttempt.submitted_at || null,
            attempt: refreshedAttempt,
            message: "Assessment auto-submitted successfully.",
          });
        }
      }

      return res.json({
        success: true,
        alreadySubmitted: true,
        queued: false,
        status: "SUBMITTED",
        submittedAt: attempt.submitted_at || null,
      });
    }

    if (answers.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Too many answer records were submitted.",
      });
    }

    const updatedAttempt = await processSubmission({
      attemptId,
      reason,
      answers,
      queuedAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      queued: false,
      status: updatedAttempt?.status || "SUBMITTED",
      submittedAt: updatedAttempt?.submitted_at || null,
      attempt: updatedAttempt || null,
      message: "Assessment submitted successfully.",
    });
  } catch (err) {
    console.error("ASSESSMENT SUBMISSION ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

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

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInfractions = async (req, res) => {
  try {
    const infractions = await antiCheat.getAttemptInfractions(
      req.params.attemptId,
    );
    return res.json({ success: true, infractions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.resetInfractions = async (req, res) => {
  try {
    await antiCheat.resetInfractions(req.params.attemptId);
    return res.json({
      success: true,
      message: "Infractions reset successfully.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAntiCheatConfig = async (req, res) => {
  try {
    return res.json({ success: true, config: antiCheat.getConfiguration() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

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

    const { data: assessment, error } = await assessmentService.getAssessment(
      attempt.assessment_id,
    );

    if (error || !assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    getAttemptAllowedDurationSeconds(assessment, attempt);
    const remainingSeconds = getRemainingSecondsFromAttempt(attempt);

    if (remainingSeconds <= 0 && attempt.status !== "SUBMITTED") {
      return res.json({
        success: false,
        expired: true,
        status: "EXPIRED",
        remainingSeconds: 0,
        message: "Assessment time completed. Submit the local answer snapshot.",
      });
    }

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
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSubmissionQueueStatus = async (req, res) => {
  try {
    const { attemptId } = req.params;

    if (!attemptId) {
      return res.status(400).json({
        success: false,
        message: "Attempt ID is required.",
      });
    }

    const attempt =
      req.assessmentAttempt || (await engine.getAttempt(attemptId));

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found.",
      });
    }

    const job = await getSubmissionStatus(attemptId);

    return res.json({
      success: true,
      attemptId,
      status: attempt.status,
      queued: Boolean(job),
      submission: job,
    });
  } catch (err) {
    console.error("GET SUBMISSION QUEUE STATUS ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
