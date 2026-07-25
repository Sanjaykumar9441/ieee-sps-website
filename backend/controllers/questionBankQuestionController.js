const {
  createQuestionBankQuestionSchema,
} = require("../validators/questionBankQuestionValidator");

const questionBankQuestionService = require(
  "../services/questionBankQuestionService"
);

/* ===========================
   ADD QUESTIONS TO BANK
=========================== */

const addQuestionsToBank = async (req, res) => {
  try {
    const { error, value } =
      createQuestionBankQuestionSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const mappings =
      await questionBankQuestionService.addQuestionsToBank(
        value.questionBank,
        value.questions,
        req.admin._id
      );

    return res.status(201).json({
      success: true,
      message: "Questions added successfully.",
      data: mappings,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to add questions.",
    });
  }
};

/* ===========================
   GET QUESTIONS OF BANK
=========================== */

const getQuestionsByBank = async (req, res) => {
  try {
    const questions =
      await questionBankQuestionService.getQuestionsByBank(
        req.params.bankId
      );

    return res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions.",
    });
  }
};

/* ===========================
   GET BANKS OF QUESTION
=========================== */

const getBanksByQuestion = async (req, res) => {
  try {
    const banks =
      await questionBankQuestionService.getBanksByQuestion(
        req.params.questionId
      );

    return res.status(200).json({
      success: true,
      data: banks,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch banks.",
    });
  }
};

/* ===========================
   REMOVE QUESTION FROM BANK
=========================== */

const removeQuestionFromBank = async (req, res) => {
  try {
    const mapping =
      await questionBankQuestionService.removeQuestionFromBank(
        req.params.id
      );

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: "Mapping not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question removed from bank successfully.",
      data: mapping,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove question.",
    });
  }
};

module.exports = {
  addQuestionsToBank,
  getQuestionsByBank,
  getBanksByQuestion,
  removeQuestionFromBank,
};