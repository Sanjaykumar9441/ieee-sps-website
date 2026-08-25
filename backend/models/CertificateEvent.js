const mongoose = require("mongoose");

const certificateEventSchema = new mongoose.Schema(
  {
    eventCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    eventName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CertificateEvent", certificateEventSchema);
