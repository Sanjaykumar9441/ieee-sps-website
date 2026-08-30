const Question = require("../models/Question");
const liveEvents = require("../services/liveEvents");

const QUESTION_TYPES = ["MCQ", "MULTIPLE_CORRECT", "TRUE_FALSE", "SUBJECTIVE"];
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

function normalizeType(value) {
  const raw = String(value || "MCQ").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (raw === "MULTIPLE_CHOICE" || raw === "MULTIPLE_CHOICE_QUESTION") return "MCQ";
  if (raw === "MULTIPLE_CHOICE_CORRECT" || raw === "MULTIPLECORRECT") return "MULTIPLE_CORRECT";
  if (raw === "MULTIPLE_CORRECT_ANSWER") return "MULTIPLE_CORRECT";
  return raw;
}

function normalizeDifficulty(value) {
  const raw = String(value || "MEDIUM").trim().toUpperCase();
  return raw === "MEDIUM" || raw === "EASY" || raw === "HARD" ? raw : "MEDIUM";
}

function normalizeCorrectAnswers(value, options = []) {
  if (!Array.isArray(value)) {
    if (value === undefined || value === null || value === "") return [];
    value = String(value).split(/[|,]/);
  }

  return value
    .flatMap((answer) => {
      if (typeof answer === "number") return [answer];

      const text = String(answer).trim();
      if (!text) return [];

      // A/B/C/D or 1/2/3/4
      if (/^[A-D]$/i.test(text)) return [text.toUpperCase().charCodeAt(0) - 65];
      if (/^[1-4]$/.test(text)) return [Number(text) - 1];

      // Exact option text
      const index = options.findIndex(
        (option) => String(option).trim().toLowerCase() === text.toLowerCase(),
      );
      return index >= 0 ? [index] : [];
    })
    .filter((index, position, array) =>
      Number.isInteger(index) && index >= 0 && index < Math.max(options.length, 4)
        ? array.indexOf(index) === position
        : false,
    );
}

function normalizeQuestionPayload(input, bankId) {
  const questionType = normalizeType(input.question_type);
  const options =
    questionType === "SUBJECTIVE"
      ? []
      : (Array.isArray(input.options) ? input.options : []).map((x) => String(x ?? "").trim());

  const incomingCorrect =
    input.correct_answers !== undefined
      ? input.correct_answers
      : input.correct_answer;

  return {
    ...(bankId ? { bank_id: bankId } : {}),
    question_type: questionType,
    question_text: String(input.question_text || "").trim(),
    question_image_id: input.question_image_id || null,
    options,
    correct_answers:
      questionType === "SUBJECTIVE"
        ? []
        : normalizeCorrectAnswers(incomingCorrect, options),
    explanation: input.explanation ? String(input.explanation).trim() : null,
    difficulty: normalizeDifficulty(input.difficulty),
    marks: Number(input.marks || 1),
    negative_marks: Number(input.negative_marks || 0),
    estimated_seconds: Number(input.estimated_seconds || 60),
    tags: Array.isArray(input.tags)
      ? input.tags
      : String(input.tags || "")
          .split(/[|,]/)
          .map((x) => x.trim())
          .filter(Boolean),
    language: String(input.language || "en").trim() || "en",
    version: Number(input.version || 1),
    is_active: input.is_active !== false,
  };
}

