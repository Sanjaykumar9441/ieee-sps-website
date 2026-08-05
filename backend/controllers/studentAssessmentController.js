const assessmentService = require("../services/assessmentService");
const engine = require("../services/assessmentEngine");
const session = require("../services/studentSessionService");
const scoring = require("../services/scoringService");
const { setAttemptStartTime, getSecondsRemaining } = require("../lib/redis");
const { supabase } = require("../config/supabase");
const liveEvents = require("../services/liveEvents");

exports.checkAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const { data, error } = await assessmentService.getAssessment(assessmentId);

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    if (!data.is_active) {
      return res.status(400).json({
        success: false,
        message: "Assessment is inactive",
      });
    }

    res.json({
      success: true,
      assessment: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.startAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const student = req.student;

    const { data: assessment } =
      await assessmentService.getAssessment(assessmentId);

    const questions = await engine.generateAttempt(assessment, student);

    const attempt = await engine.createAttempt(assessment, student, questions);

    await engine.storeQuestions(attempt.id, questions);

    await setAttemptStartTime(
      attempt.id,

      assessment.duration_seconds,
    );

    await session.lockStudent(
      assessment.id,

      student.id,

      assessment.duration_seconds,
    );

    res.json({
      success: true,

      attemptId: attempt.id,

      remainingSeconds: assessment.duration_seconds,

      currentQuestion: 1,

      totalQuestions: questions.length,

      question: questions[0],
    });
  } catch (err) {
    res.status(500).json({
      success: false,

      message: err.message,
    });
  }
};

exports.saveAnswer = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const { attemptQuestionId, selectedKey } = req.body;

    const answer = await engine.saveAnswer(
      attemptId,
      attemptQuestionId,
      selectedKey,
    );

    const attempt = await engine.getAttempt(attemptId);

    liveEvents.emitAnswerSaved(attempt.assessment_id, {
      attemptId,
      attemptQuestionId,
      selectedKey,
    });

    liveEvents.emitProgress(attempt.assessment_id, {
      attemptId,
      studentId: attempt.student_id,
      currentQuestion: attempt.current_question,
      answeredQuestions: attempt.answered_questions,
    });

    res.json({
      success: true,
      answer,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getQuestion = async (req, res) => {
  try {
    const { attemptId, number } = req.params;

    const question = await engine.getQuestion(attemptId, Number(number));

    const attempt = await engine.getAttempt(attemptId);

    const assessment = await assessmentService.getAssessment(
      attempt.assessment_id,
    );

    const remainingSeconds = await getSecondsRemaining(
      attemptId,
      assessment.data.duration_seconds,
    );

    res.json({
      ...question,
      remainingSeconds,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getPalette = async (req, res) => {
  try {
    const palette = await engine.getPalette(req.params.attemptId);

    res.json(palette);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const { attemptId } = req.params;

    // Get attempt
    const { data: attempt } = await supabase
      .from("assessment_attempts")
      .select("*")
      .eq("id", attemptId)
      .single();

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found",
      });
    }

    // Get assessment
    const { data: assessment } = await supabase
      .from("assessments")
      .select("duration_seconds")
      .eq("id", attempt.assessment_id)
      .single();

    const timerService = require("../services/timerService");

    const remainingSeconds = await timerService.getRemainingTime(attempt);

    /* ==========================
   Emit Live Timer
========================== */

    liveEvents.emitTimer(attempt.assessment_id, {
      attemptId,
      remainingSeconds,
    });

    /* ==========================
   Auto Submit
========================== */

    if (remainingSeconds <= 0) {
      const result = await scoring.calculateScore(attemptId);

      const updatedAttempt = await engine.finishAttempt(
        attemptId,
        result.score,
      );

      await session.unlockStudent(
        updatedAttempt.assessment_id,
        updatedAttempt.student_id,
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
    const answered = palette.filter((q) => q.answers.length > 0).length;

    res.json({
      success: true,
      remainingSeconds,
      answered,
      totalQuestions: palette.length,
      palette,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.submitAssessment = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const attempt = await engine.getAttempt(attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,

        message: "Attempt not found",
      });
    }

    if (attempt.status === "submitted") {
      return res.status(400).json({
        success: false,

        message: "Assessment already submitted",
      });
    }

    const result = await scoring.calculateScore(attemptId);

    const updatedAttempt = await engine.finishAttempt(attemptId, result.score);

    const supabase = require("../lib/supabase");

    const { data: leaderboard } = await supabase
      .from("live_leaderboard")
      .select("*")
      .eq("assessment_id", updatedAttempt.assessment_id)
      .order("rank");

    liveEvents.emitLeaderboard(updatedAttempt.assessment_id, leaderboard);

    /*
         Release Redis Lock
        */

    await session.unlockStudent(
      updatedAttempt.assessment_id,
      updatedAttempt.student_id,
    );

    /*
         Notify Dashboard
        */

    liveEvents.emitSubmitted(updatedAttempt.assessment_id, updatedAttempt);
    liveEvents.emitStudentSubmitted(updatedAttempt.assessment_id);

    const { data: analytics } = await supabase
      .from("live_dashboard")
      .select("*")
      .eq("assessment_id", updatedAttempt.assessment_id)
      .single();

    liveEvents.emitDashboardAnalytics(updatedAttempt.assessment_id, analytics);

    res.json({
      success: true,

      score: result.score,

      correct: result.correct,

      wrong: result.wrong,

      unanswered: result.unanswered,

      submittedAt: updatedAttempt.submitted_at,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,

      message: err.message,
    });
  }
};
