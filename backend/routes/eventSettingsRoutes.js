const express = require("express");

const verifyToken = require("../middleware/verifyToken");

const {
  getSettings,
  updateMaster,
  updateEvent,
} = require("../controllers/eventSettingsController");

const router = express.Router();

router.get(
  "/",
  verifyToken,
  getSettings,
);

router.patch(
  "/master",
  verifyToken,
  updateMaster,
);

router.patch(
  "/event",
  verifyToken,
  updateEvent,
);

module.exports = router;