const mongoose = require("mongoose");
const Counter = require("./counter");

const memberSchema = new mongoose.Schema({
  fullName: String,
  rollNo: String,
  email: String,
  phone: String,
  department: String,
  year: String,
  college: String,
});
const registrationSchema = new mongoose.Schema(
  {
    // combo | buildathon
    eventType: {
      type: String,
      required: true,
    },

    eventName: {
      type: String,
      required: true,
    },

    // Generated automatically
    registrationId: {
      type: String,
      unique: true,
    },

    teamName: {
      type: String,
      required: true,
    },

    teamSize: {
      type: Number,
      required: true,
    },

    teamMembers: [memberSchema],
    expectedAmount: {
      type: Number,
    },

    accommodationRequired: {
      type: Boolean,
      default: false,
    },

    hostelMembers: [memberSchema],

    payment: {
      userTransactionId: {
        type: String,
        required: true,
        unique: true,
      },
      screenshotUrl: {
        type: String,
        required: true,
      },
      verified: {
        type: Boolean,
        default: false,
      },
    },

    registrationStatus: {
      type: String,
      enum: ["Pending", "Confirmed"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Registration", registrationSchema);
