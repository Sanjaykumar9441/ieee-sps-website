const express = require("express");
const router = express.Router();
const Registration = require("../models/registration");

// Create Registration
router.post("/register", async (req, res) => {
  try {
    const newRegistration = new Registration(req.body);
    await newRegistration.save();
    res.status(201).json({ message: "Registration submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error submitting registration" });
  }
});

module.exports = router;