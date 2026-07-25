const {
  createQuestionBankSchema,
  updateQuestionBankSchema,
} = require("../validators/questionBankValidator");

const questionBankService = require("../services/questionBankService");

/* ===========================
   CREATE QUESTION BANK
=========================== */

const createQuestionBank = async (req, res) => {
  try {
    const { error, value } =
      createQuestionBankSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const questionBank =
      await questionBankService.createQuestionBank(
        value,
        req.admin._id
      );

    res.status(201).json({
      success: true,
      message: "Question bank created successfully.",
      data: questionBank,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to create question bank.",
    });
  }
};

/* ===========================
   GET ALL QUESTION BANKS
=========================== */

const getQuestionBanks = async (req, res) => {
  try {
    const questionBanks =
      await questionBankService.getQuestionBanks();

    res.json({
      success: true,
      data: questionBanks,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch question banks.",
    });
  }
};

/* ===========================
   GET QUESTION BANK
=========================== */

const getQuestionBank = async (req, res) => {
  try {
    const questionBank =
      await questionBankService.getQuestionBankById(
        req.params.id
      );

    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: "Question bank not found.",
      });
    }

    res.json({
      success: true,
      data: questionBank,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch question bank.",
    });
  }
};

/* ===========================
   UPDATE QUESTION BANK
=========================== */

const updateQuestionBank = async (req, res) => {
  try {
    const { error, value } =
      updateQuestionBankSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const questionBank =
      await questionBankService.updateQuestionBank(
        req.params.id,
        value,
        req.admin._id
      );

    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: "Question bank not found.",
      });
    }

    res.json({
      success: true,
      message: "Question bank updated successfully.",
      data: questionBank,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to update question bank.",
    });
  }
};

/* ===========================
   ARCHIVE QUESTION BANK
=========================== */

const archiveQuestionBank = async (req, res) => {
  try {
    const questionBank =
      await questionBankService.archiveQuestionBank(
        req.params.id,
        req.admin._id
      );

    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: "Question bank not found.",
      });
    }

    res.json({
      success: true,
      message: "Question bank archived successfully.",
      data: questionBank,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to archive question bank.",
    });
  }
};

/* ===========================
   CHANGE STATUS
=========================== */

const changeStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const questionBank =
      await questionBankService.changeStatus(
        req.params.id,
        status,
        req.admin._id
      );

    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: "Question bank not found.",
      });
    }

    res.json({
      success: true,
      message: "Status updated successfully.",
      data: questionBank,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to change status.",
    });
  }
};

module.exports = {
  createQuestionBank,
  getQuestionBanks,
  getQuestionBank,
  updateQuestionBank,
  archiveQuestionBank,
  changeStatus,
};