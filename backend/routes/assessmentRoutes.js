const express = require("express");

const router = express.Router();

const controller = require("../controllers/assessmentController");

// List
router.get("/", controller.getAssessments);

// Single
router.get("/:id", controller.getAssessment);

// Create
router.post("/", controller.createAssessment);

// Update
router.put("/:id", controller.updateAssessment);

// Delete
router.delete("/:id", controller.deleteAssessment);

router.patch("/:id/restore", controller.restoreAssessment);

router.post("/:id/duplicate", controller.duplicateAssessment);

router.patch("/:id/activate", controller.activateAssessment);

router.patch("/:id/deactivate", controller.deactivateAssessment);

router.patch("/:id/publish", controller.publishAssessment);

router.patch("/:id/unpublish", controller.unpublishAssessment);

router.patch("/:id/archive", controller.archiveAssessment);

router.get("/:id/statistics", controller.statistics);

router.post("/:id/reset", controller.resetAssessment);

router.get("/:id/history", controller.history);

module.exports = router;
