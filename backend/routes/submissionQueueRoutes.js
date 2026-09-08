const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const controller = require("../controllers/submissionQueueController");

const router = express.Router();

router.get("/stats", verifyToken, controller.getStats);
router.get("/attempt/:attemptId", verifyToken, controller.getAttemptStatus);

module.exports = router;
