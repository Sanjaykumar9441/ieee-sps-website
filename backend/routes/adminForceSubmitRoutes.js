const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const controller = require("../controllers/adminForceSubmitController");

/* ============================================
   Force Submit Single Student
============================================ */

router.post("/student/:attemptId", verifyToken, controller.forceSubmit);

/* ============================================
   Disqualify Single Student
============================================ */

router.post(
  "/student/:attemptId/disqualify",
  verifyToken,
  controller.disqualify,
);

/* ============================================
   Force Submit Entire Assessment
============================================ */

router.post("/all/:assessmentId", verifyToken, controller.forceSubmitAll);

module.exports = router;
