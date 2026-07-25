const mongoose = require("mongoose");

const AssessmentResponseSchema = new mongoose.Schema(
  {
    attempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentAttempt",
      required: true,
      index: true,
    },

    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
      index: true,
    },

    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      index: true,
    },

    snapshotQuestionId: {
      type: String,
      required: true,
    },

    selectedAnswers: {
      type: [String],
      default: [],
    },

    isAnswered: {
      type: Boolean,
      default: false,
    },

    isMarkedForReview: {
      type: Boolean,
      default: false,
    },

    isVisited: {
      type: Boolean,
      default: false,
    },

    timeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },

    score: {
      obtained: {
        type: Number,
        default: 0,
      },

      maximum: {
        type: Number,
        default: 0,
      },
    },

    evaluation: {
      isCorrect: {
        type: Boolean,
        default: false,
      },

      evaluatedAt: {
        type: Date,
        default: null,
      },
    },

    answeredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* ===========================
   INDEXES
=========================== */

// One response per question per attempt
AssessmentResponseSchema.index(
  {
    attempt: 1,
    question: 1,
  },
  {
    unique: true,
  }
);

// Fast loading of an attempt
AssessmentResponseSchema.index({
  attempt: 1,
  isAnswered: 1,
});

// Analytics
AssessmentResponseSchema.index({
  question: 1,
  "evaluation.isCorrect": 1,
});

module.exports = mongoose.model(
  "AssessmentResponse",
  AssessmentResponseSchema
);