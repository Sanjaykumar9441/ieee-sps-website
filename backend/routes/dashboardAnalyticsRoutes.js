const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const controller = require("../controllers/dashboardAnalyticsController");

router.get(
  "/:assessmentId",
  verifyToken,
  controller.getDashboardAnalytics
);

module.exports = router;