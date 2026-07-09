const mongoose = require("mongoose");

const membershipSettingsSchema = new mongoose.Schema(
  {
    maxRegistrations: {
      type: Number,
      default: 100,
    },

    registrationOpen: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "MembershipSettings",
  membershipSettingsSchema
);