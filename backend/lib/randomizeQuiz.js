/**
 * randomizeQuiz.js
 *
 * Randomizes questions and options once per attempt.
 * The shuffled order is stored in assessment_attempt_questions,
 * so every student sees a fixed paper even after refresh/resume.
 */

const OPTION_KEYS = Object.freeze(["A", "B", "C", "D", "E"]);

/* =====================================
   Fisher–Yates Shuffle
===================================== */

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/* =====================================
   Select Random Questions
===================================== */

function selectRandomQuestions(bank, count) {
  if (!Array.isArray(bank)) {
    throw new Error("Question bank must be an array.");
  }

  if (bank.length < count) {
    throw new Error(
      `Question bank has only ${bank.length} active questions but ${count} are required.`,
    );
  }

  return shuffle(bank).slice(0, count);
}

/* =====================================
   Shuffle Options
===================================== */

function shuffleQuestionOptions(options, correctAnswers) {
  if (!options || typeof options !== "object") {
    throw new Error("Question options are invalid.");
  }

  const availableKeys = OPTION_KEYS.filter(
    (key) => options[key] !== undefined && options[key] !== null,
  );

  const optionObjects = availableKeys.map((key) => ({
    key,
    text: options[key],
  }));

  const shuffled = shuffle(optionObjects);

  const shuffledOptions = {};
  const newCorrectAnswers = [];

  shuffled.forEach((option, index) => {
    const newKey = OPTION_KEYS[index];

    shuffledOptions[newKey] = option.text;

    if (
      Array.isArray(correctAnswers)
        ? correctAnswers.includes(option.key)
        : option.key === correctAnswers
    ) {
      newCorrectAnswers.push(newKey);
    }
  });

  return {
    shuffled_options: shuffledOptions,
    correct_answers:
      newCorrectAnswers.length === 1 ? newCorrectAnswers[0] : newCorrectAnswers,
  };
}

/* =====================================
   Build Frozen Attempt Questions
===================================== */

function buildAttemptQuestions(attemptId, questions, questionsToPick) {
  const selected = selectRandomQuestions(questions, questionsToPick);

  const orderedQuestions = shuffle(selected);

  return orderedQuestions.map((question, index) => {
    const { shuffled_options, correct_answers } = shuffleQuestionOptions(
      question.options,
      question.correct_answers,
    );

    return {
      attempt_id: attemptId ?? null,

      question_id: question.id,

      question_order: index + 1,

      shuffled_options,

      correct_answers,

      marks: question.marks,

      negative_marks: question.negative_marks,
    };
  });
}

module.exports = {
  shuffle,
  selectRandomQuestions,
  shuffleQuestionOptions,
  buildAttemptQuestions,
};
