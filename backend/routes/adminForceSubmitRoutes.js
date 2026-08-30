const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const controller = require("../controllers/adminForceSubmitController");

router.post("/:attemptId", verifyToken, controller.forceSubmit);
router.post("/assessment/:assessmentId", verifyToken, controller.forceSubmitAll);
router.post("/:attemptId/disqualify", verifyToken, controller.disqualify);

module.exports = router;
