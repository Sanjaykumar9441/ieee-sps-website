const Question = require("../models/Question");

exports.list = async (req, res) => {
  try {
    const { questionBankId } = req.params;

    if (!questionBankId) {
      return res.status(400).json({
        success: false,
        message: "Question Bank ID is required.",
      });
    }

    const { data, error } = await Question.getAll(questionBankId);

    if (error) throw error;

    return res.json({
      success: true,
      questions: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.get = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required.",
      });
    }

    const { data, error } = await Question.getById(id);

    if (error) throw error;

    return res.json({
      success: true,
      question: data,
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
    const { data, error } = await Question.create(req.body);

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Question created successfully.",
      question: data,
    });
  } catch (err) {
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
        message: "Question ID is required.",
      });
    }

    const { data, error } = await Question.update(id, req.body);

    if (error) throw error;

    return res.json({
      success: true,
      message: "Question updated successfully.",
      question: data,
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

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required.",
      });
    }

    const { error } = await Question.delete(id);

    if (error) throw error;

    return res.json({
      success: true,
      message: "Question deleted successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.duplicate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required.",
      });
    }

    const { data, error } = await Question.duplicate(id);

    if (error) throw error;

    return res.json({
      success: true,
      message: "Question duplicated successfully.",
      question: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.search = async (req, res) => {
  try {
    const { questionBankId } = req.params;
    const { keyword } = req.query;

    if (!questionBankId) {
      return res.status(400).json({
        success: false,
        message: "Question Bank ID is required.",
      });
    }

    const { data, error } = await Question.search(
      questionBankId,
      keyword || ""
    );

    if (error) throw error;

    return res.json({
      success: true,
      questions: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};