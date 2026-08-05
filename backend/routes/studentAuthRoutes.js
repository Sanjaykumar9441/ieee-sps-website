const verifyToken = require("../middleware/verifyToken");

const express = require("express");

const router = express.Router();

const controller = require("../controllers/studentAuthController");

router.post("/send-otp", controller.sendOtp); // Student login OTP

router.post("/send-bulk-otp", verifyToken, controller.sendBulkOtp); // Admin bulk OTP

router.post("/block", verifyToken, controller.blockStudents);

router.post("/unblock", verifyToken, controller.unblockStudents);

router.post("/delete", verifyToken, controller.deleteStudents);

router.post("/verify-otp", controller.verifyOtp);

module.exports = router;
