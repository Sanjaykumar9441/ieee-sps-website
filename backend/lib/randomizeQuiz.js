/**
 * randomizeQuiz.js
 *
 * Turns a quiz's question bank into one specific, frozen, shuffled set for
 * one attempt. This runs ONCE per student, at quiz start, and the result is
 * written to attempt_questions — never regenerated, so the student's
 * questions/options stay stable across page reloads, but no two students
 * share the same set or order.
 */

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

/** Fisher–Yates shuffle, returns a new array (does not mutate input). */
function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Randomly selects `count` questions from `bank` without replacement.
 * @param {Array} bank - active questions for the quiz (from Supabase)
 * @param {number} count - questions_per_attempt
 */
function selectRandomQuestions(bank, count) {
  if (bank.length < count) {
    throw new Error(
      `Question bank has only ${bank.length} active questions but ${count} are required per attempt. ` +
        `Upload more questions or lower questions_per_attempt.`
    );
  }
  return shuffle(bank).slice(0, count);
}

/**
 * Shuffles one question's options and recomputes which shuffled key is correct.
 * Input options: {"A": "text1", "B": "text2", "C": "text3", "D": "text4"}
 * Input correct_option: e.g. "B"
 * Returns: { shuffled_options: {...remapped}, correct_key: "<new key>" }
 */
function shuffleQuestionOptions(options, correctOption) {
  const correctText = options[correctOption];
  const texts = OPTION_KEYS.map((k) => options[k]);
  const shuffledTexts = shuffle(texts);

  const shuffled_options = {};
  let correct_key = null;
  OPTION_KEYS.forEach((key, index) => {
    shuffled_options[key] = shuffledTexts[index];
    if (shuffledTexts[index] === correctText) {
      correct_key = key;
    }
  });

  // Guards against silent bugs if two options ever have identical text.
  if (!correct_key) {
    throw new Error('Failed to resolve correct_key after shuffling — check for duplicate option text.');
  }

  return { shuffled_options, correct_key };
}

/**
 * Builds the full attempt_questions payload ready for a bulk insert.
 * @param {string} attemptId
 * @param {Array} bank - active questions for this quiz: [{id, options, correct_option}, ...]
 * @param {number} questionsPerAttempt
 * @returns {Array} rows ready for supabase.from('attempt_questions').insert(rows)
 */
function buildAttemptQuestions(attemptId, bank, questionsPerAttempt) {
  const selected = selectRandomQuestions(bank, questionsPerAttempt);
  const orderedForThisStudent = shuffle(selected); // question order also randomized per student

  return orderedForThisStudent.map((question, index) => {
    const { shuffled_options, correct_key } = shuffleQuestionOptions(
      question.options,
      question.correct_option
    );
    return {
      attempt_id: attemptId,
      question_id: question.id,
      serve_order: index + 1,
      shuffled_options,
      correct_key,
    };
  });
}

module.exports = {
  shuffle,
  selectRandomQuestions,
  shuffleQuestionOptions,
  buildAttemptQuestions,
};