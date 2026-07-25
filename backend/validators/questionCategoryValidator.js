const Joi = require("joi");

const createQuestionCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),

  description: Joi.string().allow("").optional(),

  color: Joi.string()
    .pattern(/^#([0-9A-F]{3}|[0-9A-F]{6})$/i)
    .default("#2563EB"),

  icon: Joi.string().allow("").optional(),

  parentCategory: Joi.string()
    .hex()
    .length(24)
    .allow(null, ""),

  status: Joi.string()
    .valid("ACTIVE", "INACTIVE", "ARCHIVED")
    .default("ACTIVE"),
});

const updateQuestionCategorySchema =
  createQuestionCategorySchema.fork(
    ["name"],
    (schema) => schema.optional()
  );

module.exports = {
  createQuestionCategorySchema,
  updateQuestionCategorySchema,
};