const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const {
  createAssessment,
  getAssessments,
  getAssessment,
  updateAssessment,
  archiveAssessment,
  changeStatus,
} = require("../controllers/assessmentController");

/* ===========================
   ASSESSMENT ROUTES
=========================== */

router.post("/", verifyToken, createAssessment);

router.get("/", verifyToken, getAssessments);

router.get("/:id", verifyToken, getAssessment);

router.put("/:id", verifyToken, updateAssessment);

router.delete("/:id", verifyToken, archiveAssessment);

router.patch("/:id/status", verifyToken, changeStatus);

module.exports = router;