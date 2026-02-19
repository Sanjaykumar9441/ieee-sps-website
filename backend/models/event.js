const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },

  date: { type: String, required: true },
  location: { type: String, required: true },

  status: {
    type: String,
    enum: ["Upcoming", "Completed"],
    default: "Upcoming"
  },

  images: [String]

}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
