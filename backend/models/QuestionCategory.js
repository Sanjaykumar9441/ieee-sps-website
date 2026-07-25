const mongoose = require("mongoose");
const slugify = require("slugify");
const generateSequenceId = require("../utils/generateSequenceId");

const QuestionCategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: String,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
    },

    color: {
      type: String,
      default: "#2563EB",
    },

    icon: {
      type: String,
      default: "",
    },

    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionCategory",
      default: null,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
    },

    statistics: {
      totalQuestions: {
        type: Number,
        default: 0,
      },

      totalQuestionBanks: {
        type: Number,
        default: 0,
      },
    },

    audit: {
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true,
      },

      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

QuestionCategorySchema.pre("save", async function (next) {
  try {
    if (!this.categoryId) {
      this.categoryId = await generateSequenceId(
        "question_category",
        "CAT"
      );
    }

    if (!this.slug) {
      this.slug = slugify(this.name, {
        lower: true,
        strict: true,
      });
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model(
  "QuestionCategory",
  QuestionCategorySchema
);