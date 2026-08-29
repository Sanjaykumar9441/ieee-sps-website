function validateMCQPayload(payload) {
  if (!payload.question_text) return "Question text is required.";
  if (!payload.bank_id) return "Question Bank ID is required.";
  if (!payload.options || typeof payload.options !== "object") return "MCQ options are required.";
  const optionKeys = Object.keys(payload.options).filter((key) => payload.options[key]);
  if (optionKeys.length !== 4) return "Exactly four MCQ options are required.";
  if (!Array.isArray(payload.correct_answers) || payload.correct_answers.length !== 1) {
    return "Exactly one correct answer is required.";
  }
  const answer = payload.correct_answers[0];
  if (typeof answer === "number" && Number.isInteger(answer) && answer >= 0 && answer < 4) return null;
  if (typeof answer === "string" && /^[A-D]$/i.test(answer)) return null;
  return "Correct answer must be A-D or option index 0-3.";
}

const Question = require("../models/Question");

function normalizeOptions(options) {
  if (Array.isArray(options)) {
    const keys = ["A", "B", "C", "D", "E"];
    return options.reduce((result, option, index) => {
      const text = String(option ?? "").trim();
      if (text && keys[index]) result[keys[index]] = text;
      return result;
    }, {});
  }

  if (options && typeof options === "object") return options;
  return {};
}

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
      bank_id: req.body.bank_id,
      question_text: String(req.body.question_text || "").trim(),
      question_type: "MCQ",
      options: normalizeOptions(req.body.options),
      correct_answers: Array.isArray(req.body.correct_answers)
        ? req.body.correct_answers.slice(0, 1)
        : [],
      // Fixed assessment format: every MCQ is one mark with no negative marking.
      marks: 1,
      negative_marks: 0,
      difficulty: "MEDIUM",
      explanation: null,
      question_image_id: null,
      estimated_seconds: 60,
      tags: [],
      language: "English",
    };

    const validationError = validateMCQPayload(payload);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

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
      question_type: "MCQ",
      ...(req.body.question_text !== undefined && {
        question_text: String(req.body.question_text || "").trim(),
      }),
      ...(req.body.options !== undefined && {
        options: normalizeOptions(req.body.options),
      }),
      ...(req.body.correct_answers !== undefined && {
        correct_answers: Array.isArray(req.body.correct_answers)
          ? req.body.correct_answers.slice(0, 1)
          : [],
      }),
      // Keep the simplified MCQ format consistent on every edit.
      marks: 1,
      negative_marks: 0,
      difficulty: "MEDIUM",
      explanation: null,
      question_image_id: null,
      estimated_seconds: 60,
      tags: [],
      language: "English",
    };

    const existing = await Question.getById(id);
    if (existing.error || !existing.data) {
      return res.status(404).json({ success: false, message: "Question not found." });
    }
    const validationError = validateMCQPayload({ ...existing.data, ...payload });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

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
    const { bankId } = req.params;
    const { questions } = req.body;

    if (!bankId) {
      return res.status(400).json({ success: false, message: "Question Bank ID is required." });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, valid: false, errors: ["No questions supplied."] });
    }

    const errors = [];
    questions.forEach((question, index) => {
      const row = index + 1;
      const text = String(question.question_text || "").trim();
      const options = Array.isArray(question.options) ? question.options.map((o) => String(o || "").trim()).filter(Boolean) : [];
      const correct = Array.isArray(question.correct_answers) ? question.correct_answers : [];

      if (!text) errors.push(`Row ${row}: Question text is required.`);
      if (String(question.question_type || "MCQ").toUpperCase() !== "MCQ") errors.push(`Row ${row}: Only MCQ questions are supported.`);
      if (options.length !== 4) errors.push(`Row ${row}: Exactly four options are required.`);
      if (correct.length !== 1) errors.push(`Row ${row}: Exactly one correct answer is required.`);
      if (correct.length === 1) {
        const answer = correct[0];
        const validIndex = Number.isInteger(answer) && answer >= 0 && answer < 4;
        const validLetter = typeof answer === "string" && /^[A-D]$/i.test(answer);
        if (!validIndex && !validLetter) errors.push(`Row ${row}: Correct answer must be A-D or option index 0-3.`);
      }
    });

    return res.json({ success: true, valid: errors.length === 0, errors });
  } catch (err) {
    console.error("Validate Questions Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.finalImport = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body;

    if (!bankId) return res.status(400).json({ success: false, message: "Question Bank ID is required." });
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: "No questions to import." });
    }

    const normalized = questions.map((question) => {
      const rawOptions = Array.isArray(question.options) ? question.options : [];
      const options = {};
      ["A", "B", "C", "D"].forEach((key, index) => {
        const value = String(rawOptions[index] ?? "").trim();
        if (value) options[key] = value;
      });

      let correct = Array.isArray(question.correct_answers) ? question.correct_answers.slice(0, 1) : [];
      correct = correct.map((answer) => {
        if (typeof answer === "string" && /^[A-D]$/i.test(answer.trim())) return answer.trim().toUpperCase();
        if (typeof answer === "string" && /^\d+$/.test(answer.trim())) return ["A", "B", "C", "D"][Number(answer)];
        if (typeof answer === "number" && Number.isInteger(answer)) return ["A", "B", "C", "D"][answer];
        return answer;
      });

      return {
        bank_id: bankId,
        question_text: String(question.question_text || "").trim(),
        question_type: "MCQ",
        options,
        correct_answers: correct,
        marks: 1,
        negative_marks: 0,
        difficulty: "MEDIUM",
        explanation: null,
        question_image_id: null,
        estimated_seconds: 60,
        tags: [],
        language: "English",
        version: 1,
        is_active: true,
      };
    });

    const invalid = [];
    normalized.forEach((question, index) => {
      const options = Object.keys(question.options);
      const correct = question.correct_answers[0];
      if (!question.question_text) invalid.push(`Row ${index + 1}: Question text is required.`);
      if (options.length !== 4) invalid.push(`Row ${index + 1}: Exactly four options are required.`);
      if (!correct || !["A", "B", "C", "D"].includes(correct)) invalid.push(`Row ${index + 1}: Select one correct answer from A-D.`);
    });
    if (invalid.length) return res.status(400).json({ success: false, message: "Some questions failed validation.", errors: invalid });

    const { data: existingQuestions, error: existingError } = await Question.getAll(bankId);
    if (existingError) throw existingError;
    const existingTexts = new Set((existingQuestions || []).map((q) => q.question_text?.trim().toLowerCase()));
    const importable = normalized.filter((q) => !existingTexts.has(q.question_text.toLowerCase()));
    const duplicateCount = normalized.length - importable.length;

    let imported = 0;
    if (importable.length) {
      const { data, error } = await Question.bulkCreate(importable);
      if (error) throw error;
      imported = data?.length || 0;
    }

    return res.status(201).json({
      success: true,
      message: `${imported} questions imported successfully.`,
      importedCount: imported,
      duplicateCount,
      questions: importable,
    });
  } catch (err) {
    console.error("Final Import Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

