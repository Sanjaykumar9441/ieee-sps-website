const QuestionBank = require("../models/QuestionBank");
const Question = require("../models/Question");
const liveEvents = require("../services/liveEvents");

function normalizeQuestion(question, bankId) {
  return {
    bank_id: bankId,

    question_type: question.question_type || "MCQ",

    question_text: String(question.question_text || "").trim(),

    question_image_id: question.question_image_id || null,

    options: Array.isArray(question.options) ? question.options : [],

    correct_answers: Array.isArray(question.correct_answers)
      ? question.correct_answers
      : [],

    explanation: question.explanation || null,

    difficulty: question.difficulty || "MEDIUM",

    marks: Number(question.marks || 1),

    negative_marks: Number(question.negative_marks || 0),

    estimated_seconds: Number(question.estimated_seconds || 60),

    tags: question.tags || [],

    language: question.language || "English",

    version: Number(question.version || 1),

    is_active: true,
  };
}

function validateQuestion(question, index) {
  const errors = [];

  if (!question.question_text?.trim()) {
    errors.push("Question text is required.");
  }

  if (!question.question_type) {
    errors.push("Question type is required.");
  }

  if (
    !Array.isArray(question.correct_answers) ||
    question.correct_answers.length === 0
  ) {
    errors.push("Correct answer is required.");
  }

  if (
    question.question_type === "MCQ" &&
    (!Array.isArray(question.options) || question.options.length < 2)
  ) {
    errors.push("MCQ must contain at least 2 options.");
  }

  if (
    question.question_type === "MCQ" &&
    Array.isArray(question.correct_answers) &&
    question.correct_answers.some(
      (answer) => !question.options.includes(answer),
    )
  ) {
    errors.push("Correct answer must match one of the options.");
  }

  if (Number(question.marks) <= 0) {
    errors.push("Marks must be greater than 0.");
  }

  return {
    question: `Question ${index + 1}`,
    status: errors.length === 0 ? "valid" : "invalid",
    message: errors.length === 0 ? "Question is valid." : errors.join(" "),
  };
}

