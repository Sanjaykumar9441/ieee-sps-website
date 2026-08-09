const express = require("express");

const router = express.Router();

const controller = require("../controllers/questionBankController");

/* ============================================================
QUESTION BANK CRUD
============================================================ */

router.get("/assessment/:assessmentId", controller.list);

router.post("/", controller.create);

router.put("/:id", controller.update);

router.post("/:id/duplicate", controller.duplicate);

router.delete("/:id", controller.delete);

/* ============================================================
QUESTION IMPORT
============================================================ */

router.post("/:bankId/import", controller.importQuestions);

router.post("/:bankId/validate", controller.validateQuestions);

router.post("/:bankId/duplicates", controller.checkDuplicates);

router.post("/:bankId/final-import", controller.finalImport);

module.exports = router;
