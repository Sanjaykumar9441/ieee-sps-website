const { supabase } = require("../lib/supabase");

const OPTION_INDEX = Object.freeze({ A: 0, B: 1, C: 2, D: 3 });

function normalizeAnswerValue(answer) {
  if (typeof answer === "number") return answer;

  if (typeof answer === "string") {
    const value = answer.trim().toUpperCase();
    if (OPTION_INDEX[value] !== undefined) return OPTION_INDEX[value];
    if (/^\d+$/.test(value)) return Number(value);
  }

  return answer;
}

function normalizeAnswerSet(value) {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return values.map(normalizeAnswerValue).sort((a, b) => a - b);
}

async function getFrozenQuestions(attemptId) {
  const { data, error } = await supabase
    .from("assessment_attempt_questions")
    .select(
      "id, question_id, question_order, correct_answers, marks, negative_marks",
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
    .select("marks_per_question, negative_marks")
    .eq("id", attempt.assessment_id)
    .single();

  if (assessmentError) throw assessmentError;

  return { attempt, assessment };
}

function calculateAgainstQuestions(questions, answerMap, assessment) {
  const fallbackMarks = Math.max(
    0,
    Number(assessment?.marks_per_question ?? 1),
  );
  const fallbackNegative = Math.max(0, Number(assessment?.negative_marks ?? 0));

  let score = 0;
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  let maximumMarks = 0;

  for (const question of questions) {
    const questionMarks = Math.max(0, Number(question.marks ?? fallbackMarks));
    const negativeMarks = Math.max(
      0,
      Number(question.negative_marks ?? fallbackNegative),
    );
    maximumMarks += questionMarks;

    const selectedAnswers = answerMap.get(String(question.id));
    const selected = normalizeAnswerSet(selectedAnswers);

    if (selected.length === 0) {
      unanswered++;
      continue;
    }

    const expected = normalizeAnswerSet(question.correct_answers);
    const isCorrect = JSON.stringify(selected) === JSON.stringify(expected);

    if (isCorrect) {
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
    score,
    correct,
    wrong,
    unanswered,
    answeredQuestions: correct + wrong,
    percentage,
    totalQuestions: questions.length,
    maximumMarks,
  };
}

/* ============================================================
   FINAL SCORE FROM BROWSER SNAPSHOT
============================================================ */

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

/* ============================================================
   LEGACY / ADMIN SCORE PATH
============================================================ */

exports.calculateScore = async (attemptId) => {
  const questions = await getFrozenQuestions(attemptId);
  const { assessment } = await getAssessmentForAttempt(attemptId);

  const questionIds = questions.map((q) => q.id);
  let answers = [];

  if (questionIds.length) {
    const { data, error } = await supabase
      .from("assessment_answers")
      .select("attempt_question_id, selected_answers")
      .in("attempt_question_id", questionIds);
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
