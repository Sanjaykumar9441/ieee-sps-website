const mongoose = require("mongoose");

const QuestionBankSchema = new mongoose.Schema(
  {
    bankId: {
      type: String,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      default: "",
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionCategory",
      default: null,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    statistics: {
      totalQuestions: {
        type: Number,
        default: 0,
      },

      activeQuestions: {
        type: Number,
        default: 0,
      },

      easyQuestions: {
        type: Number,
        default: 0,
      },

      mediumQuestions: {
        type: Number,
        default: 0,
      },

      hardQuestions: {
        type: Number,
        default: 0,
      },
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
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

module.exports = mongoose.model("QuestionBank", QuestionBankSchema);