const verifyToken = require("../middleware/verifyToken");
const express = require("express");

const router = express.Router();

const controller = require("../controllers/studentAuthController");

/* ===========================
   GET STUDENT DETAILS
=========================== */

router.get("/details/:studentId", verifyToken, controller.getStudentDetails);

/* ===========================
   GET ALLOWED STUDENTS
=========================== */

router.get("/:assessmentId", verifyToken, controller.getAllowedStudents);

/* ===========================
   STUDENT LOGIN
=========================== */

router.post("/send-otp", controller.sendOtp);

router.post("/verify-otp", controller.verifyOtp);

/* ===========================
   ADMIN ACTIONS
=========================== */

router.post("/send-bulk-otp", verifyToken, controller.sendBulkOtp);

router.post("/block", verifyToken, controller.blockStudents);

router.post("/unblock", verifyToken, controller.unblockStudents);

router.post("/delete", verifyToken, controller.deleteStudents);

module.exports = router;
