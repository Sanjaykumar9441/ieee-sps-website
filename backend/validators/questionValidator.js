function validate(question) {
  if (!question.bank_id) return "Question Bank is required.";
  if (!question.question_text?.trim()) return "Question text is required.";
  const type = String(question.question_type || "MCQ").toUpperCase();
  if (!["MCQ", "MULTIPLE_CORRECT"].includes(type)) return "Only MCQ and multiple-correct questions are supported.";
  if (!Array.isArray(question.options) || question.options.length !== 4) return "Exactly four MCQ options are required.";
  if (!Array.isArray(question.correct_answers) || question.correct_answers.length < 1) return "At least one correct answer is required.";
  if (type === "MCQ" && question.correct_answers.length !== 1) return "MCQ requires exactly one correct answer.";

  const answer = question.correct_answers[0];
  const validIndex = Number.isInteger(answer) && answer >= 0 && answer < 4;
  const validLetter = typeof answer === "string" && /^[A-D]$/i.test(answer);
  if (!validIndex && !validLetter) return "Correct answer must be A-D or option index 0-3.";

  return null;
}

module.exports = { validate };
