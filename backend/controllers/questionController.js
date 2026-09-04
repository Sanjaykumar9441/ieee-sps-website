const Question = require("../models/Question");
const QuestionBank = require("../models/QuestionBank");
const liveEvents = require("../services/liveEvents");
const {
  syncQuestionBankTotal,
  syncAssessmentsForBank,
} = require("../services/assessmentQuestionCountService");

const QUESTION_TYPES = [
  "MCQ",
  "MULTIPLE_CORRECT",
  "TRUE_FALSE",
  "FILL_IN_THE_BLANK",
];

function normalizeType(value) {
  const raw = String(value || "MCQ")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (
    ["MULTIPLE_CHOICE", "MULTIPLE_CHOICE_QUESTION", "MULTIPLE"].includes(raw)
  ) {
    return "MULTIPLE_CORRECT";
  }

  if (["TRUEFALSE", "TRUE_OR_FALSE", "TRUE_FALSE_QUESTION"].includes(raw))
    return "TRUE_FALSE";
  if (
    [
      "FILL_BLANK",
      "FILL_IN_BLANK",
      "FILL_IN_THE_BLANK",
      "FILLINTHEBLANK",
      "FILL_IN_THE_BLANK_WITH_OPTIONS",
    ].includes(raw)
  )
    return "FILL_IN_THE_BLANK";
  return raw;
}

function normalizeOptions(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim());
  }

  if (value && typeof value === "object") {
    return ["A", "B", "C", "D"].map((key) =>
      String(value[key] ?? value[key.toLowerCase()] ?? "").trim(),
    );
  }

  return [];
}

function normalizeCorrectAnswers(value, options = [], questionType = "MCQ") {
  let input = Array.isArray(value) ? value : value == null ? [] : [value];

  if (typeof value === "string") {
    input = value.split(/[|,;]/);
  }

  const result = [];

  for (const answer of input) {
    const text = String(answer ?? "").trim();
    if (!text) continue;

    let index = -1;

    if (/^[A-D]$/i.test(text)) {
      index = text.toUpperCase().charCodeAt(0) - 65;
    } else if (/^[1-4]$/.test(text)) {
      index = Number(text) - 1;
    } else if (questionType === "TRUE_FALSE") {
      const normalized = text.toLowerCase();
      if (normalized === "true") index = 0;
      if (normalized === "false") index = 1;
    } else {
      index = options.findIndex(
        (option) => option.toLowerCase() === text.toLowerCase(),
      );
    }

    if (Number.isInteger(index) && index >= 0 && index < options.length) {
      if (!result.includes(index)) result.push(index);
    }
  }

  return result;
}

function toStoredOptions(options) {
  const stored = {};
  (options || []).forEach((option, index) => {
    const text = String(option ?? "").trim();
    if (text) stored[String.fromCharCode(65 + index)] = text;
  });
  return stored;
}

function normalizeQuestionPayload(input, bankId) {
  const questionType = normalizeType(input.question_type);
  let options = normalizeOptions(input.options);

  if (questionType === "TRUE_FALSE") {
    options = ["True", "False"];
  } else {
    options = options.slice(0, 4);
  }

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
    correct_answers: normalizeCorrectAnswers(
      incomingCorrect,
      options,
      questionType,
    ),
    marks: 1,
    negative_marks: 0,
    // Kept for compatibility with the existing schema; not exposed in the UI.
    difficulty: "MEDIUM",
    estimated_seconds: 60,
    language: String(input.language || "en").trim() || "en",
    version: Number(input.version || 1),
    is_active: input.is_active !== false,
  };
}

