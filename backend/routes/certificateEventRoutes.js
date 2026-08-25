const express = require("express");
const router = express.Router();
const controller = require("../controllers/certificateEventController");

router.get("/", controller.listEvents);
router.post("/", controller.createEvent);
router.delete("/:eventCode", controller.deleteEvent);

module.exports = router;
