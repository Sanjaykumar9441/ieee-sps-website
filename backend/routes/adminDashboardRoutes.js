const express = require("express");

const router = express.Router();

const controller = require("../controllers/adminDashboardController");

const verifyToken = require("../middleware/verifyToken");

router.get(
  "/:assessmentId",

  verifyToken,

  controller.getLiveDashboard,
);

module.exports = router;