function validateQuestion(question, rowLabel = "Question") {
  const errors = [];

  if (!question.question_text) {
    errors.push(`${rowLabel}: Question text is required.`);
  }

  if (!QUESTION_TYPES.includes(question.question_type)) {
    errors.push(
      `${rowLabel}: Question type must be MCQ, MULTIPLE_CORRECT, TRUE_FALSE or FILL_IN_THE_BLANK.`,
    );
    return errors;
  }

  if (question.question_type === "TRUE_FALSE") {
    if (question.options.length !== 2) {
      errors.push(
        `${rowLabel}: True/False questions must have exactly two options.`,
      );
    }
    if (
      question.correct_answers.length !== 1 ||
      ![0, 1].includes(question.correct_answers[0])
    ) {
      errors.push(`${rowLabel}: Correct answer must be True or False.`);
    }
    return errors;
  }

  if (question.question_type === "FILL_IN_THE_BLANK") {
    const filled = question.options.filter(Boolean);
    if (filled.length < 2 || filled.length > 4)
      errors.push(`${rowLabel}: Fill in the Blank requires 2 to 4 options.`);
    if (question.correct_answers.length !== 1)
      errors.push(
        `${rowLabel}: Fill in the Blank requires exactly one correct option.`,
      );
    if (
      question.correct_answers.some(
        (index) => index < 0 || index >= filled.length,
      )
    )
      errors.push(
        `${rowLabel}: Correct answer must point to an available option.`,
      );
    return errors;
  }

  const filledOptions = question.options.filter(Boolean);
  if (filledOptions.length < 2 || filledOptions.length > 4) {
    errors.push(`${rowLabel}: MCQ questions must have 2 to 4 options.`);
  }

  if (
    new Set(filledOptions.map((option) => option.toLowerCase())).size !==
    filledOptions.length
  ) {
    errors.push(`${rowLabel}: Answer options must be different.`);
  }

  if (!question.correct_answers.length) {
    errors.push(`${rowLabel}: At least one correct answer is required.`);
  }

  if (
    question.correct_answers.some(
      (index) => index < 0 || index >= filledOptions.length,
    )
  ) {
    errors.push(
      `${rowLabel}: Correct answer must point to an available option.`,
    );
  }

  if (
    question.question_type === "MCQ" &&
    question.correct_answers.length !== 1
  ) {
    errors.push(`${rowLabel}: MCQ requires exactly one correct answer.`);
  }

  if (
    question.question_type === "MULTIPLE_CORRECT" &&
    question.correct_answers.length < 2
  ) {
    errors.push(
      `${rowLabel}: Multiple Correct requires at least two correct answers.`,
    );
  }

  return errors;
}

async function refreshQuestionCounts(bankId) {
  await syncQuestionBankTotal(bankId);
  const assessmentIds = await syncAssessmentsForBank(bankId);
  assessmentIds.forEach((assessmentId) =>
    liveEvents.emitDashboardRefresh(assessmentId),
  );
  return assessmentIds;
}

