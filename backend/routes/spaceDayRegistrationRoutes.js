const express = require("express");

const router = express.Router();

const upload = require("../middleware/spaceDayUpload");

const {
  submitRegistration,
  checkMembers,
  downloadAcknowledgement,
  getRegistrations,
  getRegistrationStatus,
  markAttendance,
  getRegistrationForAttendance,
  getAttendanceSummary,
  getAttendanceLogs,
  exportAttendanceExcel,
  bulkAttendance,
  removeAttendance,
  getMissingParticipants,
} = require("../controllers/spaceDayRegistrationController");

const { getPublicSettings } = require("../controllers/eventSettingsController");

/* ============================================
   CHECKING
============================================ */

router.post("/check-members", checkMembers);

/* ============================================
   SPACE DAY REGISTRATION
============================================ */

router.get("/settings/public", getPublicSettings);

router.post(
  "/register",
  upload.single("paymentScreenshot"),
  submitRegistration,
);

router.get("/acknowledgement/:registrationId", downloadAcknowledgement);

router.get("/status/:registrationId", getRegistrationStatus);

router.get("/registrations", getRegistrations);

const verifyToken = require("../middleware/verifyToken");

router.post("/attendance", verifyToken, markAttendance);

router.get("/attendance-summary", verifyToken, getAttendanceSummary);

router.get("/attendance/logs", verifyToken, getAttendanceLogs);

router.get("/attendance/export", verifyToken, exportAttendanceExcel);

router.post("/attendance/bulk", verifyToken, bulkAttendance);

router.post("/attendance/remove", verifyToken, removeAttendance);

router.get("/attendance/missing", verifyToken, getMissingParticipants);

router.get("/attendance/:registrationId", verifyToken, getRegistrationForAttendance);

module.exports = router;
