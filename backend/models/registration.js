const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  department: String,
  year: String,
  college: String
});

const registrationSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true
  },

  teamName: {
    type: String,
    required: true
  },

  teamSize: {
    type: Number,
    required: true
  },

  teamMembers: [memberSchema],

  accommodationRequired: {
    type: Boolean,
    default: false
  },

  accommodationMembers: [String],

  paymentStatus: {
    type: String,
    default: "Pending"
  },

  registrationStatus: {
    type: String,
    default: "Pending"
  }

}, { timestamps: true });

module.exports = mongoose.model("Registration", registrationSchema);