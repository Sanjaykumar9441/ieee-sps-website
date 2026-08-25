const express = require("express");
const router = express.Router();
const controller = require("../controllers/certificateMemberController");

router.get("/", controller.listMembers);
router.post("/member", controller.addMember);
router.put("/member/:id", controller.editMember);
router.delete("/member/:id", controller.deleteMember);
router.post("/members/delete", controller.deleteMembers);

module.exports = router;
