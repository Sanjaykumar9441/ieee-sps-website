const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const controller = require("../controllers/liveMonitorController");

/* ============================================
   Live Student Monitor
============================================ */

router.get("/:assessmentId", verifyToken, controller.getLiveStudents);

/* ============================================
   Single Student Details
============================================ */

router.get("/attempt/:attemptId", verifyToken, controller.getStudentDetails);

module.exports = router;
