const express = require("express");
const router = express.Router();

const MembershipRegistration = require("../models/MembershipRegistration");
const MembershipSettings = require("../models/MembershipSettings");

/* ==========================================
   REGISTER FOR MEMBERSHIP DRIVE
========================================== */

router.post("/register", async (req, res) => {
  try {
    const {
      rollNumber,
      fullName,
      gender,
      department,
      year,
      email,
      mobile,
      interested,
      event,
    } = req.body;

    // Get Membership Settings
    let settings = await MembershipSettings.findOne();

    if (!settings) {
      settings = await MembershipSettings.create({
        maxRegistrations: 100,
        registrationOpen: true,
      });
    }

    // Check if registration is manually closed
    if (!settings.registrationOpen) {
      return res.status(400).json({
        success: false,
        message: "Membership registrations are currently closed.",
      });
    }

    // Count current registrations
    const currentCount = await MembershipRegistration.countDocuments();

    // Check maximum registrations
    if (currentCount >= settings.maxRegistrations) {
      // Automatically close registration
      settings.registrationOpen = false;
      await settings.save();

      return res.status(400).json({
        success: false,
        message:
          "Registration limit has been reached. Registrations are now closed.",
      });
    }

    // Check duplicate email and roll number
    const existing = await MembershipRegistration.findOne({
      $or: [{ rollNumber: req.body.rollNumber }, { email: req.body.email }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already registered.",
      });
    }

    const registration = new MembershipRegistration({
      rollNumber,
      fullName,
      gender,
      department,
      year,
      email,
      mobile,
      interested,
      event,
    });

    await registration.save();

    res.status(201).json({
      success: true,
      message: "Registration submitted successfully.",
      registration,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/* ==========================================
   GET ALL REGISTRATIONS
========================================== */

router.get("/", async (req, res) => {
  try {
    const registrations = await MembershipRegistration.find().sort({
      createdAt: -1,
    });

    res.json(registrations);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch registrations",
    });
  }
});

/* ==========================================
   DELETE REGISTRATION
========================================== */

router.delete("/:id", async (req, res) => {
  try {
    await MembershipRegistration.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Registration deleted successfully",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to delete registration",
    });
  }
});

/* ==========================================
   GET MEMBERSHIP SETTINGS
========================================== */

router.get("/settings", async (req, res) => {
  try {
    let settings = await MembershipSettings.findOne();

    // Create default settings if none exist
    if (!settings) {
      settings = await MembershipSettings.create({
        maxRegistrations: 100,
        registrationOpen: true,
      });
    }

    const currentCount = await MembershipRegistration.countDocuments();

    res.json({
      ...settings.toObject(),
      currentCount,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch settings",
    });
  }
});

/* ==========================================
   UPDATE MEMBERSHIP SETTINGS
========================================== */

router.put("/settings", async (req, res) => {
  try {
    const { maxRegistrations, registrationOpen } = req.body;

    let settings = await MembershipSettings.findOne();

    if (!settings) {
      settings = new MembershipSettings();
    }

    settings.maxRegistrations = maxRegistrations;

    settings.registrationOpen = registrationOpen;

    await settings.save();

    res.json({
      success: true,
      settings,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to update settings",
    });
  }
});

module.exports = router;
