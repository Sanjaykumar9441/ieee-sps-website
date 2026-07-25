const express = require("express");

const router = express.Router();

const upload = require("../middleware/spaceDayUpload");

const {
  submitRegistration,
} = require("../controllers/spaceDayRegistrationController");

/* ============================================
   SPACE DAY REGISTRATION
============================================ */

router.post(
  "/register",
  upload.single("paymentScreenshot"),
  submitRegistration
);

module.exports = router;