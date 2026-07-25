const QuestionBankQuestion = require("../models/QuestionBankQuestion");

/* ===========================
   ADD QUESTIONS TO BANK
=========================== */

const addQuestionsToBank = async (questionBank, questions, adminId) => {
  // Get all existing mappings in ONE query
  const existingMappings = await QuestionBankQuestion.find({
    questionBank,
    question: { $in: questions },
  }).select("question");

  // Convert existing question IDs into a Set
  const existingQuestionIds = new Set(
    existingMappings.map((item) => item.question.toString()),
  );

  // Prepare only new mappings
  const documents = questions
    .filter(
      (questionId) => !existingQuestionIds.has(questionId.toString()),
    )
    .map((questionId) => ({
      questionBank,
      question: questionId,
      addedBy: adminId,
    }));

  // Nothing new to insert
  if (documents.length === 0) {
    return {
      insertedCount: 0,
      skippedCount: questions.length,
      inserted: [],
    };
  }

  // Insert all new mappings in one operation
  const insertedDocuments = await QuestionBankQuestion.insertMany(documents, {
    ordered: false,
  });

  // Return summary
  return {
    insertedCount: insertedDocuments.length,
    skippedCount: questions.length - insertedDocuments.length,
    inserted: insertedDocuments,
  };
};

/* ===========================
   GET QUESTIONS OF BANK
=========================== */

const getQuestionsByBank = async (questionBank) => {
  return await QuestionBankQuestion.find({
    questionBank,
    isActive: true,
  })
    .populate("question")
    .sort({ order: 1 });
};

/* ===========================
   GET BANKS OF QUESTION
=========================== */

const getBanksByQuestion = async (question) => {
  return await QuestionBankQuestion.find({
    question,
    isActive: true,
  })
    .populate("questionBank", "name")
    .sort({ createdAt: -1 });
};

/* ===========================
   REMOVE QUESTION FROM BANK
=========================== */

const removeQuestionFromBank = async (id) => {
  return await QuestionBankQuestion.findByIdAndUpdate(
    id,
    {
      isActive: false,
    },
    {
      new: true,
    },
  );
};

module.exports = {
  addQuestionsToBank,
  getQuestionsByBank,
  getBanksByQuestion,
  removeQuestionFromBank,
};
