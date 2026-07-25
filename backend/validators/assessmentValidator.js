const Joi = require("joi");

const questionBankSchema = Joi.object({
  bank: Joi.string()
    .hex()
    .length(24)
    .required(),

  questionsPerAttempt: Joi.number()
    .integer()
    .min(1)
    .required(),

  selectionStrategy: Joi.string()
    .valid(
      "RANDOM",
      "SEQUENTIAL"
    )
    .default("RANDOM"),

  categoryFilter: Joi.array()
    .items(
      Joi.string()
        .hex()
        .length(24)
    )
    .default([]),

  difficultyDistribution: Joi.object({
    EASY: Joi.number().min(0).default(0),

    MEDIUM: Joi.number().min(0).default(0),

    HARD: Joi.number().min(0).default(0),
  }).default(),
});

const createAssessmentSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .required(),

  description: Joi.string()
    .allow("")
    .default(""),

  instructions: Joi.array()
    .items(Joi.string())
    .default([]),

  duration: Joi.number()
    .integer()
    .min(1)
    .required(),

  marksPerQuestion: Joi.number()
  .min(1)
  .required(),

  passingMarks: Joi.number()
    .min(0)
    .required(),

  questionBanks: Joi.array()
    .items(questionBankSchema)
    .min(1)
    .required(),

  status: Joi.string()
    .valid(
      "DRAFT",
      "PUBLISHED",
      "ACTIVE",
      "COMPLETED",
      "ARCHIVED"
    )
    .default("DRAFT"),
});

const updateAssessmentSchema =
  createAssessmentSchema.fork(
    [
      "title",
      "duration",
      "marksPerQuestion",
      "passingMarks",
      "questionBanks",
    ],
    (schema) => schema.optional()
  );

module.exports = {
  createAssessmentSchema,
  updateAssessmentSchema,
};