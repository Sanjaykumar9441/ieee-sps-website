function validate(row) {
  if (!row.question_text) return "Question missing";

  if (!row.option_a) return "Option A missing";

  if (!row.option_b) return "Option B missing";

  if (!row.option_c) return "Option C missing";

  if (!row.option_d) return "Option D missing";

  if (!["A", "B", "C", "D"].includes(row.correct_option))
    return "Invalid Answer";

  return null;
}

module.exports = {
  validate,
};
