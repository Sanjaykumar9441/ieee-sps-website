const express = require("express");
const router = express.Router();

const questionBankController = require("../controllers/questionBankController");
const questionController = require("../controllers/questionController");

router.get("/assessment/:assessmentId", questionBankController.list);
router.post("/", questionBankController.create);
router.put("/:id", questionBankController.update);
router.post("/:id/duplicate", questionBankController.duplicate);
router.delete("/:id", questionBankController.delete);

// Backward-compatible create-question endpoint used by older QuestionEditor builds.
router.post("/:bankId/questions", questionController.create);

module.exports = router;
