const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const {
  createQuestionBank,
  getQuestionBanks,
  getQuestionBank,
  updateQuestionBank,
  archiveQuestionBank,
  changeStatus,
} = require("../controllers/questionBankController");

/* ===========================
   QUESTION BANK ROUTES
=========================== */

router.post("/", verifyToken, createQuestionBank);

router.get("/", getQuestionBanks);

router.get("/:id", getQuestionBank);

router.put("/:id", verifyToken, updateQuestionBank);

router.delete("/:id", verifyToken, archiveQuestionBank);

router.patch("/:id/status", verifyToken, changeStatus);

module.exports = router;