const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const {
  updatePaymentStatus,
  deleteRegistration,
} = require("../controllers/spaceDayAdminController");

const {
  getSettings,
  updateMaster,
  updateEvent,
} = require("../controllers/eventSettingsController");

// Payment
router.put(
  "/payment/:registrationId",
  verifyToken,
  updatePaymentStatus
);

// Delete
router.delete(
  "/:registrationId",
  verifyToken,
  deleteRegistration
);

// Registration Settings
router.get(
  "/settings",
  verifyToken,
  getSettings
);

router.patch(
  "/settings/master",
  verifyToken,
  updateMaster
);

router.patch(
  "/settings/event",
  verifyToken,
  updateEvent
);

module.exports = router;