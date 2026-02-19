const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true }, // Chair, Vice Chair, etc.
    department: String,
    rollNumber: String,
    registrationNumber: String,
    email: String,
    phone: String,
    photo: String,
    priority: { type: Number, default: 5 } // For hierarchy order
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", teamSchema);
