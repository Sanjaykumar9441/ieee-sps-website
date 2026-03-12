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
  collegeCity: String,
  collegePincode: String,
  collegeDistrict: String,
  collegeState: String,
});
const registrationSchema = new mongoose.Schema(
  {
    // combo | buildathon
    eventType: {
      type: String,
      enum: ["combo", "buildathon"],
      required: true,
    },

    eventName: {
      type: String,
      required: true,
    },

    // Generated automatically
    registrationId: {
      type: String,
      required: true,
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

    startup: {
      answer: String,
      idea: String,
    },

    accommodationRequired: {
      type: Boolean,
      default: false,
    },

    hostelMembers: [memberSchema],

    arrivalDate: String,
    arrivalTime: String,
    departureDate: String,
    departureTime: String,

    payment: {
      userTransactionId: {
        type: String,
        required: true,
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
    telegramMessageId: {
      type: Number,
    },

    registrationStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Registration", registrationSchema);
