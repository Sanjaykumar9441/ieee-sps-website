const Question = require("../models/Question");

exports.list = async (req, res) => {
  try {
    const { questionBankId } = req.params;

    if (!questionBankId) {
      return res.status(400).json({
        success: false,
        message: "Question Bank ID is required.",
      });
    }

    const { data, error } = await Question.getAll(questionBankId);

    if (error) throw error;

    return res.json({
      success: true,
      questions: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.get = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required.",
      });
    }

    const { data, error } = await Question.getById(id);

    if (error) throw error;

    return res.json({
      success: true,
      question: data,
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
    const payload = {
      ...req.body,

      difficulty: String(req.body.difficulty || "MEDIUM")
        .trim()
        .toUpperCase(),

      question_type: String(req.body.question_type || "MCQ")
        .trim()
        .toUpperCase(),
    };

    const { data, error } = await Question.create(payload);

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Question created successfully.",
      question: data,
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
        message: "Question ID is required.",
      });
    }

    const payload = {
      ...req.body,

      ...(req.body.difficulty !== undefined && {
        difficulty: String(req.body.difficulty).trim().toUpperCase(),
      }),

      ...(req.body.question_type !== undefined && {
        question_type: String(req.body.question_type).trim().toUpperCase(),
      }),
    };

    const { data, error } = await Question.update(id, payload);

    if (error) throw error;

    return res.json({
      success: true,
      message: "Question updated successfully.",
      question: data,
    });
  } catch (err) {
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
        message: "Question ID is required.",
      });
    }

    const { error } = await Question.delete(id);

    if (error) throw error;

    return res.json({
      success: true,
      message: "Question deleted successfully.",
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
        message: "Question ID is required.",
      });
    }

    const { data, error } = await Question.duplicate(id);

    if (error) throw error;

    return res.json({
      success: true,
      message: "Question duplicated successfully.",
      question: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.search = async (req, res) => {
  try {
    const { questionBankId } = req.params;
    const { keyword } = req.query;

    if (!questionBankId) {
      return res.status(400).json({
        success: false,
        message: "Question Bank ID is required.",
      });
    }

    const { data, error } = await Question.search(
      questionBankId,
      keyword || "",
    );

    if (error) throw error;

    return res.json({
      success: true,
      questions: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

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
        message: "No questions provided.",
      });
    }

    return res.json({
      success: true,
      questions,
    });
  } catch (err) {
    console.error("Import Questions Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

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
        message: "Questions must be an array.",
      });
    }

    const { data: existingQuestions, error } = await Question.getAll(bankId);

    if (error) throw error;

    const existingTexts = new Set(
      (existingQuestions || []).map((q) =>
        q.question_text.trim().toLowerCase(),
      ),
    );

    const duplicates = questions
      .map((question, index) => ({
        index,
        question_text: question.question_text,
        duplicate: existingTexts.has(
          String(question.question_text || "")
            .trim()
            .toLowerCase(),
        ),
      }))
      .filter((item) => item.duplicate);

    return res.json({
      success: true,
      duplicates,
      duplicateCount: duplicates.length,
    });
  } catch (err) {
    console.error("Check Duplicates Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.validateQuestions = async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: "Questions must be an array.",
      });
    }

    const errors = [];

    questions.forEach((question, index) => {
      const row = index + 2;

      if (!question.question_text?.trim()) {
        errors.push(`Row ${row}: Question text is required.`);
      }

      if (
        !["MCQ", "MULTIPLE_CORRECT", "TRUE_FALSE", "SUBJECTIVE"].includes(
          question.question_type,
        )
      ) {
        errors.push(`Row ${row}: Invalid question type.`);
      }

      const difficulty = String(question.difficulty || "")
        .trim()
        .toUpperCase();

      if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
        errors.push(`Row ${row}: Difficulty must be Easy, Medium or Hard.`);
      }

      if (Number(question.marks) <= 0) {
        errors.push(`Row ${row}: Marks must be greater than 0.`);
      }

      if (Number(question.negative_marks) < 0) {
        errors.push(`Row ${row}: Negative marks cannot be negative.`);
      }

      if (Number(question.estimated_seconds) <= 0) {
        errors.push(`Row ${row}: Estimated seconds must be greater than 0.`);
      }

      if (
        question.question_type === "MCQ" ||
        question.question_type === "MULTIPLE_CORRECT"
      ) {
        if (!Array.isArray(question.options) || question.options.length < 2) {
          errors.push(`Row ${row}: At least two options are required.`);
        }

        if (
          !Array.isArray(question.correct_answers) ||
          question.correct_answers.length === 0
        ) {
          errors.push(`Row ${row}: Correct answer is required.`);
        }
      }

      if (question.question_type === "TRUE_FALSE") {
        if (
          !Array.isArray(question.correct_answers) ||
          question.correct_answers.length !== 1 ||
          ![0, 1].includes(question.correct_answers[0])
        ) {
          errors.push(`Row ${row}: Correct answer must be True or False.`);
        }
      }
    });

    return res.json({
      success: true,
      valid: errors.length === 0,
      errors,
    });
  } catch (err) {
    console.error("Validate Questions Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

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

    const rows = questions.map((question) => ({
      ...question,

      bank_id: bankId,

      difficulty: String(question.difficulty || "MEDIUM")
        .trim()
        .toUpperCase(),

      question_type: String(question.question_type || "MCQ")
        .trim()
        .toUpperCase(),

      options:
        question.question_type === "SUBJECTIVE" ? [] : question.options || [],

      correct_answers:
        question.question_type === "SUBJECTIVE"
          ? []
          : question.correct_answers || [],

      tags: question.tags || [],

      language: question.language || "en",

      version: question.version || 1,

      is_active: true,
    }));

    const { data, error } = await Question.bulkCreate(rows);

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: `${data.length} questions imported successfully.`,
      questions: data,
      importedCount: data.length,
    });
  } catch (err) {
    console.error("Final Import Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
