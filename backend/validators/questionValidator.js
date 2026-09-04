function validate(question) {
  if (!question.bank_id) return "Question Bank is required.";
  if (!question.question_text?.trim()) return "Question text is required.";

  const type = String(question.question_type || "MCQ")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (
    !["MCQ", "MULTIPLE_CORRECT", "TRUE_FALSE", "FILL_IN_THE_BLANK"].includes(
      type,
    )
  ) {
    return "Question type must be MCQ, Multiple Correct, True/False or Fill in the Blank.";
  }

  if (type === "TRUE_FALSE") {
    if (
      !Array.isArray(question.correct_answers) ||
      question.correct_answers.length !== 1
    ) {
      return "True/False requires exactly one correct answer.";
    }
    if (![0, 1].includes(Number(question.correct_answers[0]))) {
      return "True/False correct answer must be True or False.";
    }
    return null;
  }

  if (type === "FILL_IN_THE_BLANK") {
    if (
      !Array.isArray(question.options) ||
      question.options.length < 2 ||
      question.options.length > 4
    ) {
      return "Fill in the Blank requires 2 to 4 options.";
    }
    if (
      !Array.isArray(question.correct_answers) ||
      question.correct_answers.length !== 1
    ) {
      return "Fill in the Blank requires exactly one correct option.";
    }
    const invalid = question.correct_answers.some(
      (answer) =>
        !Number.isInteger(Number(answer)) ||
        Number(answer) < 0 ||
        Number(answer) >= question.options.length,
    );
    if (invalid)
      return "Fill in the Blank correct answer must point to an available option.";
    return null;
  }

  if (
    !Array.isArray(question.options) ||
    question.options.length < 2 ||
    question.options.length > 4
  ) {
    return "MCQ questions must have 2 to 4 options.";
  }

  if (
    !Array.isArray(question.correct_answers) ||
    question.correct_answers.length < 1
  ) {
    return "At least one correct answer is required.";
  }

  if (type === "MCQ" && question.correct_answers.length !== 1) {
    return "MCQ requires exactly one correct answer.";
  }

  if (type === "MULTIPLE_CORRECT" && question.correct_answers.length < 2) {
    return "Multiple Correct requires at least two correct answers.";
  }

  const invalid = question.correct_answers.some(
    (answer) =>
      !Number.isInteger(Number(answer)) ||
      Number(answer) < 0 ||
      Number(answer) >= question.options.length,
  );
  if (invalid) return "Correct answer must point to an available option.";

  return null;
}

module.exports = { validate };
