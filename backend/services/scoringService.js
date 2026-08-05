const supabase = require("../lib/supabase");

exports.calculateScore = async (attemptId) => {
  // Get all questions served to this attempt
  const { data: questions, error: questionsError } = await supabase
    .from("assessment_attempt_questions")
    .select(
      `
            id,
            correct_key,
            marks,
            negative_marks
        `,
    )
    .eq("attempt_id", attemptId);

  if (questionsError) throw questionsError;

  // Get all submitted answers
  const { data: answers, error: answersError } = await supabase
    .from("assessment_answers")
    .select(
      `
            attempt_question_id,
            selected_answers
        `,
    )
    .in(
      "attempt_question_id",
      questions.map((q) => q.id),
    );

  if (answersError) throw answersError;

  // Fast lookup
  const answerMap = new Map();

  answers.forEach((answer) => {
    answerMap.set(answer.attempt_question_id, answer.selected_answers);
  });

  let score = 0;
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  for (const question of questions) {
    const selected = answerMap.get(question.id);

    if (!selected || selected.length === 0) {
      unanswered++;
      continue;
    }

    // Current version:
    // only single-correct questions

    const selectedKey = Array.isArray(selected) ? selected[0] : selected;

    if (selectedKey === question.correct_key) {
      correct++;

      score += Number(question.marks || 1);
    } else {
      wrong++;

      score -= Number(question.negative_marks || 0);
    }
  }

  return {
    score,

    correct,

    wrong,

    unanswered,
  };
};
