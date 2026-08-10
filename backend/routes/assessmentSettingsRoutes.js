const express = require("express");

const router = express.Router();

const controller = require("../controllers/assessmentSettingsController");

router.get("/:id", controller.getSettings);

router.put("/:id", controller.updateSettings);

module.exports = router;
