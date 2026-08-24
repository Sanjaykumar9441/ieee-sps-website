const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    eventCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    certificateType: {
      type: String,
      enum: ["PARTICIPATION", "MERIT", "VOLUNTEER"],
      required: true,
    },

    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    rollNo: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    branch: {
      type: String,
      default: "",
      trim: true,
    },

    college: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    eventDate: {
      type: String,
      required: true,
      trim: true,
    },

    templateName: {
      type: String,
      default: "participation",
    },

    downloadCount: {
      type: Number,
      default: 0,
    },

    lastDownloadedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// A roll number can have one certificate of each type for each event.
certificateSchema.index(
  { eventCode: 1, certificateType: 1, rollNo: 1 },
  { unique: true }
);

module.exports = mongoose.model("Certificate", certificateSchema);
