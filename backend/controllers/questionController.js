const Question = require("../models/Question");
const { supabase } = require("../lib/supabase");
const {
  syncQuestionBankTotal,
  syncAssessmentsForBank,
} = require("../services/assessmentQuestionCountService");
const liveEvents = require("../services/liveEvents");

const OPTION_KEYS = ["A", "B", "C", "D"];

function normalizeQuestionType(value) {
  const type = String(value || "MCQ").trim().toUpperCase().replace(/[- ]/g, "_");
  return ["MULTIPLE_CORRECT", "MULTIPLE_CHOICE", "MULTIPLE"].includes(type) ? "MULTIPLE_CORRECT" : "MCQ";
}

function normalizeOptions(options) {
  if (Array.isArray(options)) {
    return options.reduce((result, option, index) => {
      const key = OPTION_KEYS[index];
      const text = String(option ?? "").trim();
      if (key && text) result[key] = text;
      return result;
    }, {});
  }

  if (options && typeof options === "object") {
    return OPTION_KEYS.reduce((result, key) => {
      const value = options[key] ?? options[key.toLowerCase()];
      if (value !== undefined && String(value).trim()) result[key] = String(value).trim();
      return result;
    }, {});
  }

  return {};
}

function normalizeCorrectAnswers(values) {
  const input = Array.isArray(values) ? values : values == null ? [] : [values];
  return [...new Set(input.map((answer) => {
    if (typeof answer === "number" && Number.isInteger(answer) && answer >= 0 && answer < 4) {
      return OPTION_KEYS[answer];
    }
    const value = String(answer ?? "").trim().toUpperCase();
    if (/^[A-D]$/.test(value)) return value;
    if (/^\d$/.test(value) && Number(value) < 4) return OPTION_KEYS[Number(value)];
    return value;
  }).filter((value) => OPTION_KEYS.includes(value)))];
}

function validateMCQPayload(payload) {
  if (!payload.question_text) return "Question text is required.";
  if (!payload.bank_id) return "Question Bank ID is required.";
  if (Object.keys(payload.options || {}).length !== 4) return "Exactly four answer options are required.";

  const type = normalizeQuestionType(payload.question_type);
  if (!['MCQ', 'MULTIPLE_CORRECT'].includes(type)) return "Question type must be MCQ or MULTIPLE_CORRECT.";

  const correct = normalizeCorrectAnswers(payload.correct_answers);
  if (!correct.length) return "At least one correct answer is required.";
  if (type === "MCQ" && correct.length !== 1) return "MCQ requires exactly one correct answer.";
  if (type === "MULTIPLE_CORRECT" && correct.length < 2) return "Multiple Choice requires at least two correct answers.";
  return null;
}