exports.list = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await QuestionBank.getAll(assessmentId);

    if (error) throw error;

    return res.json({
      success: true,
      questionBanks: data,
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
    const body = req.body;

    const { data, error } = await QuestionBank.create(body);

    if (error) throw error;

    liveEvents.emitQuestionBankCreated(body.assessment_id, data);

    return res.status(201).json({
      success: true,
      message: "Question bank created successfully.",
      questionBank: data,
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
        message: "Question Bank ID is required.",
      });
    }

    const { data, error } = await QuestionBank.update(id, req.body);

    if (error) throw error;

    liveEvents.emitQuestionBankUpdated(req.body.assessment_id, data);

    return res.json({
      success: true,
      message: "Question bank updated successfully.",
      questionBank: data,
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
        message: "Question Bank ID is required.",
      });
    }

    const { data, error } = await QuestionBank.duplicate(id);

    if (error) throw error;

    liveEvents.emitQuestionBankCreated(data.assessmentId, data.questionBank);

    return res.status(201).json({
      success: true,
      message: "Question bank duplicated successfully.",
      questionBank: data.questionBank,
    });
  } catch (err) {
    console.error("Duplicate Question Bank Error:", err);

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
        message: "Question Bank ID is required.",
      });
    }

    const { data, error } = await QuestionBank.delete(id);

    if (error) throw error;

    liveEvents.emitQuestionBankDeleted(data.assessmentId, data.questionBank);

    return res.json({
      success: true,
      message: "Question bank deleted successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================================================
IMPORT QUESTIONS - RECEIVE PREVIEW
============================================================ */

exports.importQuestions = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body;

    if (!bankId) {
      return res.status(400).json({
        success: false,
        message: "Question Bank ID is required.",
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No questions supplied.",
      });
    }

    const normalizedQuestions = questions.map((question) =>
      normalizeQuestion(question, bankId),
    );

    return res.json({
      success: true,
      message: "Questions received successfully.",
      questions: normalizedQuestions,
      total: normalizedQuestions.length,
    });
  } catch (err) {
    console.error("Import Questions Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================================================
DUPLICATE CHECK
============================================================ */

exports.checkDuplicates = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body;

    if (!bankId) {
      return res.status(400).json({
        success: false,
        message: "Question Bank ID is required.",
      });
    }

    if (!Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: "Questions array is required.",
      });
    }

    const { data: existingQuestions, error } = await Question.getAll(bankId);

    if (error) throw error;

    const duplicates = [];

    for (const question of questions) {
      const incomingText = question.question_text?.trim().toLowerCase();

      if (!incomingText) continue;

      const match = (existingQuestions || []).find(
        (existing) =>
          existing.question_text?.trim().toLowerCase() === incomingText,
      );

      if (match) {
        duplicates.push({
          question: question.question_text,
          match: match.question_text,
          similarity: 100,
        });
      }
    }

    return res.json({
      success: true,
      duplicates,
      total: duplicates.length,
    });
  } catch (err) {
    console.error("Duplicate Check Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================================================
   VALIDATE QUESTIONS
============================================================ */

exports.validateQuestions = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body;

    if (!bankId) {
      return res.status(400).json({
        success: false,
        message: "Question Bank ID is required.",
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No questions supplied for validation.",
        results: [],
      });
    }

    const normalizedQuestions = questions.map((question) =>
      normalizeQuestion(question, bankId),
    );

    const results = normalizedQuestions.map((question, index) =>
      validateQuestion(question, index),
    );

    const invalidCount = results.filter(
      (result) => result.status === "invalid",
    ).length;

    return res.json({
      success: true,
      valid: invalidCount === 0,
      results,
      total: results.length,
      validCount: results.length - invalidCount,
      invalidCount,
    });
  } catch (err) {
    console.error("Validate Questions Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================================================
FINAL IMPORT
============================================================ */

exports.finalImport = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body;

    if (!bankId) {
      return res.status(400).json({
        success: false,
        message: "Question Bank ID is required.",
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No questions to import.",
      });
    }

    const normalizedQuestions = questions.map((question) =>
      normalizeQuestion(question, bankId),
    );

    const validationResults = normalizedQuestions.map((question, index) =>
      validateQuestion(question, index),
    );

    const invalidQuestions = validationResults.filter(
      (result) => result.status === "invalid",
    );

    if (invalidQuestions.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some questions failed validation.",
        results: validationResults,
      });
    }

    const { data: existingQuestions, error: existingError } =
      await Question.getAll(bankId);

    if (existingError) throw existingError;

    const existingTexts = new Set(
      (existingQuestions || []).map((question) =>
        question.question_text?.trim().toLowerCase(),
      ),
    );

    const importableQuestions = normalizedQuestions.filter(
      (question) =>
        !existingTexts.has(question.question_text.trim().toLowerCase()),
    );

    const duplicateCount =
      normalizedQuestions.length - importableQuestions.length;

    let imported = 0;

    if (importableQuestions.length > 0) {
      const { data, error } = await Question.bulkCreate(importableQuestions);

      if (error) throw error;

      imported = data?.length || 0;
    }

    const { count, error: countError } = await Question.count(bankId);

    if (countError) throw countError;

    await QuestionBank.update(bankId, {
      total_questions: count || 0,
    });

    const { data: bank } = await QuestionBank.getById(bankId);

    if (bank?.assessment_id) {
      liveEvents.emitQuestionBankUpdated(bank.assessment_id, bank);
    }

    return res.json({
      success: true,

      imported,

      duplicates: duplicateCount,

      warnings: 0,

      errors: 0,

      totalQuestions: count || 0,

      message: "Questions imported successfully.",
    });
  } catch (err) {
    console.error("Final Import Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
