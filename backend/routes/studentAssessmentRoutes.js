const express = require("express");

const router = express.Router();

const controller = require("../controllers/studentAssessmentController");
const verifyStudentToken = require("../middleware/verifyStudentToken");

router.get("/:assessmentId", controller.checkAssessment);

router.post(
  "/:assessmentId/start",
  verifyStudentToken,
  controller.startAssessment,
);

router.post(
  "/:attemptId/save-answer",
  verifyStudentToken,
  controller.saveAnswer,
);

router.get(
  "/:attemptId/question/:number",
  verifyStudentToken,
  controller.getQuestion,
);

router.get("/:attemptId/palette", verifyStudentToken, controller.getPalette);

router.get("/:attemptId/status", verifyStudentToken, controller.getStatus);

router.post(
  "/:attemptId/submit",
  verifyStudentToken,
  controller.submitAssessment,
);

/* ==========================================================
   ANTI CHEAT
========================================================== */

router.post(
  "/:attemptId/infractions",
  verifyStudentToken,
  controller.reportInfraction,
);

router.get(
  "/:attemptId/infractions",
  verifyStudentToken,
  controller.getInfractions,
);

router.delete(
  "/:attemptId/infractions",
  verifyStudentToken,
  controller.resetInfractions,
);

router.get(
  "/anti-cheat/config",
  verifyStudentToken,
  controller.getAntiCheatConfig,
);

module.exports = router;
