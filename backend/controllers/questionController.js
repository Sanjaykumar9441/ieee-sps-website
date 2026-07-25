const {
  createQuestionSchema,
  updateQuestionSchema,
} = require("../validators/questionValidator");

const questionService = require("../services/questionService");

/* ===========================
   CREATE QUESTION
=========================== */

const createQuestion = async (req, res) => {
  try {
    const { error, value } =
      createQuestionSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const question =
      await questionService.createQuestion(
        value,
        req.admin._id
      );

    return res.status(201).json({
      success: true,
      message: "Question created successfully.",
      data: question,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create question.",
    });
  }
};

const addQuestionsToBank = async (req, res) => {
  try {
    const { questionBank, questions } = req.body;

    const result = await questionBankQuestionService.addQuestionsToBank(
      questionBank,
      questions,
      req.admin._id
    );

    return res.status(200).json({
      success: true,
      message: "Questions added successfully.",
      data: result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to add questions to question bank.",
    });
  }
};

/* ===========================
   GET QUESTION
=========================== */

const getQuestion = async (req, res) => {
  try {
    const question =
      await questionService.getQuestionById(
        req.params.id
      );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch question.",
    });
  }
};

/* ===========================
   UPDATE QUESTION
=========================== */

const updateQuestion = async (req, res) => {
  try {
    const { error, value } =
      updateQuestionSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const question =
      await questionService.updateQuestion(
        req.params.id,
        value,
        req.admin._id
      );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question updated successfully.",
      data: question,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update question.",
    });
  }
};

/* ===========================
   ARCHIVE QUESTION
=========================== */

const archiveQuestion = async (req, res) => {
  try {
    const question =
      await questionService.archiveQuestion(
        req.params.id,
        req.admin._id
      );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question archived successfully.",
      data: question,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to archive question.",
    });
  }
};

/* ===========================
   CHANGE STATUS
=========================== */

const changeStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const question =
      await questionService.changeStatus(
        req.params.id,
        status,
        req.admin._id
      );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question status updated successfully.",
      data: question,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update question status.",
    });
  }
};

module.exports = {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  archiveQuestion,
  changeStatus,
};