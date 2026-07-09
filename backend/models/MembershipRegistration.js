const mongoose = require("mongoose");

const membershipRegistrationSchema = new mongoose.Schema(
  {
    rollNumber: {
      type: String,
      required: true,
      unique: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    gender: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      required: true,
    },

    year: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    mobile: {
      type: String,
      required: true,
    },

    interested: {
      type: Boolean,
      default: true,
    },

    event: {
      type: String,
      default: "IEEE SPS Membership Development Drive",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "MembershipRegistration",
  membershipRegistrationSchema
);