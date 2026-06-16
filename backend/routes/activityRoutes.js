const express = require("express");
const router = express.Router();

const ActivityLog = require("../models/ActivityLog");
const verifyToken = require("../middleware/verifyToken");

/* =========================
   GET ACTIVITY LOGS
========================= */

router.get(
  "/",
  verifyToken,
  async (req, res) => {
    try {
      const logs =
        await ActivityLog.find()
          .sort({ createdAt: -1 })
          .limit(200);

      res.json(logs);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch logs",
      });
    }
  }
);

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await ActivityLog.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Log deleted",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to delete log",
    });
  }
});

router.delete("/", verifyToken, async (req, res) => {
  try {
    await ActivityLog.deleteMany({});

    res.json({
      success: true,
      message: "All logs cleared",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to clear logs",
    });
  }
});

module.exports = router;