const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const controller = require("../controllers/exportController");
const router = express.Router();
router.get("/:assessmentId", verifyToken, controller.download);
module.exports = router;
