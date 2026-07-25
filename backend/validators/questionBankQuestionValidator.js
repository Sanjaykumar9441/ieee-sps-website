const Joi = require("joi");

const createQuestionBankQuestionSchema = Joi.object({
  questionBank: Joi.string()
    .hex()
    .length(24)
    .required(),

  questions: Joi.array()
    .items(
      Joi.string()
        .hex()
        .length(24)
    )
    .min(1)
    .required(),
});

module.exports = {
  createQuestionBankQuestionSchema,
};