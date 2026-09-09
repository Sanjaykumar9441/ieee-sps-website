const { supabase } = require("../lib/supabase");

const OPTION_INDEX = Object.freeze({ A: 0, B: 1, C: 2, D: 3 });

function normalizeAnswerValue(answer) {
  if (typeof answer === "number" && Number.isFinite(answer)) return answer;

  if (typeof answer === "string") {
    const value = answer.trim().toUpperCase();
    if (OPTION_INDEX[value] !== undefined) return OPTION_INDEX[value];
    if (/^\d+$/.test(value)) return Number(value);
  }

  return answer;
}

function normalizeAnswerSet(value) {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];

  return values.map(normalizeAnswerValue).sort((a, b) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b));
  });
}

function sameAnswerSet(left, right) {
  return (
    JSON.stringify(normalizeAnswerSet(left)) ===
    JSON.stringify(normalizeAnswerSet(right))
  );
}

function originalKey(value) {
  if (typeof value === "string") {
    const v = value.trim().toUpperCase();
    if (OPTION_INDEX[v] !== undefined) return v;
    if (/^\d+$/.test(v)) return String.fromCharCode(65 + Number(v));
    return v;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String.fromCharCode(65 + value);
  }
  return null;
}

function optionObject(value) {
  if (Array.isArray(value)) {
    return Object.fromEntries(
      value.map((text, index) => [
        String.fromCharCode(65 + index),
        String(text ?? ""),
      ]),
    );
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, text]) => [
        String(key).trim().toUpperCase(),
        String(text ?? ""),
      ]),
    );
  }

  return {};
}

/*
 * Older attempts may have an empty correct_answers value in the frozen row.
 * The original question still contains its answer key. Because the attempt
 * paper may have shuffled options, recover the answer by matching the original
 * correct option's text against the frozen shuffled option text.
 */
function resolveCorrectAnswers(question) {
  const frozen = Array.isArray(question.correct_answers)
    ? question.correct_answers.filter(
        (v) => v !== null && v !== undefined && v !== "",
      )
    : [];

  if (frozen.length) return frozen;

  const source = question.questions || {};
  const sourceAnswers = Array.isArray(source.correct_answers)
    ? source.correct_answers
    : source.correct_answers == null
      ? []
      : [source.correct_answers];

  if (!sourceAnswers.length) return [];

  const originalOptions = optionObject(source.options);
  const shuffledOptions = optionObject(question.shuffled_options);

  const recovered = [];

  for (const answer of sourceAnswers) {
    const key = originalKey(answer);
    const answerText =
      (key && originalOptions[key]) || String(answer ?? "").trim();

    const shuffledKey = Object.entries(shuffledOptions).find(
      ([, text]) => String(text).trim() === String(answerText).trim(),
    )?.[0];

    if (shuffledKey) recovered.push(shuffledKey);
  }

  return recovered.length ? recovered : sourceAnswers;
}

async function getFrozenQuestions(attemptId) {
  const { data, error } = await supabase
    .from("assessment_attempt_questions")
    .select(
      `
      id,
      question_id,
      question_order,
      correct_answers,
      marks,
      negative_marks,
      shuffled_options,
      questions(
        correct_answers,
        options,
        question_type
      )
    `,
    )
    .eq("attempt_id", attemptId)
    .order("question_order");

  if (error) throw error;
  return data || [];
}

async function getAssessmentForAttempt(attemptId) {
  const { data: attempt, error: attemptError } = await supabase
    .from("assessment_attempts")
    .select("assessment_id")
    .eq("id", attemptId)
    .single();

  if (attemptError) throw attemptError;

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("marks_per_question,negative_marks")
    .eq("id", attempt.assessment_id)
    .single();

  if (assessmentError) throw assessmentError;

  return { attempt, assessment };
}

function calculateAgainstQuestions(questions, answerMap, assessment) {
  const fallbackMarks = Math.max(
    0.01,
    Number(assessment?.marks_per_question ?? 1),
  );
  const fallbackNegative = Math.max(0, Number(assessment?.negative_marks ?? 0));

  let score = 0;
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  let maximumMarks = 0;

  for (const question of questions) {
    // Assessment-level scoring is authoritative. Older attempt rows can have
    // 0/null marks, so those values must not make a real question worth zero.
    const storedMarks = Number(question.marks);
    const questionMarks =
      Number.isFinite(storedMarks) && storedMarks > 0
        ? storedMarks
        : fallbackMarks;

    const storedNegative = Number(question.negative_marks);
    const negativeMarks =
      Number.isFinite(storedNegative) && storedNegative >= 0
        ? storedNegative
        : fallbackNegative;

    maximumMarks += questionMarks;

    const selectedAnswers = answerMap.get(String(question.id));
    const selected = normalizeAnswerSet(selectedAnswers);

    if (selected.length === 0) {
      unanswered++;
      continue;
    }

    const expected = normalizeAnswerSet(resolveCorrectAnswers(question));

    if (expected.length > 0 && sameAnswerSet(selected, expected)) {
      correct++;
      score += questionMarks;
    } else {
      wrong++;
      score -= negativeMarks;
    }
  }

  const percentage =
    maximumMarks <= 0
      ? 0
      : Number(Math.max(0, (score / maximumMarks) * 100).toFixed(2));

  return {
    score: Number(score.toFixed(4)),
    correct,
    wrong,
    unanswered,
    answeredQuestions: correct + wrong,
    percentage,
    totalQuestions: questions.length,
    maximumMarks,
  };
}

exports.calculateScoreFromAnswers = async (
  attemptId,
  submittedAnswers = [],
) => {
  const [{ attempt, assessment }, questions] = await Promise.all([
    getAssessmentForAttempt(attemptId),
    getFrozenQuestions(attemptId),
  ]);

  const answerMap = new Map();

  for (const row of Array.isArray(submittedAnswers) ? submittedAnswers : []) {
    const id = row?.attemptQuestionId || row?.attempt_question_id || row?.id;
    if (!id) continue;

    answerMap.set(
      String(id),
      Array.isArray(row.selectedAnswers)
        ? row.selectedAnswers
        : Array.isArray(row.selected_answers)
          ? row.selected_answers
          : [],
    );
  }

  return {
    ...calculateAgainstQuestions(questions, answerMap, assessment),
    assessmentId: attempt.assessment_id,
  };
};

exports.calculateScore = async (attemptId) => {
  const questions = await getFrozenQuestions(attemptId);
  const { assessment } = await getAssessmentForAttempt(attemptId);

  const ids = questions.map((q) => q.id);
  let answers = [];

  if (ids.length) {
    const { data, error } = await supabase
      .from("assessment_answers")
      .select("attempt_question_id,selected_answers")
      .in("attempt_question_id", ids);

    if (error) throw error;
    answers = data || [];
  }

  const answerMap = new Map(
    answers.map((answer) => [
      String(answer.attempt_question_id),
      answer.selected_answers,
    ]),
  );

  return calculateAgainstQuestions(questions, answerMap, assessment);
};

exports.resolveCorrectAnswers = resolveCorrectAnswers;
exports.normalizeAnswerSet = normalizeAnswerSet;
exports.sameAnswerSet = sameAnswerSet;
exports.calculateAgainstQuestions = calculateAgainstQuestions;
