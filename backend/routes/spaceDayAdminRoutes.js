const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const {
  updatePaymentStatus,
} = require("../controllers/spaceDayAdminController");

router.put(
  "/payment/:registrationId",
  verifyToken,
  updatePaymentStatus
);

module.exports = router;