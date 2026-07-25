const Joi = require("joi");

const optionSchema = Joi.object({
  id: Joi.string().trim().required(),
  text: Joi.string().trim().required(),
});

const createQuestionSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .required(),

  type: Joi.string()
    .valid(
      "SINGLE_CHOICE",
      "MULTIPLE_CHOICE",
      "TRUE_FALSE",
      "FILL_BLANK",
      "NUMERIC",
      "MATCH",
      "SEQUENCE",
      "IMAGE",
      "AUDIO",
      "VIDEO",
      "CODE"
    )
    .required(),

  statement: Joi.string()
    .trim()
    .required(),

  options: Joi.array()
    .items(optionSchema)
    .default([]),

  correctAnswers: Joi.array()
    .items(Joi.string())
    .default([]),

  explanation: Joi.string()
    .allow("")
    .default(""),

  marks: Joi.number()
    .min(0)
    .default(1),

  negativeMarks: Joi.number()
    .min(0)
    .default(0),

  difficulty: Joi.string()
    .valid("EASY", "MEDIUM", "HARD")
    .default("MEDIUM"),

  category: Joi.string()
    .hex()
    .length(24)
    .required(),

  tags: Joi.array()
    .items(Joi.string())
    .default([]),

  status: Joi.string()
    .valid("ACTIVE", "INACTIVE", "ARCHIVED")
    .default("ACTIVE"),
});

const updateQuestionSchema =
  createQuestionSchema.fork(
    ["title", "type", "statement", "category"],
    (schema) => schema.optional()
  );

module.exports = {
  createQuestionSchema,
  updateQuestionSchema,
};