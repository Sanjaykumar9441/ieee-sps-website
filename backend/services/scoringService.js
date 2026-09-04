const { supabase } = require("../lib/supabase");

/* ============================================================
   CALCULATE SCORE
============================================================ */

exports.calculateScore = async (attemptId) => {
  const { data: attempt } = await supabase
    .from("assessment_attempts")
    .select("assessment_id")
    .eq("id", attemptId)
    .single();
  const { data: assessment } = attempt?.assessment_id
    ? await supabase
        .from("assessments")
        .select("marks_per_question,negative_marks")
        .eq("id", attempt.assessment_id)
        .single()
    : { data: null };
  const fallbackMarks = Number(assessment?.marks_per_question ?? 1);
  const fallbackNegative = Math.max(0, Number(assessment?.negative_marks ?? 0));
  // ------------------------------------------------------------
  // 1. Get frozen attempt questions
  // ------------------------------------------------------------

  const { data: questions, error: questionsError } = await supabase
    .from("assessment_attempt_questions")
    .select(
      `
      id,
      question_id,
      question_order,
      correct_answers,
      marks,
      negative_marks
    `,
    )
    .eq("attempt_id", attemptId)
    .order("question_order");

  if (questionsError) {
    console.error("❌ QUESTIONS FETCH ERROR:", questionsError);
    throw questionsError;
  }

  // ------------------------------------------------------------
  // 2. Get ALL saved answers separately
  // ------------------------------------------------------------

  const questionIds = (questions || []).map((q) => q.id);

  let answers = [];

  if (questionIds.length > 0) {
    const { data: answerRows, error: answersError } = await supabase
      .from("assessment_answers")
      .select(
        `
        attempt_question_id,
        selected_answers
      `,
      )
      .in("attempt_question_id", questionIds);

    if (answersError) {
      console.error("❌ ANSWERS FETCH ERROR:", answersError);
      throw answersError;
    }

    answers = answerRows || [];
  }

  // ------------------------------------------------------------
  // 3. Create answer lookup
  // ------------------------------------------------------------

  const answerMap = new Map();

  for (const answer of answers) {
    answerMap.set(answer.attempt_question_id, answer.selected_answers);
  }

  // ------------------------------------------------------------
  // 4. Calculate
  // ------------------------------------------------------------

  let score = 0;
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  for (const question of questions || []) {
    const selectedAnswers = answerMap.get(question.id);

    // No answer
    if (!Array.isArray(selectedAnswers) || selectedAnswers.length === 0) {
      unanswered++;
      continue;
    }

    // ------------------------------------------------------------
    // Normalize answer formats
    // Frontend saves: ['A', 'B', 'C', 'D']
    // Database correct_answers: [0, 1, 2, 3]
    // ------------------------------------------------------------

    const OPTION_INDEX = {
      A: 0,
      B: 1,
      C: 2,
      D: 3,
    };

    const selected = selectedAnswers
      .map((answer) => {
        if (typeof answer === "number") {
          return answer;
        }

        if (typeof answer === "string") {
          const value = answer.trim().toUpperCase();

          if (OPTION_INDEX[value] !== undefined) {
            return OPTION_INDEX[value];
          }

          // Also support numeric strings such as "0", "1", etc.
          if (/^\d+$/.test(value)) {
            return Number(value);
          }
        }

        return answer;
      })
      .sort((a, b) => a - b);

    const expected = (
      Array.isArray(question.correct_answers)
        ? question.correct_answers
        : [question.correct_answers]
    )
      .map((answer) => {
        if (typeof answer === "number") {
          return answer;
        }

        if (typeof answer === "string") {
          const value = answer.trim().toUpperCase();

          if (OPTION_INDEX[value] !== undefined) {
            return OPTION_INDEX[value];
          }

          if (/^\d+$/.test(value)) {
            return Number(value);
          }
        }

        return answer;
      })
      .sort((a, b) => a - b);

    const isCorrect = JSON.stringify(selected) === JSON.stringify(expected);

    if (isCorrect) {
      correct++;

      const marks = Math.max(0, Number(question.marks ?? fallbackMarks));
      score += marks;
    } else {
      wrong++;

      const negativeMarks = Math.max(
        0,
        Number(question.negative_marks ?? fallbackNegative),
      );
      score -= negativeMarks;
    }
  }

  // ------------------------------------------------------------
  // 5. Percentage
  // ------------------------------------------------------------

  const totalQuestions = (questions || []).length;

  const percentage =
    totalQuestions === 0
      ? 0
      : Number(((correct / totalQuestions) * 100).toFixed(2));

  const result = {
    score,
    correct,
    wrong,
    unanswered,
    percentage,
    totalQuestions,
  };

  return result;
};
