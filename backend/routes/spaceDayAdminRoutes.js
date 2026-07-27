const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const {
  updatePaymentStatus,
  deleteRegistration,
} = require("../controllers/spaceDayAdminController");

router.put(
  "/payment/:registrationId",
  verifyToken,
  updatePaymentStatus
);

router.delete(
  "/:registrationId",
  verifyToken,
  deleteRegistration
);

module.exports = router;