const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  archiveQuestion,
  changeStatus,
} = require("../controllers/questionController");

/* ===========================
   QUESTION ROUTES
=========================== */

router.post("/", verifyToken, createQuestion);

router.get("/", getQuestions);

router.get("/:id", getQuestion);

router.put("/:id", verifyToken, updateQuestion);

router.delete("/:id", verifyToken, archiveQuestion);

router.patch("/:id/status", verifyToken, changeStatus);

module.exports = router;