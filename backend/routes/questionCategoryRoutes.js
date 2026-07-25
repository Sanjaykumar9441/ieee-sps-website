const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  archiveCategory,
  changeStatus,
} = require("../controllers/questionCategoryController");

/* ===========================
   CATEGORY ROUTES
=========================== */

router.post("/", verifyToken, createCategory);

router.get("/", getCategories);

router.get("/:id", getCategory);

router.put("/:id", verifyToken, updateCategory);

router.patch("/:id/status", verifyToken, changeStatus);

router.patch("/:id/archive", verifyToken, archiveCategory);

module.exports = router;