exports.list = async (req, res) => {
  try {
    const { questionBankId } = req.params;
    if (!questionBankId) {
      return res
        .status(400)
        .json({ success: false, message: "Question Bank ID is required." });
    }

    const { data, error } = await Question.getAll(questionBankId);
    if (error) throw error;

    return res.json({ success: true, questions: data || [] });
  } catch (err) {
    console.error("LIST QUESTIONS ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "Question ID is required." });

    const { data, error } = await Question.getById(id);
    if (error) throw error;

    return res.json({ success: true, question: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const bankId = req.params.bankId || req.body.bank_id;
    if (!bankId) {
      return res
        .status(400)
        .json({ success: false, message: "Question Bank ID is required." });
    }

    const payload = normalizeQuestionPayload(req.body || {}, bankId);
    const errors = validateQuestion(payload);
    if (errors.length) {
      return res
        .status(400)
        .json({ success: false, message: errors.join(" "), errors });
    }

    const dbPayload = { ...payload, options: toStoredOptions(payload.options) };
    const { data, error } = await Question.create(dbPayload);
    if (error) throw error;

    await refreshQuestionCounts(bankId);
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
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "Question ID is required." });

    const { data: existing, error: getError } = await Question.getById(id);
    if (getError || !existing) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found." });
    }

    const payload = normalizeQuestionPayload(
      { ...existing, ...req.body },
      existing.bank_id,
    );
    const errors = validateQuestion(payload);
    if (errors.length) {
      return res
        .status(400)
        .json({ success: false, message: errors.join(" "), errors });
    }

    delete payload.bank_id;

    const dbPayload = { ...payload, options: toStoredOptions(payload.options) };
    const { data, error } = await Question.update(id, dbPayload);
    if (error) throw error;

    await refreshQuestionCounts(existing.bank_id);
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
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "Question ID is required." });

    const { data: existing, error: getError } = await Question.getById(id);
    if (getError || !existing) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found." });
    }

    const { error } = await Question.delete(id);
    if (error) throw error;

    await refreshQuestionCounts(existing.bank_id);
    liveEvents.emitQuestionDeleted?.(existing.bank_id, existing);

    return res.json({
      success: true,
      message: "Question deleted successfully.",
    });
  } catch (err) {
    console.error("DELETE QUESTION ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.duplicate = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: source, error: sourceError } = await Question.getById(id);
    if (sourceError || !source)
      return res
        .status(404)
        .json({ success: false, message: "Question not found." });

    const { data, error } = await Question.duplicate(id);
    if (error) throw error;

    await refreshQuestionCounts(source.bank_id);
    liveEvents.emitQuestionCreated?.(source.bank_id, data);

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
    const { data, error } = await Question.search(
      questionBankId,
      keyword || "",
    );
    if (error) throw error;
    return res.json({ success: true, questions: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.importQuestions = async (req, res) => {
  const { bankId } = req.params;
  const { questions } = req.body || {};
  if (!bankId)
    return res
      .status(400)
      .json({ success: false, message: "Question Bank ID is required." });
  if (!Array.isArray(questions) || !questions.length)
    return res
      .status(400)
      .json({ success: false, message: "No questions provided." });

  return res.json({
    success: true,
    questions: questions.map((question) =>
      normalizeQuestionPayload(question, bankId),
    ),
    total: questions.length,
  });
};

exports.checkDuplicates = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body || {};
    if (!bankId || !Array.isArray(questions)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Bank ID and questions are required.",
        });
    }

    const { data: existingQuestions, error } = await Question.getAll(bankId);
    if (error) throw error;

    const existingTexts = new Set(
      (existingQuestions || []).map((q) =>
        String(q.question_text || "")
          .trim()
          .toLowerCase(),
      ),
    );
    const seen = new Set();

    const duplicates = questions
      .map((q, index) => {
        const key = String(q.question_text || "")
          .trim()
          .toLowerCase();
        const duplicate = existingTexts.has(key) || seen.has(key);
        seen.add(key);
        return { index, question_text: q.question_text, duplicate };
      })
      .filter((item) => item.duplicate);

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
    const { questions } = req.body || {};
    if (!Array.isArray(questions)) {
      return res
        .status(400)
        .json({ success: false, message: "Questions must be an array." });
    }

    const results = questions.map((raw, index) => {
      const normalized = normalizeQuestionPayload(raw, bankId);
      const errors = validateQuestion(normalized, `Row ${index + 2}`);
      return {
        question: `Question ${index + 1}`,
        status: errors.length ? "invalid" : "valid",
        message: errors.length ? errors.join(" ") : "Question is valid.",
      };
    });

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
      errors: results
        .filter((r) => r.status === "invalid")
        .map((r) => r.message),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.finalImport = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body || {};

    if (!bankId)
      return res
        .status(400)
        .json({ success: false, message: "Question Bank ID is required." });
    if (!Array.isArray(questions) || !questions.length) {
      return res
        .status(400)
        .json({ success: false, message: "No questions to import." });
    }

    const normalized = questions.map((question) =>
      normalizeQuestionPayload(question, bankId),
    );
    const validationResults = normalized.map((question, index) => {
      const errors = validateQuestion(question, `Row ${index + 2}`);
      return {
        question: `Question ${index + 1}`,
        status: errors.length ? "invalid" : "valid",
        message: errors.length ? errors.join(" ") : "Question is valid.",
      };
    });

    const invalid = validationResults.filter(
      (result) => result.status === "invalid",
    );
    if (invalid.length) {
      return res.status(400).json({
        success: false,
        message: "Some questions failed validation.",
        results: validationResults,
        errors: invalid.map((result) => result.message),
      });
    }

    const { data: existingQuestions, error: existingError } =
      await Question.getAll(bankId);
    if (existingError) throw existingError;

    const existingTexts = new Set(
      (existingQuestions || []).map((q) =>
        String(q.question_text || "")
          .trim()
          .toLowerCase(),
      ),
    );

    const importable = [];
    let duplicateCount = 0;

    for (const question of normalized) {
      const key = question.question_text.toLowerCase();
      if (existingTexts.has(key)) {
        duplicateCount += 1;
      } else {
        importable.push(question);
        existingTexts.add(key);
      }
    }

    let imported = 0;
    if (importable.length) {
      const dbRows = importable.map((question) => ({
        ...question,
        options: toStoredOptions(question.options),
      }));
      const { data, error } = await Question.bulkCreate(dbRows);
      if (error) throw error;
      imported = data?.length || 0;
    }

    const totalQuestions = await syncQuestionBankTotal(bankId);
    const assessmentIds = await syncAssessmentsForBank(bankId);
    const { data: bank } = await QuestionBank.get(bankId);

    assessmentIds.forEach((assessmentId) =>
      liveEvents.emitDashboardRefresh(assessmentId),
    );
    if (bank?.assessment_id)
      liveEvents.emitQuestionBankUpdated?.(bank.assessment_id, bank);

    return res.json({
      success: true,
      imported,
      duplicates: duplicateCount,
      warnings: 0,
      errors: 0,
      totalQuestions,
      message: duplicateCount
        ? `${imported} questions imported. ${duplicateCount} duplicate question(s) skipped.`
        : `${imported} questions imported successfully.`,
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
