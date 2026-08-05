const Assessment = require("../models/Assessment");

exports.getAssessments = async (req, res) => {
  try {
    const { data, error } = await Assessment.getAll();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await Assessment.getById(id);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.createAssessment = async (req, res) => {
  try {
    const body = req.body;

    const { data, error } = await Assessment.create(body);

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await Assessment.update(id, req.body);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await Assessment.delete(id);

    if (error) throw error;

    res.json({
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.restoreAssessment = async (req, res) => {
  try {
    const { data, error } = await Assessment.restore(req.params.id);

    if (error) throw error;

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.duplicateAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await Assessment.duplicate(id);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.activateAssessment = async (req, res) => {
  const { data, error } = await Assessment.activate(req.params.id);

  if (error) return res.status(500).json(error);

  res.json(data);
};

exports.deactivateAssessment = async (req, res) => {
  const { data, error } = await Assessment.deactivate(req.params.id);

  if (error) return res.status(500).json(error);

  res.json(data);
};

exports.publishAssessment = async (req, res) => {
  const { data, error } = await Assessment.publish(req.params.id);

  if (error) return res.status(500).json(error);

  res.json(data);
};

exports.unpublishAssessment = async (req, res) => {
  const { data, error } = await Assessment.unpublish(req.params.id);

  if (error) return res.status(500).json(error);

  res.json(data);
};

exports.archiveAssessment = async (req, res) => {
  const { error } = await Assessment.archive(req.params.id);

  if (error) return res.status(500).json(error);

  res.json({
    success: true,
  });
};

exports.statistics = async (req, res) => {
  const { data, error } = await Assessment.statistics(req.params.id);

  if (error) return res.status(500).json(error);

  res.json(data);
};

exports.resetAssessment = async (req, res) => {
  try {
    const { data, error } = await Assessment.reset(req.params.id);

    if (error) throw error;

    return res.json({
      success: true,
      message: "Assessment reset successfully.",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
