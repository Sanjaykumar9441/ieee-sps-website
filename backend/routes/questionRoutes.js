const express = require("express");
const router = express.Router();

const questionController = require("../controllers/questionController");

// ============================================================
// LIST / SEARCH
// ============================================================

router.get("/bank/:questionBankId", questionController.list);

router.get("/bank/:questionBankId/search", questionController.search);

// ============================================================
// IMPORT
// ============================================================

router.post("/bank/:bankId/import", questionController.importQuestions);

router.post(
  "/bank/:bankId/check-duplicates",
  questionController.checkDuplicates,
);

router.post("/bank/:bankId/validate", questionController.validateQuestions);

router.post("/bank/:bankId/final-import", questionController.finalImport);

// ============================================================
// SINGLE QUESTION
// ============================================================

router.get("/:id", questionController.get);

router.post("/", questionController.create);

router.put("/:id", questionController.update);

router.delete("/:id", questionController.delete);

router.post("/:id/duplicate", questionController.duplicate);

module.exports = router;
