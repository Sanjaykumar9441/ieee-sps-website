const Assessment = require("../models/Assessment");

exports.getAssessments = async (req, res) => {
  try {
    const { data, error } = await Assessment.getAll();

    if (error) throw error;

    return res.json({
      success: true,
      assessments: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.getById(id);

    if (error) throw error;

    return res.json({
      success: true,
      assessment: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.createAssessment = async (req, res) => {
  try {
    const body = { ...req.body };

    if (body.passing_score == null && body.pass_percentage != null) {
      body.passing_score =
        (body.total_questions *
          body.marks_per_question *
          body.pass_percentage) /
        100;
    }

    const { data, error } = await Assessment.create(body);

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Assessment created successfully.",
      assessment: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.update(id, req.body);

    if (error) throw error;

    return res.json({
      success: true,
      message: "Assessment updated successfully.",
      assessment: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { error } = await Assessment.delete(id);

    if (error) throw error;

    return res.json({
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.restoreAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.restore(id);

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

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.duplicate(id);

    if (error) throw error;

    return res.json({
      success: true,
      message: "Assessment duplicated successfully.",
      assessment: data,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

exports.activateAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.activate(id);

    if (error) throw error;

    return res.json(data);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deactivateAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.deactivate(id);

    if (error) throw error;

    return res.json(data);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.publishAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.publish(id);

    if (error) throw error;

    return res.json(data);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.unpublishAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.unpublish(id);

    if (error) throw error;

    return res.json(data);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.archiveAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { error } = await Assessment.archive(id);
    if (error) throw error;

    return res.json({
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.resetAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.reset(id);

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

exports.statistics = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.statistics(id);
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

exports.history = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.history(id);

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
