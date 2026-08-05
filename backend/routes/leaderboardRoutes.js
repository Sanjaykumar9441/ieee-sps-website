const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const controller = require("../controllers/leaderboardController");

router.get(
    "/:assessmentId",
    verifyToken,
    controller.getLeaderboard
);

module.exports = router;