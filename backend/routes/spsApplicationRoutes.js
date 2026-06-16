const express = require("express");
const router = express.Router();

const SPSApplication = require("../models/SPSApplication");
const verifyToken = require("../middleware/verifyToken");

/* =========================
   SUBMIT APPLICATION
========================= */

router.post("/", async (req, res) => {
  try {
    const application = new SPSApplication(req.body);

    await application.save();

    res.json({
      success: true,
      message: "Application submitted successfully",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to submit application",
    });
  }
});

/* =========================
   GET ALL APPLICATIONS
========================= */

router.get("/", verifyToken, async (req, res) => {
  try {
    const applications = await SPSApplication.find().sort({
      createdAt: -1,
    });

    res.json(applications);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch applications",
    });
  }
});

/* =========================
   DELETE APPLICATION
========================= */

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await SPSApplication.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to delete application",
    });
  }
});

module.exports = router;