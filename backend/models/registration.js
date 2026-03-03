const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  teamSize: {
    type: Number,
  },
  utrNumber: {
    type: String,
  },
  screenshot: {
    type: String, // we will store image path later
  },
  status: {
    type: String,
    default: "Pending", // Pending / Approved / Rejected
  }
}, { timestamps: true });

module.exports = mongoose.model("Registration", registrationSchema);