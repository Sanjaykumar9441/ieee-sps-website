const express = require("express");
const router = express.Router();
const Contact = require("../models/contact");
const verifyToken = require("../middleware/verifyToken");

/* SEND MESSAGE */
router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    await Contact.create({ name, email, message });
    res.status(201).json({ msg: "Message sent successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

/* GET MESSAGES */
router.get("/", verifyToken, async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching messages" });
  }
});

/* DELETE MESSAGE */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting message" });
  }
});

module.exports = router;