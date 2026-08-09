const express = require("express");
const router = express.Router();

const questionController = require("../controllers/questionController");

// List all questions in a Question Bank
router.get("/bank/:questionBankId", questionController.list);

// Search questions
router.get("/bank/:questionBankId/search", questionController.search);

// Get one question
router.get("/:id", questionController.get);

// Create question
router.post("/", questionController.create);

// Update question
router.put("/:id", questionController.update);

// Delete question
router.delete("/:id", questionController.delete);

// Duplicate question
router.post("/:id/duplicate", questionController.duplicate);

module.exports = router;
