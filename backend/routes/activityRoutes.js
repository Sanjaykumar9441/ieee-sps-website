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

module.exports = router;