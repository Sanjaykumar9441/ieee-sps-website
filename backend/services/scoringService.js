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

    console.log("\n========== SCORING QUESTION ==========");
    console.log("Question ID:", question.id);
    console.log("Correct Answer:", question.correct_answers);
    console.log("Saved Answer:", answer?.selected_answers);

    if (!answer) {
      console.log("❌ UNANSWERED");

      unanswered++;
      continue;
    }

    const selected = Array.isArray(answer.selected_answers)
      ? [...answer.selected_answers].sort()
      : [answer.selected_answers];

    const expected = Array.isArray(question.correct_answers)
      ? [...question.correct_answers].sort()
      : [question.correct_answers];

    console.log("Normalized selected:", selected);
    console.log("Normalized expected:", expected);

    const isCorrect = JSON.stringify(selected) === JSON.stringify(expected);

    console.log("Is Correct:", isCorrect);

    if (isCorrect) {
      correct++;

      score += Number(question.marks || 0);

      console.log("✅ CORRECT");
      console.log("Marks:", question.marks);
    } else {
      wrong++;

      score -= Number(question.negative_marks || 0);

      console.log("❌ WRONG");
      console.log("Negative marks:", question.negative_marks);
    }

    console.log("Running score:", score);
    console.log("Running correct:", correct);
    console.log("Running wrong:", wrong);
    console.log("Running unanswered:", unanswered);
  }

  const totalQuestions = questions.length;

  const percentage =
    totalQuestions === 0
      ? 0
      : Number(((correct / totalQuestions) * 100).toFixed(2));

  console.log("\n========== FINAL SCORE RESULT ==========");
  console.log("Attempt ID:", attemptId);
  console.log("Total questions:", totalQuestions);
  console.log("Correct:", correct);
  console.log("Wrong:", wrong);
  console.log("Unanswered:", unanswered);
  console.log("Score:", score);
  console.log("Percentage:", percentage);
  console.log("========================================\n");

  return {
    score,

    correct,

    wrong,

    unanswered,

    percentage,

    totalQuestions,
  };
};
