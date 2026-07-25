const mongoose = require("mongoose");
const generateSequenceId = require("../utils/generateSequenceId");

/* ===========================
   MAIN SCHEMA
=========================== */

const AssessmentAttemptSchema = new mongoose.Schema(
  {
    attemptId: {
      type: String,
      unique: true,
      index: true,
    },

    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
      index: true,
    },

    snapshot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentQuestionSnapshot",
      required: true,
    },

    participant: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      fullName: {
        type: String,
        required: true,
      },

      email: {
        type: String,
        required: true,
        lowercase: true,
      },

      rollNumber: {
        type: String,
        default: "",
      },
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    duration: {
      type: Number,
      default: 0,
    },

    score: {
      obtained: {
        type: Number,
        default: 0,
      },

      total: {
        type: Number,
        default: 0,
      },

      percentage: {
        type: Number,
        default: 0,
      },
    },

    summary: {
      totalQuestions: {
        type: Number,
        default: 0,
      },

      answered: {
        type: Number,
        default: 0,
      },

      unanswered: {
        type: Number,
        default: 0,
      },

      markedForReview: {
        type: Number,
        default: 0,
      },

      correct: {
        type: Number,
        default: 0,
      },

      wrong: {
        type: Number,
        default: 0,
      },
    },

    status: {
      type: String,
      enum: [
        "STARTED",
        "IN_PROGRESS",
        "SUBMITTED",
        "AUTO_SUBMITTED",
        "DISQUALIFIED",
        "CANCELLED",
      ],
      default: "STARTED",
      index: true,
    },

    audit: {
      ipAddress: {
        type: String,
        default: "",
      },

      browser: {
        type: String,
        default: "",
      },

      device: {
        type: String,
        default: "",
      },

      operatingSystem: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  }
);

/* ===========================
   INDEXES
=========================== */

AssessmentAttemptSchema.index({
    assessment: 1,
    "participant.email": 1
});

AssessmentAttemptSchema.index({
    status: 1,
    startedAt: -1
});

/* ===========================
   ID GENERATION
=========================== */

AssessmentAttemptSchema.pre("save", async function(next) {
    try {

        if (!this.attemptId) {
            this.attemptId = await generateSequenceId(
                "attempt",
                "ATT"
            );
        }

        next();

    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model(
    "AssessmentAttempt",
    AssessmentAttemptSchema
);