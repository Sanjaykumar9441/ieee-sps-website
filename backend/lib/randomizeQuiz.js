/**
 * randomizeQuiz.js
 *
 * Randomizes questions and options once per attempt.
 * Fill-in-the-blank questions intentionally do not have answer options;
 * their accepted text answers must be preserved as-is.
 */

const OPTION_KEYS = Object.freeze(["A", "B", "C", "D"]);

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function selectRandomQuestions(bank, count) {
  if (!Array.isArray(bank)) throw new Error("Question bank must be an array.");
  if (bank.length < count) {
    throw new Error(
      `Question bank has only ${bank.length} active questions but ${count} are required.`,
    );
  }
  return shuffle(bank).slice(0, count);
}

function normalizeQuestionType(value) {
  const type = String(value || "MCQ")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (
    [
      "FILL_IN_THE_BLANK",
      "FILL_IN_BLANK",
      "FILL_BLANK",
      "FILL_IN_THE_BLANK_WITH_OPTIONS",
    ].includes(type)
  ) {
    return "FILL_IN_THE_BLANK";
  }
  return type;
}

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

  const originalCorrectKeys = (
    Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers]
  )
    .filter((answer) => answer !== null && answer !== undefined)
    .map((answer) => {
      if (typeof answer === "string") {
        const value = answer.trim().toUpperCase();
        if (OPTION_KEYS.includes(value)) return value;
        if (/^\d+$/.test(value)) return OPTION_KEYS[Number(value)];
      }
      if (typeof answer === "number") return OPTION_KEYS[answer];
      return null;
    })
    .filter(Boolean);

  shuffled.forEach((option, index) => {
    const newKey = OPTION_KEYS[index];
    shuffledOptions[newKey] = option.text;
    if (originalCorrectKeys.includes(option.key))
      newCorrectAnswers.push(newKey);
  });

  return {
    shuffled_options: shuffledOptions,
    correct_answers:
      newCorrectAnswers.length === 1 ? newCorrectAnswers[0] : newCorrectAnswers,
  };
}

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
    const isFillInTheBlank =
      normalizeQuestionType(question.question_type) === "FILL_IN_THE_BLANK";

    const randomized = isFillInTheBlank
      ? {
          shuffled_options: {},
          // Accepted answers are text values, not option indexes/keys.
          correct_answers: Array.isArray(question.correct_answers)
            ? [...question.correct_answers]
            : question.correct_answers == null
              ? []
              : [question.correct_answers],
        }
      : shuffleOptions
        ? shuffleQuestionOptions(question.options, question.correct_answers)
        : {
            shuffled_options: question.options,
            correct_answers: Array.isArray(question.correct_answers)
              ? question.correct_answers.length === 1
                ? question.correct_answers[0]
                : question.correct_answers
              : question.correct_answers,
          };

    return {
      attempt_id: attemptId ?? null,
      question_id: question.id,
      question_order: index + 1,
      shuffled_options: randomized.shuffled_options,
      correct_answers: randomized.correct_answers,
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
