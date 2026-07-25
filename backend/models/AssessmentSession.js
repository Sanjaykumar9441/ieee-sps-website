const mongoose = require("mongoose");

const AssessmentSessionSchema = new mongoose.Schema(
  {
    attempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentAttempt",
      required: true,
      unique: true,
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

    currentQuestion: {
      type: Number,
      default: 1,
      min: 1,
    },

    remainingTime: {
      type: Number,
      required: true,
      min: 0,
    },

    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },

    lastActivity: {
      type: Date,
      default: Date.now,
    },

    sessionStatus: {
      type: String,
      enum: [
        "ACTIVE",
        "PAUSED",
        "DISCONNECTED",
        "SUBMITTED",
        "EXPIRED",
      ],
      default: "ACTIVE",
      index: true,
    },

    redisSyncedAt: {
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

AssessmentSessionSchema.index({
  assessment: 1,
  sessionStatus: 1,
});

AssessmentSessionSchema.index({
  lastHeartbeat: 1,
});

module.exports = mongoose.model(
  "AssessmentSession",
  AssessmentSessionSchema
);