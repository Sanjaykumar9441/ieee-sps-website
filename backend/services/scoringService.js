const { supabase } = require("../lib/supabase");

/* ============================================================
   CALCULATE SCORE
============================================================ */

exports.calculateScore = async (attemptId) => {
  console.log("\n========================================");
  console.log("CALCULATE SCORE START");
  console.log("Attempt ID:", attemptId);
  console.log("========================================\n");

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

  console.log("========== ATTEMPT QUESTIONS ==========");

  for (const question of questions || []) {
    console.log({
      id: question.id,
      questionId: question.question_id,
      order: question.question_order,
      correctAnswers: question.correct_answers,
      marks: question.marks,
      negativeMarks: question.negative_marks,
    });
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

  console.log("\n========== SAVED ANSWERS ==========");

  for (const answer of answers) {
    console.log({
      attemptQuestionId: answer.attempt_question_id,
      selectedAnswers: answer.selected_answers,
    });
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

    console.log("\n========== SCORING QUESTION ==========");
    console.log("Question:", question.question_order);
    console.log("Attempt Question ID:", question.id);
    console.log("Correct Answer:", question.correct_answers);
    console.log("Selected Answer:", selectedAnswers);

    // No answer
    if (!Array.isArray(selectedAnswers) || selectedAnswers.length === 0) {
      unanswered++;

      console.log("❌ UNANSWERED");

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

    console.log("Normalized selected:", selected);
    console.log("Normalized expected:", expected);

    const isCorrect = JSON.stringify(selected) === JSON.stringify(expected);

    console.log("IS CORRECT:", isCorrect);

    if (isCorrect) {
      correct++;

      score += Number(question.marks || 0);

      console.log("✅ CORRECT");
      console.log("Marks:", question.marks);
    } else {
      wrong++;

      score -= Number(question.negative_marks || 0);

      console.log("❌ WRONG");
      console.log("Negative Marks:", question.negative_marks);
    }

    console.log("Running Score:", score);
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

  console.log("\n========================================");
  console.log("FINAL SCORE");
  console.log(result);
  console.log("========================================\n");

  return result;
};
