const QuestionBank = require("../models/QuestionBank");
const liveEvents = require("../services/liveEvents");

function normalizeDifficulty(value) {
  const raw = String(value || "MEDIUM").trim().toUpperCase();
  return ["EASY", "MEDIUM", "HARD"].includes(raw) ? raw : "MEDIUM";
}

exports.list = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await QuestionBank.getAll(assessmentId);
    if (error) throw error;

    return res.json({
      success: true,
      questionBanks: data || [],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.create = async (req, res) => {
  try {
    const body = req.body || {};

    if (!body.assessment_id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    if (!String(body.name || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Question bank name is required.",
      });
    }

    const questionsToPick = Number(body.questions_to_pick);
    if (!Number.isInteger(questionsToPick) || questionsToPick < 1) {
      return res.status(400).json({
        success: false,
        message: "Questions to pick must be at least 1.",
      });
    }

    const payload = {
      assessment_id: body.assessment_id,
      name: String(body.name).trim(),
      description: body.description || null,
      difficulty: normalizeDifficulty(body.difficulty),
      estimated_minutes: Number(body.estimated_minutes || 30),
      questions_to_pick: questionsToPick,
    };

    const { data, error } = await QuestionBank.create(payload);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: error.code || null,
        details: error.details || null,
        hint: error.hint || null,
      });
    }

    liveEvents.emitQuestionBankCreated?.(body.assessment_id, data);

    return res.status(201).json({
      success: true,
      message: "Question bank created successfully.",
      questionBank: data,
    });
  } catch (err) {
    console.error("CREATE QUESTION BANK ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Question Bank ID is required.",
      });
    }

    const payload = {
      ...req.body,
      ...(req.body.difficulty !== undefined
        ? { difficulty: normalizeDifficulty(req.body.difficulty) }
        : {}),
      ...(req.body.questions_to_pick !== undefined
        ? { questions_to_pick: Number(req.body.questions_to_pick) }
        : {}),
    };

    if (
      payload.questions_to_pick !== undefined &&
      (!Number.isInteger(payload.questions_to_pick) || payload.questions_to_pick < 1)
    ) {
      return res.status(400).json({
        success: false,
        message: "Questions to pick must be at least 1.",
      });
    }

    const { data, error } = await QuestionBank.update(id, payload);
    if (error) throw error;

    const assessmentId =
      req.body.assessment_id ||
      (await QuestionBank.get(id)).data?.assessment_id;

    liveEvents.emitQuestionBankUpdated?.(assessmentId, data);

    return res.json({
      success: true,
      message: "Question bank updated successfully.",
      questionBank: data,
    });
  } catch (err) {
    console.error("UPDATE QUESTION BANK ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.duplicate = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await QuestionBank.duplicate(id);
    if (error) throw error;

    liveEvents.emitQuestionBankCreated?.(data.assessmentId, data.questionBank);

    return res.status(201).json({
      success: true,
      message: "Question bank duplicated successfully.",
      questionBank: data.questionBank,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await QuestionBank.delete(id);
    if (error) throw error;

    liveEvents.emitQuestionBankDeleted?.(data.assessmentId, data.questionBank);

    return res.json({
      success: true,
      message: "Question bank deleted successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
