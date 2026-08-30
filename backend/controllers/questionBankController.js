const QuestionBank = require("../models/QuestionBank");
const Question = require("../models/Question");
const liveEvents = require("../services/liveEvents");

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

    return res.json({ success: true, questionBanks: data || [] });
  } catch (err) {
    console.error("LIST QUESTION BANKS ERROR:", err);
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

    if (!body.name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question bank name is required.",
      });
    }

    const pick = Number(body.questions_to_pick);
    if (!Number.isInteger(pick) || pick < 1) {
      return res.status(400).json({
        success: false,
        message: "Questions to pick must be at least 1.",
      });
    }

    const { data, error } = await QuestionBank.create({
      ...body,
      questions_to_pick: pick,
    });

    if (error) {
      console.error("QUESTION BANK SUPABASE ERROR:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
        code: error.code || null,
        details: error.details || null,
        hint: error.hint || null,
      });
    }

    liveEvents.emitQuestionBankCreated(body.assessment_id, data);

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
    const { data, error } = await QuestionBank.update(id, req.body || {});
    if (error) throw error;

    if (req.body?.assessment_id) {
      liveEvents.emitQuestionBankUpdated(req.body.assessment_id, data);
    }

    return res.json({
      success: true,
      message: "Question bank updated successfully.",
      questionBank: data,
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

    if (data?.assessmentId) {
      liveEvents.emitQuestionBankDeleted(
        data.assessmentId,
        data.questionBank,
      );
    }

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
