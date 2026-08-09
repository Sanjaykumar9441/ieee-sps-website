function validate(question) {
  if (!question.bank_id) return "Question Bank is required.";

  if (!question.question_text?.trim()) return "Question text is required.";

  if (!question.question_type) return "Question type is required.";

  if (!question.options) return "Options are required.";

  const optionKeys = Object.keys(question.options);

  if (optionKeys.length < 2) return "Minimum two options required.";

  if (!question.correct_answers) return "Correct answer required.";

  if (question.marks == null || question.marks <= 0)
    return "Marks must be greater than zero.";

  if (question.negative_marks != null && question.negative_marks < 0)
    return "Negative marks cannot be negative.";

  return null;
}

module.exports = {
  validate,
};
