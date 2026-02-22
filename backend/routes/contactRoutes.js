const express = require("express");
const router = express.Router();
const Contact = require("../models/contact");

/* ================= SEND MESSAGE ================= */

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const newMessage = new Contact({
      name,
      email,
      message,
    });

    await newMessage.save();

    res.status(201).json({ msg: "Message sent successfully" });

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

/* ================= GET ALL MESSAGES (ADMIN) ================= */

router.get("/", async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching messages" });
  }
});

/* ================= MARK AS READ ================= */

router.put("/:id", async (req, res) => {
  try {
    const updated = await Contact.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: "Error updating message" });
  }
});

module.exports = router;