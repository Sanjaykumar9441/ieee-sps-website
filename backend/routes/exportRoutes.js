const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const controller = require("../controllers/exportController");

router.get(
  "/excel/:assessmentId",
  verifyToken,
  controller.exportExcel
);

router.get(
  "/csv/:assessmentId",
  verifyToken,
  controller.exportCSV
);

module.exports = router;