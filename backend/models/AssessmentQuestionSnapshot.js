const mongoose = require("mongoose");

/* ===========================
   SNAPSHOT OPTION
=========================== */

const SnapshotOptionSchema = new mongoose.Schema(
  {
    optionId: {
      type: String,
      required: true,
    },

    text: {
      type: String,
      default: "",
    },

    image: {
      publicId: String,
      url: String,
    },
  },
  {
    _id: false,
  }
);

/* ===========================
   SNAPSHOT QUESTION
=========================== */

const SnapshotQuestionSchema = new mongoose.Schema(
  {
    originalQuestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },

    questionId: {
      type: String,
      required: true,
    },

    version: {
      type: Number,
      default: 1,
    },

    type: String,

    statement: {
      text: String,

      image: {
        publicId: String,
        url: String,
      },

      audio: {
        publicId: String,
        url: String,
      },

      video: {
        publicId: String,
        url: String,
      },
    },

    options: [SnapshotOptionSchema],

    correctAnswers: [String],

    explanation: String,

    marks: Number,

    negativeMarks: Number,

    difficulty: String,

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionCategory",
    },
  },
  {
    _id: false,
  }
);

/* ===========================
   MAIN SNAPSHOT
=========================== */

const AssessmentQuestionSnapshotSchema = new mongoose.Schema(
  {
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
      index: true,
    },

    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentAttempt",
      required: true,
      unique: true,
      index: true,
    },

    questions: {
      type: [SnapshotQuestionSchema],
      required: true,
    },

    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "AssessmentQuestionSnapshot",
  AssessmentQuestionSnapshotSchema
);