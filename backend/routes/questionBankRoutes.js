const express = require("express");

const router = express.Router();

const controller = require("../controllers/questionBankController");

router.get("/assessment/:assessmentId", controller.list);

router.post("/", controller.create);

router.put("/:id", controller.update);

router.delete("/:id", controller.delete);

module.exports = router;
