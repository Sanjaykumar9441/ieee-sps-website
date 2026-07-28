const express = require("express");

const router = express.Router();

const upload = require("../middleware/spaceDayUpload");

const {
  submitRegistration,
  checkMembers,
  downloadAcknowledgement,
  getRegistrations,
  getRegistrationStatus,
} = require("../controllers/spaceDayRegistrationController");

const {
  getPublicSettings,
} = require("../controllers/eventSettingsController");

/* ============================================
   CHECKING
============================================ */

router.post(
  "/check-members",
  checkMembers
);

/* ============================================
   SPACE DAY REGISTRATION
============================================ */

router.get(
  "/settings/public",
  getPublicSettings
);

router.post(
  "/register",
  upload.single("paymentScreenshot"),
  submitRegistration
);

router.get(
  "/acknowledgement/:registrationId",
  downloadAcknowledgement
);

router.get(
  "/status/:registrationId",
  getRegistrationStatus
);

router.get(
  "/registrations",
  getRegistrations
);

module.exports = router;