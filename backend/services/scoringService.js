const { supabase } = require("../lib/supabase");

/* ============================================================
   CALCULATE SCORE
============================================================ */

exports.calculateScore = async (attemptId) => {
  const { data: questions, error } = await supabase
    .from("assessment_attempt_questions")
    .select(
      `
      id,
      correct_answers,
      marks,
      negative_marks,
      assessment_answers(
        selected_answers
      )
    `,
    )
    .eq("attempt_id", attemptId);

  if (error) throw error;

  let score = 0;

  let correct = 0;

  let wrong = 0;

  let unanswered = 0;

  for (const question of questions) {
    const answer = question.assessment_answers?.[0];

    if (!answer) {
      unanswered++;
      continue;
    }

    const selected = Array.isArray(answer.selected_answers)
      ? [...answer.selected_answers].sort()
      : [answer.selected_answers];

    const expected = Array.isArray(question.correct_answers)
      ? [...question.correct_answers].sort()
      : [question.correct_answers];

    const isCorrect = JSON.stringify(selected) === JSON.stringify(expected);

    if (isCorrect) {
      correct++;

      score += Number(question.marks || 0);
    } else {
      wrong++;

      score -= Number(question.negative_marks || 0);
    }
  }

  const totalQuestions = questions.length;

  const percentage =
    totalQuestions === 0
      ? 0
      : Number(((correct / totalQuestions) * 100).toFixed(2));

  return {
    score,

    correct,

    wrong,

    unanswered,

    percentage,

    totalQuestions,
  };
};
