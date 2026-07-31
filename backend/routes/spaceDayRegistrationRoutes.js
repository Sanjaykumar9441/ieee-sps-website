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

router.post("/attendance", markAttendance);

router.get("/attendance-summary", getAttendanceSummary);

router.get("/attendance/logs", getAttendanceLogs);

router.get("/attendance/export", exportAttendanceExcel);

router.post("/attendance/bulk", bulkAttendance);

router.post("/attendance/remove", removeAttendance);

router.get("/attendance/missing", getMissingParticipants);

router.get("/attendance/:registrationId", getRegistrationForAttendance);

module.exports = router;
