const mongoose = require("mongoose");

const QuestionBankQuestionSchema = new mongoose.Schema(
  {
    questionBank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionBank",
      required: true,
      index: true,
    },

    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      index: true,
    },

    order: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ===========================
   INDEXES
=========================== */

// Prevent duplicate mapping
QuestionBankQuestionSchema.index(
  {
    questionBank: 1,
    question: 1,
  },
  {
    unique: true,
  }
);

// Fast retrieval of active questions in display order
QuestionBankQuestionSchema.index({
  questionBank: 1,
  isActive: 1,
  order: 1,
});

/* Prevent duplicate mapping */

QuestionBankQuestionSchema.index(
  {
    questionBank: 1,
    question: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "QuestionBankQuestion",
  QuestionBankQuestionSchema
);