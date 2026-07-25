const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const {
  addQuestionsToBank,
  getQuestionsByBank,
  getBanksByQuestion,
  removeQuestionFromBank,
} = require("../controllers/questionBankQuestionController");

/* ===========================
   QUESTION BANK QUESTION ROUTES
=========================== */

router.post("/", verifyToken, addQuestionsToBank);

router.get(
  "/bank/:bankId",
  verifyToken,
  getQuestionsByBank
);

router.get(
  "/question/:questionId",
  verifyToken,
  getBanksByQuestion
);

router.delete(
  "/:id",
  verifyToken,
  removeQuestionFromBank
);

module.exports = router;