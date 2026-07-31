const mongoose = require("mongoose");

const AttendanceLogSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
    },

    eventType: {
      type: String,
      required: true,
    },

    teamName: {
      type: String,
      default: "",
    },

    memberName: {
      type: String,
      required: true,
    },

    rollNumber: {
      type: String,
      required: true,
    },

    memberIndex: {
      type: Number,
      required: true,
    },

    markedBy: {
      type: String,
      required: true,
    },

    action: {
      type: String,
      enum: ["MARK", "REMOVE"],
      default: "MARK",
    },

    markedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("AttendanceLog", AttendanceLogSchema);
