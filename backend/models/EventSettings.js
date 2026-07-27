const mongoose = require("mongoose");

const EventSettingsSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      unique: true,
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    events: {
      astroquiz: {
        type: Boolean,
        default: true,
      },

      astrodesign: {
        type: Boolean,
        default: true,
      },

      astromodeler: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "EventSettings",
  EventSettingsSchema
);