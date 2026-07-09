const mongoose = require("mongoose");

const adminAccessSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },

    name: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      default: "",
    },

    isExternal: {
      type: Boolean,
      default: false,
    },

    mustChangePassword: {
      type: Boolean,
      default: true,
    },

    lastPasswordChange: {
      type: Date,
      default: null,
    },

    lastLogin: {
      type: Date,
    },

    loginHistory: [
      {
        loginAt: {
          type: Date,
          default: Date.now,
        },

        device: {
          type: String,
          default: "",
        },
      },
    ],

    isPaused: {
      type: Boolean,
      default: false,
    },

    pauseReason: {
      type: String,
      default: "",
    },

    username: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    permissions: {
      events: {
        type: Boolean,
        default: false,
      },

      team: {
        type: Boolean,
        default: false,
      },

      registrations: {
        type: Boolean,
        default: false,
      },

      messages: {
        type: Boolean,
        default: false,
      },

      spsApplications: {
        type: Boolean,
        default: false,
      },

      membershipRegistrations: {
        type: Boolean,
        default: false,
      },

      dashboardOverview: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AdminAccess", adminAccessSchema);
