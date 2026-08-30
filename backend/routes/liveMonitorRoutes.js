const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const controller = require("../controllers/liveMonitorController");

router.get("/:assessmentId", verifyToken, controller.getLiveStudents);
router.get("/attempt/:attemptId", verifyToken, controller.getStudentDetails);

module.exports = router;