function validateQuestion(question, rowLabel = "Question") {
  const errors = [];

  if (!question.question_text) errors.push(`${rowLabel}: Question text is required.`);
  if (!QUESTION_TYPES.includes(question.question_type)) {
    errors.push(`${rowLabel}: Invalid question type.`);
  }
  if (!DIFFICULTIES.includes(question.difficulty)) {
    errors.push(`${rowLabel}: Difficulty must be Easy, Medium or Hard.`);
  }
  if (!Number.isFinite(question.marks) || question.marks <= 0) {
    errors.push(`${rowLabel}: Marks must be greater than 0.`);
  }
  if (!Number.isFinite(question.negative_marks) || question.negative_marks < 0) {
    errors.push(`${rowLabel}: Negative marks cannot be negative.`);
  }
  if (!Number.isFinite(question.estimated_seconds) || question.estimated_seconds <= 0) {
    errors.push(`${rowLabel}: Estimated seconds must be greater than 0.`);
  }

  if (question.question_type === "MCQ" || question.question_type === "MULTIPLE_CORRECT") {
    if (!Array.isArray(question.options) || question.options.filter(Boolean).length < 2) {
      errors.push(`${rowLabel}: At least two options are required.`);
    }
    if (!Array.isArray(question.correct_answers) || question.correct_answers.length === 0) {
      errors.push(`${rowLabel}: Correct answer is required.`);
    }
    if (
      Array.isArray(question.correct_answers) &&
      Array.isArray(question.options) &&
      question.correct_answers.some(
        (index) => !Number.isInteger(index) || index < 0 || index >= question.options.length,
      )
    ) {
      errors.push(`${rowLabel}: Correct answer must point to an available option.`);
    }
    if (question.question_type === "MCQ" && question.correct_answers.length > 1) {
      errors.push(`${rowLabel}: MCQ allows only one correct answer.`);
    }
    if (question.question_type === "MULTIPLE_CORRECT" && question.correct_answers.length < 2) {
      errors.push(`${rowLabel}: Multiple Correct requires at least two correct answers.`);
    }
  }

  if (question.question_type === "TRUE_FALSE") {
    if (
      !Array.isArray(question.correct_answers) ||
      question.correct_answers.length !== 1 ||
      ![0, 1].includes(question.correct_answers[0])
    ) {
      errors.push(`${rowLabel}: Correct answer must be True or False.`);
    }
  }

  if (question.question_type === "SUBJECTIVE") {
    // Subjective is supported by the assessment schema; its answer is entered by the student.
  }

  return errors;
}

