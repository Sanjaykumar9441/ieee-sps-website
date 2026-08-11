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

exports.getCategories = async (req, res) => {
  try {
    const { data, error } = await Assessment.getCategories();

    if (error) throw error;

    return res.json({
      success: true,
      categories: data || [],
    });
  } catch (err) {
    console.error("Get assessment categories error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getSubjects = async (req, res) => {
  try {
    const { category_id } = req.query;

    const { data, error } = await Assessment.getSubjects(category_id || null);

    if (error) throw error;

    return res.json({
      success: true,
      subjects: data || [],
    });
  } catch (err) {
    console.error("Get assessment subjects error:", err);

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

    console.log("========== CREATE ASSESSMENT ==========");
    console.log("REQUEST BODY:", body);
    console.log("CATEGORY ID:", body.category_id);
    console.log("SUBJECT ID:", body.subject_id);

    // --------------------------------------------------
    // Required validation
    // --------------------------------------------------

    if (!body.title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Assessment title is required.",
      });
    }

    if (!body.category_id) {
      return res.status(400).json({
        success: false,
        message: "Assessment category is required.",
      });
    }

    if (!body.subject_id) {
      return res.status(400).json({
        success: false,
        message: "Assessment subject is required.",
      });
    }

    // --------------------------------------------------
    // Verify subject belongs to selected category
    // --------------------------------------------------

    const { data: subject, error: subjectError } =
      await Assessment.getSubjectById(body.subject_id);

    if (subjectError) {
      console.error("SUBJECT LOOKUP ERROR:", subjectError);

      return res.status(500).json({
        success: false,
        message: subjectError.message,
      });
    }

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: "Selected subject does not exist.",
      });
    }

    if (subject.category_id !== body.category_id) {
      return res.status(400).json({
        success: false,
        message: "Selected subject does not belong to the selected category.",
      });
    }

    // --------------------------------------------------
    // Calculate passing score
    // --------------------------------------------------

    if (body.passing_score == null && body.pass_percentage != null) {
      body.passing_score =
        (Number(body.total_questions) *
          Number(body.marks_per_question) *
          Number(body.pass_percentage)) /
        100;
    }

    // --------------------------------------------------
    // Explicitly normalize IDs
    // --------------------------------------------------

    body.category_id = String(body.category_id).trim();
    body.subject_id = String(body.subject_id).trim();

    console.log("FINAL ASSESSMENT PAYLOAD:", body);

    // --------------------------------------------------
    // Create assessment
    // --------------------------------------------------

    const { data, error } = await Assessment.create(body);

    if (error) {
      console.error("ASSESSMENT SUPABASE ERROR:", error);
      throw error;
    }

    console.log("CREATED ASSESSMENT:", data);

    // --------------------------------------------------
    // Safety check
    // --------------------------------------------------

    if (!data?.subject_id) {
      console.error(
        "CRITICAL: Assessment was created without subject_id:",
        data,
      );

      return res.status(500).json({
        success: false,
        message: "Assessment was created, but subject_id was not saved.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Assessment created successfully.",
      assessment: data,
    });
  } catch (err) {
    console.error("CREATE ASSESSMENT ERROR:", err);

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
