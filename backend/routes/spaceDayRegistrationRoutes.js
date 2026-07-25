const express = require("express");

const router = express.Router();

const upload = require("../middleware/spaceDayUpload");

const {
  submitRegistration,
  checkMembers,
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

module.exports = router;