const express = require("express");

const router = express.Router();

const upload = require("../middleware/spaceDayUpload");

const {
  submitRegistration,
  checkMembers,
  downloadAcknowledgement,
  getRegistrations,
} = require("../controllers/spaceDayRegistrationController");

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
  "/registrations",
  getRegistrations
);

module.exports = router;