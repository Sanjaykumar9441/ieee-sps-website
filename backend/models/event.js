const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({

  title: { type: String, required: true },
  description: { type: String },

  date: { type: String },
  location: { type: String },

  status: {
    type: String,
    enum: ["Upcoming", "Completed"],
    required: true
  },

  images: [String],

}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);