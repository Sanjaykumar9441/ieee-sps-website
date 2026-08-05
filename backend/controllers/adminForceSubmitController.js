const engine = require("../services/assessmentEngine");
const scoring = require("../services/scoringService");
const session = require("../services/studentSessionService");
const liveEvents = require("../services/liveEvents");

exports.forceSubmit = async (req, res) => {
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
      return res.json({
        success: true,
        message: "Already submitted",
      });
    }

    const result = await scoring.calculateScore(attemptId);

    const updated = await engine.finishAttempt(attemptId, result.score);

    await session.unlockStudent(updated.assessment_id, updated.student_id);

    liveEvents.emitSubmitted(updated.assessment_id, updated);

    res.json({
      success: true,
      message: "Assessment force submitted.",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const supabase = require("../lib/supabase");

exports.forceSubmitAll = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const { data: attempts } = await supabase

      .from("assessment_attempts")

      .select("*")

      .eq("assessment_id", assessmentId)

      .eq("status", "in_progress");

    for (const attempt of attempts) {
      const result = await scoring.calculateScore(attempt.id);

      const updated = await engine.finishAttempt(attempt.id, result.score);

      await session.unlockStudent(updated.assessment_id, updated.student_id);
    }

    liveEvents.emitSubmitted(assessmentId, {
      forceSubmitAll: true,
    });

    res.json({
      success: true,

      submitted: attempts.length,
    });
  } catch (err) {
    res.status(500).json({
      success: false,

      message: err.message,
    });
  }
};
