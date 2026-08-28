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
    (key) => options[key] !== undefined && options[key] !== null
  );

  const optionObjects = availableKeys.map((key) => ({
    key,
    text: options[key],
  }));

  const shuffled = shuffle(optionObjects);

  const shuffledOptions = {};
  const newCorrectAnswers = [];

  // Normalize database correct answers to original option keys.
  const originalCorrectKeys = (
    Array.isArray(correctAnswers)
      ? correctAnswers
      : [correctAnswers]
  )
    .filter((answer) => answer !== null && answer !== undefined)
    .map((answer) => {
      // Already stored as A/B/C/D/E
      if (typeof answer === "string") {
        const value = answer.trim().toUpperCase();

        if (OPTION_KEYS.includes(value)) {
          return value;
        }

        // Stored as "0", "1", "2", ...
        if (/^\d+$/.test(value)) {
          const index = Number(value);
          return OPTION_KEYS[index];
        }
      }

      // Stored as 0,1,2,3...
      if (typeof answer === "number") {
        return OPTION_KEYS[answer];
      }

      return null;
    })
    .filter(Boolean);

  shuffled.forEach((option, index) => {
    const newKey = OPTION_KEYS[index];

    shuffledOptions[newKey] = option.text;

    // If this original option was correct,
    // save its NEW shuffled key.
    if (originalCorrectKeys.includes(option.key)) {
      newCorrectAnswers.push(newKey);
    }
  });

  return {
    shuffled_options: shuffledOptions,

    correct_answers:
      newCorrectAnswers.length === 1
        ? newCorrectAnswers[0]
        : newCorrectAnswers,
  };
}

/* =====================================
   Build Frozen Attempt Questions
===================================== */

function buildAttemptQuestions(
  attemptId,
  questions,
  questionsToPick,
  { selectRandom = true, shuffleQuestions = true, shuffleOptions = true } = {},
) {
  const selected = selectRandom
    ? selectRandomQuestions(questions, questionsToPick)
    : [...questions].slice(0, questionsToPick);

  const orderedQuestions = shuffleQuestions ? shuffle(selected) : selected;

  return orderedQuestions.map((question, index) => {
    const randomized = shuffleOptions
      ? shuffleQuestionOptions(question.options, question.correct_answers)
      : {
          shuffled_options: question.options,
          correct_answers: Array.isArray(question.correct_answers)
            ? question.correct_answers.length === 1
              ? question.correct_answers[0]
              : question.correct_answers
            : question.correct_answers,
        };

    const { shuffled_options, correct_answers } = randomized;

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
