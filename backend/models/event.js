const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,

    date: String,
    location: String,

    status: {
      type: String,
      enum: ["Upcoming", "Completed"],
      default: "Upcoming",
    },
    pageType: {
      type: String,
      enum: ["regular", "custom"],
      default: "regular",
    },

    customPage: {
      type: String,
      default: "",
    },

    images: [String],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Event", eventSchema);
