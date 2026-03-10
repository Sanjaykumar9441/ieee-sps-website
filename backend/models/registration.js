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

  checkedIn: {
    type: Boolean,
    default: false,
  },
});
const registrationSchema = new mongoose.Schema(
  {
    registrationOpen: {
      type: Boolean,
      default: true,
    },
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
      required: true,
      unique: true,
    },

    teamName: {
      type: String,
      required: true,
      unique: true,
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
      enum: ["Pending", "Confirmed"],
      default: "Pending",
    },
    entryTime: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Registration", registrationSchema);
