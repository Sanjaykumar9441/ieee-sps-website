const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ["combo", "buildathon"],
    required: true,
    unique: true
  },

  title: { type: String },
  description: { type: String },

  date: { type: String },
  location: { type: String },

  status: {
    type: String,
    enum: ["Upcoming", "Completed"],
    default: "Upcoming"
  },

  registrationOpen: {
    type: Boolean,
    default: false
  },

  images: [String]

}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);