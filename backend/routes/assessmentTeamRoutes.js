const express = require("express");
const router = express.Router();
const controller = require("../controllers/assessmentTeamController");
router.get("/:assessmentId", controller.list);
router.post("/:assessmentId", controller.create);
router.post("/:assessmentId/import", controller.importTeams);
router.delete("/:assessmentId/:teamId", controller.remove);
module.exports = router;
