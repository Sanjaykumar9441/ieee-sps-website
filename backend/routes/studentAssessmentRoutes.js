const express = require("express");

const router = express.Router();

const controller = require("../controllers/studentAssessmentController");
const verifyStudentToken = require("../middleware/verifyStudentToken");
const verifyAssessmentSession = require("../middleware/verifyAssessmentSession");

router.get("/:assessmentId/check", controller.checkAssessment);
router.post(
  "/:assessmentId/start",
  verifyStudentToken,
  controller.startAssessment,
);
router.post(
  "/:attemptId/save-answer",
  verifyStudentToken,
  verifyAssessmentSession,
  controller.saveAnswer,
);
router.get(
  "/:attemptId/paper",
  verifyStudentToken,
  verifyAssessmentSession,
  controller.getPaper,
);
router.get(
  "/:attemptId/question/:number",
  verifyStudentToken,
  verifyAssessmentSession,
  controller.getQuestion,
);
router.get(
  "/:attemptId/palette",
  verifyStudentToken,
  verifyAssessmentSession,
  controller.getPalette,
);
router.get(
  "/:attemptId/status",
  verifyStudentToken,
  verifyAssessmentSession,
  controller.getStatus,
);
router.post(
  "/:attemptId/submit",
  verifyStudentToken,
  verifyAssessmentSession,
  controller.submitAssessment,
);
router.get(
  "/:attemptId/submission-status",
  verifyStudentToken,
  verifyAssessmentSession,
  controller.getSubmissionQueueStatus,
);
router.post(
  "/:attemptId/heartbeat",
  verifyStudentToken,
  verifyAssessmentSession,
  controller.heartbeat,
);
router.get(
  "/anti-cheat/config",
  verifyStudentToken,
  controller.getAntiCheatConfig,
);
router.post(
  "/:attemptId/infractions",
  verifyStudentToken,
  verifyAssessmentSession,
  controller.reportInfraction,
);
router.get(
  "/:attemptId/infractions",
  verifyStudentToken,
  verifyAssessmentSession,
  controller.getInfractions,
);
router.delete(
  "/:attemptId/infractions",
  verifyStudentToken,
  verifyAssessmentSession,
  controller.resetInfractions,
);

module.exports = router;
