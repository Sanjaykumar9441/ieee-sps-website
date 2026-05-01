const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,

  date: String,
  location: String,

  status: {
    type: String,
    enum: ["Upcoming", "Completed"],
    default: "Upcoming"
  },

  images: [String]

}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);