exports.list = async (req, res) => {
  try {
    const { questionBankId } = req.params;
    if (!questionBankId) return res.status(400).json({ success: false, message: "Question Bank ID is required." });
    const { data, error } = await Question.getAll(questionBankId);
    if (error) throw error;
    return res.json({ success: true, questions: data || [] });
  } catch (err) {
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
    const payload = {
      bank_id: req.body.bank_id,
      question_text: String(req.body.question_text || "").trim(),
      question_type: normalizeQuestionType(req.body.question_type),
      options: normalizeOptions(req.body.options),
      correct_answers: normalizeCorrectAnswers(req.body.correct_answers),
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

    const validationError = validateMCQPayload(payload);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const { data, error } = await Question.create(payload);
    if (error) throw error;

    await syncQuestionBankTotal(payload.bank_id);
    const assessmentIds = await syncAssessmentsForBank(payload.bank_id);
    assessmentIds.forEach((assessmentId) => liveEvents.emitDashboardRefresh(assessmentId));

    return res.status(201).json({ success: true, message: "Question created successfully.", question: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Question ID is required." });

    const existing = await Question.getById(id);
    if (existing.error || !existing.data) return res.status(404).json({ success: false, message: "Question not found." });

    const payload = {
      question_type: normalizeQuestionType(req.body.question_type || existing.data.question_type),
      question_text: req.body.question_text !== undefined ? String(req.body.question_text || "").trim() : existing.data.question_text,
      options: req.body.options !== undefined ? normalizeOptions(req.body.options) : normalizeOptions(existing.data.options),
      correct_answers: req.body.correct_answers !== undefined ? normalizeCorrectAnswers(req.body.correct_answers) : normalizeCorrectAnswers(existing.data.correct_answers),
      marks: 1,
      negative_marks: 0,
      difficulty: "MEDIUM",
      explanation: null,
      question_image_id: null,
      estimated_seconds: 60,
      tags: [],
      language: "English",
    };

    const validationError = validateMCQPayload({ ...payload, bank_id: existing.data.bank_id });
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const { data, error } = await Question.update(id, payload);
    if (error) throw error;

    await syncQuestionBankTotal(existing.data.bank_id);
    const assessmentIds = await syncAssessmentsForBank(existing.data.bank_id);
    assessmentIds.forEach((assessmentId) => liveEvents.emitDashboardRefresh(assessmentId));

    return res.json({ success: true, message: "Question updated successfully.", question: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Question.getById(id);
    if (existing.error || !existing.data) return res.status(404).json({ success: false, message: "Question not found." });
    const { error } = await Question.delete(id);
    if (error) throw error;
    await syncQuestionBankTotal(existing.data.bank_id);
    const assessmentIds = await syncAssessmentsForBank(existing.data.bank_id);
    assessmentIds.forEach((assessmentId) => liveEvents.emitDashboardRefresh(assessmentId));
    return res.json({ success: true, message: "Question deleted successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.duplicate = async (req, res) => {
  try {
    const { id } = req.params;
    const source = await Question.getById(id);
    if (source.error || !source.data) return res.status(404).json({ success: false, message: "Question not found." });
    const { data, error } = await Question.duplicate(id);
    if (error) throw error;
    await syncQuestionBankTotal(source.data.bank_id);
    const assessmentIds = await syncAssessmentsForBank(source.data.bank_id);
    assessmentIds.forEach((assessmentId) => liveEvents.emitDashboardRefresh(assessmentId));
    return res.status(201).json({ success: true, message: "Question duplicated successfully.", question: data });
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
  const { bankId } = req.params;
  const { questions } = req.body || {};
  if (!bankId) return res.status(400).json({ success: false, message: "Question Bank ID is required." });
  if (!Array.isArray(questions) || !questions.length) return res.status(400).json({ success: false, message: "No questions provided." });
  return res.json({ success: true, questions });
};

exports.checkDuplicates = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body || {};
    if (!bankId) return res.status(400).json({ success: false, message: "Question Bank ID is required." });
    if (!Array.isArray(questions)) return res.status(400).json({ success: false, message: "Questions must be an array." });
    const { data: existingQuestions, error } = await Question.getAll(bankId);
    if (error) throw error;
    const existingTexts = new Set((existingQuestions || []).map((q) => String(q.question_text || "").trim().toLowerCase()));
    const seen = new Set();
    const duplicates = questions.map((question, index) => {
      const text = String(question.question_text || "").trim().toLowerCase();
      const duplicate = existingTexts.has(text) || seen.has(text);
      seen.add(text);
      return { index, question_text: question.question_text, duplicate };
    }).filter((item) => item.duplicate);
    return res.json({ success: true, duplicates, duplicateCount: duplicates.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.validateQuestions = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body || {};
    if (!bankId) return res.status(400).json({ success: false, message: "Question Bank ID is required." });
    if (!Array.isArray(questions) || !questions.length) return res.status(400).json({ success: false, valid: false, errors: ["No questions supplied."] });

    const errors = [];
    questions.forEach((q, i) => {
      const row = i + 2;
      const type = String(q.question_type || "MCQ").trim().toUpperCase();
      const options = normalizeOptions(q.options);
      const correct = normalizeCorrectAnswers(q.correct_answers);
      if (!String(q.question_text || "").trim()) errors.push(`Row ${row}: Question text is required.`);
      if (!['MCQ', 'MULTIPLE_CORRECT'].includes(type)) errors.push(`Row ${row}: Only MCQ and MULTIPLE_CORRECT are supported.`);
      if (Object.keys(options).length !== 4) errors.push(`Row ${row}: Exactly four non-empty options are required.`);
      if (type === 'MCQ' && correct.length !== 1) errors.push(`Row ${row}: MCQ requires exactly one correct answer.`);
      if (type === 'MULTIPLE_CORRECT' && correct.length < 2) errors.push(`Row ${row}: Multiple choice requires at least two correct answers.`);
    });

    return res.json({ success: true, valid: errors.length === 0, errors });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.finalImport = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body || {};
    if (!bankId) return res.status(400).json({ success: false, message: "Question Bank ID is required." });
    if (!Array.isArray(questions) || !questions.length) return res.status(400).json({ success: false, message: "No questions to import." });

    const normalized = questions.map((q) => ({
      bank_id: bankId,
      question_text: String(q.question_text || '').trim(),
      question_type: normalizeQuestionType(q.question_type),
      options: normalizeOptions(q.options),
      correct_answers: normalizeCorrectAnswers(q.correct_answers),
      marks: 1,
      negative_marks: 0,
      difficulty: 'MEDIUM',
      explanation: null,
      question_image_id: null,
      estimated_seconds: 60,
      tags: [],
      language: 'English',
      version: 1,
      is_active: true,
    }));

    const errors = [];
    normalized.forEach((q, i) => {
      const row = i + 2;
      if (!q.question_text) errors.push(`Row ${row}: Question text is required.`);
      if (Object.keys(q.options).length !== 4) errors.push(`Row ${row}: Exactly four non-empty options are required.`);
      if (q.question_type === 'MCQ' && q.correct_answers.length !== 1) errors.push(`Row ${row}: MCQ requires exactly one correct answer.`);
      if (q.question_type === 'MULTIPLE_CORRECT' && q.correct_answers.length < 2) errors.push(`Row ${row}: Multiple choice requires at least two correct answers.`);
    });
    if (errors.length) return res.status(400).json({ success: false, message: 'Some questions failed validation.', errors });

    const { data: existing, error: existingError } = await Question.getAll(bankId);
    if (existingError) throw existingError;
    const existingTexts = new Set((existing || []).map((q) => String(q.question_text || '').trim().toLowerCase()));
    const importable = normalized.filter((q) => !existingTexts.has(q.question_text.toLowerCase()));
    const duplicateCount = normalized.length - importable.length;

    let imported = 0;
    if (importable.length) {
      const { data, error } = await Question.bulkCreate(importable);
      if (error) throw error;
      imported = data?.length || 0;
    }

    const totalQuestions = await syncQuestionBankTotal(bankId);
    const assessmentIds = await syncAssessmentsForBank(bankId);
    assessmentIds.forEach((assessmentId) => liveEvents.emitDashboardRefresh(assessmentId));

    return res.status(201).json({ success: true, message: `${imported} questions imported successfully.`, importedCount: imported, duplicateCount, totalQuestions, questions: importable });
  } catch (err) {
    console.error('Final Import Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
