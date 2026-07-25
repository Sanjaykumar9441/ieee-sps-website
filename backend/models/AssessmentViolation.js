const mongoose = require("mongoose");

const AssessmentViolationSchema = new mongoose.Schema(
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

    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "TAB_SWITCH",
        "FULLSCREEN_EXIT",
        "WINDOW_BLUR",
        "PAGE_REFRESH",
        "COPY_ATTEMPT",
        "PASTE_ATTEMPT",
        "RIGHT_CLICK",
        "TEXT_SELECTION",
        "DEVTOOLS_OPEN",
        "NETWORK_DISCONNECT",
        "MULTIPLE_LOGIN",
        "TIME_MANIPULATION",
        "OTHER",
      ],
      required: true,
      index: true,
    },

    severity: {
      type: String,
      enum: [
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL",
      ],
      default: "LOW",
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },

    questionNumber: {
      type: Number,
      default: null,
    },

    metadata: {
      browser: {
        type: String,
        default: "",
      },

      operatingSystem: {
        type: String,
        default: "",
      },

      ipAddress: {
        type: String,
        default: "",
      },

      device: {
        type: String,
        default: "",
      },
    },

    detectedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ===========================
   INDEXES
=========================== */

AssessmentViolationSchema.index({
  attempt: 1,
  detectedAt: -1,
});

AssessmentViolationSchema.index({
  assessment: 1,
  type: 1,
});

module.exports = mongoose.model(
  "AssessmentViolation",
  AssessmentViolationSchema
);