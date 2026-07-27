const mongoose = require("mongoose");

/* ======================================
   MEMBER SCHEMA
====================================== */

const MemberSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "",
    },

    rollNumber: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    year: {
      type: String,
      required: true,
      trim: true,
    },

    college: {
      type: String,
      required: true,
      trim: true,
    },

    otherCollege: {
      type: String,
      default: "",
    },

    otherCollegeCity: {
      type: String,
      default: "",
    },

    otherCollegeDistrict: {
      type: String,
      default: "",
    },

    otherCollegeState: {
      type: String,
      default: "",
    },

    otherCollegePincode: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

/* ======================================
   MAIN REGISTRATION SCHEMA
====================================== */

const SpaceDayRegistrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      unique: true,
      index: true,
    },

    eventType: {
      type: String,
      enum: ["astroquiz", "astrodesign", "astromodeler"],
      required: true,
    },

    registrationType: {
      type: String,
      enum: ["individual", "team"],
      required: true,
    },

    teamName: {
      type: String,
      default: "",
    },

    teamSize: {
      type: Number,
      default: 1,
    },

    selectedTheme: {
      type: String,
      default: "",
    },

    members: {
      type: [MemberSchema],
      required: true,
    },

    accommodation: {
      type: Boolean,
      default: false,
    },

    accommodationMembers: {
      type: [Boolean],
      default: [],
    },

    arrivalDate: String,
    arrivalTime: String,

    departureDate: String,
    departureTime: String,

    transactionId: {
      type: String,
      required: true,
      unique: true,
    },

    paymentScreenshot: {
      type: String,
      default: "",
    },

    paymentScreenshotPublicId: {
      type: String,
      default: "",
    },

    registrationFee: {
      type: Number,
      default: 0,
    },

    accommodationFee: {
      type: Number,
      default: 0,
    },

    numberOfDays: {
      type: Number,
      default: 0,
    },

    totalFee: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    verifiedBy: {
      type: String,
      default: "",
    },

    verificationMethod: {
      type: String,
      enum: ["Dashboard", "Telegram", ""],
      default: "",
    },

    verifiedAt: {
      type: Date,
    },

    telegramChatId: {
      type: String,
      default: "",
    },

    telegramMessageId: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "SpaceDayRegistration",
  SpaceDayRegistrationSchema,
  "spaceday2026registrations",
);
