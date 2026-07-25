const Joi = require("joi");

const createQuestionBankSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required(),

  description: Joi.string()
    .trim()
    .allow("")
    .default(""),

  category: Joi.string()
    .hex()
    .length(24)
    .required(),

  tags: Joi.array()
    .items(Joi.string().trim())
    .default([]),

  status: Joi.string()
    .valid("ACTIVE", "INACTIVE", "ARCHIVED")
    .default("ACTIVE"),
});

const updateQuestionBankSchema =
  createQuestionBankSchema.fork(
    ["name", "category"],
    (schema) => schema.optional()
  );

module.exports = {
  createQuestionBankSchema,
  updateQuestionBankSchema,
};