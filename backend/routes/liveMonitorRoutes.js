const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const controller = require("../controllers/liveMonitorController");

// Keep the specific attempt route before the generic assessmentId route.
router.get("/attempt/:attemptId", verifyToken, controller.getStudentDetails);
router.get("/:assessmentId", verifyToken, controller.getLiveStudents);

module.exports = router;
