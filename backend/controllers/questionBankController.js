const QuestionBank = require("../models/QuestionBank");

exports.list = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const { data, error } = await QuestionBank.getAll(assessmentId);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.create = async (req, res) => {
  try {
    const body = req.body;

    const { data, error } = await QuestionBank.create(body);

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.update = async (req, res) => {
  const { data, error } = await QuestionBank.update(req.params.id, req.body);

  if (error) return res.status(500).json(error);

  res.json(data);
};

exports.delete = async (req, res) => {
  const { error } = await QuestionBank.delete(req.params.id);

  if (error) return res.status(500).json(error);

  res.json({
    success: true,
  });
};
