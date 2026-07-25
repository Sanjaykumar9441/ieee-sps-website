const {
  createAssessmentSchema,
  updateAssessmentSchema,
} = require("../validators/assessmentValidator");

const assessmentService = require("../services/assessmentService");

/* ===========================
   CREATE ASSESSMENT
=========================== */

const createAssessment = async (req, res) => {
  try {
    const { error, value } = createAssessmentSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const assessment = await assessmentService.createAssessment(
      value,
      req.admin._id,
    );

    return res.status(201).json({
      success: true,
      message: "Assessment created successfully.",
      data: assessment,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create assessment.",
    });
  }
};

/* ===========================
   GET ALL ASSESSMENTS
=========================== */

const getAssessments = async (req, res) => {
  try {
    const result = await assessmentService.getAssessments(req.query);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch assessments.",
    });
  }
};

/* ===========================
   GET ASSESSMENT
=========================== */

const getAssessment = async (req, res) => {
  try {
    const assessment = await assessmentService.getAssessmentById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch assessment.",
    });
  }
};

/* ===========================
   UPDATE ASSESSMENT
=========================== */

const updateAssessment = async (req, res) => {
  try {
    const { error, value } = updateAssessmentSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const assessment = await assessmentService.updateAssessment(
      req.params.id,
      value,
      req.admin._id,
    );

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assessment updated successfully.",
      data: assessment,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update assessment.",
    });
  }
};

/* ===========================
   ARCHIVE ASSESSMENT
=========================== */

const archiveAssessment = async (req, res) => {
  try {
    const assessment = await assessmentService.archiveAssessment(
      req.params.id,
      req.admin._id,
    );

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assessment archived successfully.",
      data: assessment,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to archive assessment.",
    });
  }
};

/* ===========================
   CHANGE STATUS
=========================== */

const changeStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const assessment = await assessmentService.changeStatus(
      req.params.id,
      status,
      req.admin._id,
    );

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assessment status updated successfully.",
      data: assessment,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update assessment status.",
    });
  }
};

module.exports = {
  createAssessment,
  getAssessments,
  getAssessment,
  updateAssessment,
  archiveAssessment,
  changeStatus,
};