exports.list = async (req, res) => {
  try {
    const { questionBankId } = req.params;
    if (!questionBankId) {
      return res.status(400).json({ success: false, message: "Question Bank ID is required." });
    }

    const { data, error } = await Question.getAll(questionBankId);
    if (error) throw error;

    return res.json({ success: true, questions: data || [] });
  } catch (err) {
    console.error("List Questions Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Question ID is required." });

    const { data, error } = await Question.getById(id);
    if (error) throw error;

    return res.json({ success: true, question: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    // Supports both:
    // POST /api/questions with bank_id in body
    // POST /api/question-banks/:bankId/questions
    const bankId = req.params.bankId || req.body.bank_id;

    if (!bankId) {
      return res.status(400).json({
        success: false,
        message: "Question Bank ID is required.",
      });
    }

    const payload = normalizeQuestionPayload(req.body, bankId);
    const errors = validateQuestion(payload);

    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(" "), errors });
    }

    const { data, error } = await Question.create(payload);
    if (error) throw error;

    liveEvents.emitQuestionCreated?.(bankId, data);

    return res.status(201).json({
      success: true,
      message: "Question created successfully.",
      question: data,
    });
  } catch (err) {
    console.error("CREATE QUESTION ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
      code: err.code || null,
      details: err.details || null,
      hint: err.hint || null,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Question ID is required." });

    const { data: existing, error: getError } = await Question.getById(id);
    if (getError) throw getError;

    const payload = normalizeQuestionPayload(
      { ...existing, ...req.body },
      existing.bank_id,
    );

    const errors = validateQuestion(payload);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(" "), errors });
    }

    delete payload.bank_id;

    const { data, error } = await Question.update(id, payload);
    if (error) throw error;

    liveEvents.emitQuestionUpdated?.(existing.bank_id, data);

    return res.json({
      success: true,
      message: "Question updated successfully.",
      question: data,
    });
  } catch (err) {
    console.error("UPDATE QUESTION ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Question ID is required." });

    const { data: existing } = await Question.getById(id);
    const { error } = await Question.delete(id);
    if (error) throw error;

    liveEvents.emitQuestionDeleted?.(existing?.bank_id, existing);
    return res.json({ success: true, message: "Question deleted successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.duplicate = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await Question.duplicate(id);
    if (error) throw error;

    liveEvents.emitQuestionCreated?.(data?.bank_id, data);
    return res.status(201).json({
      success: true,
      message: "Question duplicated successfully.",
      question: data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.search = async (req, res) => {
  try {
    const { questionBankId } = req.params;
    const { keyword } = req.query;

    const { data, error } = await Question.search(questionBankId, keyword || "");
    if (error) throw error;

    return res.json({ success: true, questions: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.importQuestions = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body;

    if (!bankId) return res.status(400).json({ success: false, message: "Question Bank ID is required." });
    if (!Array.isArray(questions) || !questions.length) {
      return res.status(400).json({ success: false, message: "No questions provided." });
    }

    const normalized = questions.map((q) => normalizeQuestionPayload(q, bankId));
    return res.json({
      success: true,
      questions: normalized,
      total: normalized.length,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.checkDuplicates = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body;

    if (!Array.isArray(questions)) {
      return res.status(400).json({ success: false, message: "Questions must be an array." });
    }

    const { data: existingQuestions, error } = await Question.getAll(bankId);
    if (error) throw error;

    const existingTexts = new Set(
      (existingQuestions || []).map((q) => String(q.question_text || "").trim().toLowerCase()),
    );

    const duplicates = questions
      .map((q, index) => ({
        index,
        question_text: q.question_text,
        duplicate: existingTexts.has(
          String(q.question_text || "").trim().toLowerCase(),
        ),
      }))
      .filter((x) => x.duplicate);

    return res.json({
      success: true,
      duplicates,
      duplicateCount: duplicates.length,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.validateQuestions = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body;

    if (!Array.isArray(questions)) {
      return res.status(400).json({ success: false, message: "Questions must be an array." });
    }

    const results = [];
    questions.forEach((raw, index) => {
      const normalized = normalizeQuestionPayload(raw, bankId);
      const errors = validateQuestion(normalized, `Row ${index + 2}`);
      results.push({
        question: `Question ${index + 1}`,
        status: errors.length ? "invalid" : "valid",
        message: errors.length ? errors.join(" ") : "Question is valid.",
      });
    });

    const invalidCount = results.filter((r) => r.status === "invalid").length;

    return res.json({
      success: true,
      valid: invalidCount === 0,
      results,
      total: results.length,
      validCount: results.length - invalidCount,
      invalidCount,
      // Compatibility with older frontend versions.
      errors: results.filter((r) => r.status === "invalid").map((r) => r.message),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.finalImport = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body;

    if (!bankId) return res.status(400).json({ success: false, message: "Question Bank ID is required." });
    if (!Array.isArray(questions) || !questions.length) {
      return res.status(400).json({ success: false, message: "No questions to import." });
    }

    const normalized = questions.map((q) => normalizeQuestionPayload(q, bankId));

    const validationResults = normalized.map((q, index) => {
      const errors = validateQuestion(q, `Row ${index + 2}`);
      return {
        question: `Question ${index + 1}`,
        status: errors.length ? "invalid" : "valid",
        message: errors.length ? errors.join(" ") : "Question is valid.",
      };
    });

    const invalid = validationResults.filter((r) => r.status === "invalid");
    if (invalid.length) {
      return res.status(400).json({
        success: false,
        message: "Some questions failed validation.",
        results: validationResults,
      });
    }

    const { data: existingQuestions, error: existingError } = await Question.getAll(bankId);
    if (existingError) throw existingError;

    const existingTexts = new Set(
      (existingQuestions || []).map((q) => String(q.question_text || "").trim().toLowerCase()),
    );

    const importable = [];
    let duplicateCount = 0;

    for (const question of normalized) {
      const key = question.question_text.toLowerCase();
      if (existingTexts.has(key)) {
        duplicateCount++;
      } else {
        importable.push(question);
        existingTexts.add(key); // also block duplicates inside the same CSV
      }
    }

    let imported = 0;

    if (importable.length) {
      const { data, error } = await Question.bulkCreate(importable);
      if (error) throw error;
      imported = data?.length || 0;
    }

    const { count, error: countError } = await Question.count(bankId);
    if (countError) throw countError;

    // Keep the question-bank cache correct.
    const QuestionBank = require("../models/QuestionBank");
    await QuestionBank.update(bankId, { total_questions: count || 0 });

    const { data: bank } = await QuestionBank.get(bankId);
    if (bank?.assessment_id) {
      liveEvents.emitQuestionBankUpdated?.(bank.assessment_id, bank);
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
    console.error("FINAL QUESTION IMPORT ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
      code: err.code || null,
      details: err.details || null,
      hint: err.hint || null,
    });
  }
};
