const express = require("express");
const router = express.Router();
const Team = require("../models/team");
const multer = require("multer");
const jwt = require("jsonwebtoken");

/* Upload Setup */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* ADD MEMBER */
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ msg: "No token" });

    jwt.verify(token, process.env.JWT_SECRET);

    const newMember = new Team({
      ...req.body,
      photo: req.file ? req.file.filename : null
    });

    await newMember.save();
    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ msg: "Error adding member" });
  }
});

/* EDIT MEMBER */
router.put("/:id", upload.single("photo"), async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ msg: "No token" });

    jwt.verify(token, process.env.JWT_SECRET);

    const updateData = { ...req.body };

    if (req.file) {
      updateData.photo = req.file.filename;
    }

    const updated = await Team.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    res.status(401).json({ msg: "Unauthorized" });
  }
});

/* DELETE MEMBER */
router.delete("/:id", async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ msg: "No token" });

    jwt.verify(token, process.env.JWT_SECRET);

    await Team.findByIdAndDelete(req.params.id);
    res.json({ msg: "Member deleted" });

  } catch (err) {
    res.status(401).json({ msg: "Unauthorized" });
  }
});

/* GET ALL MEMBERS (Hierarchy Order) */
router.get("/", async (req, res) => {
  const members = await Team.find().sort({ priority: 1 });
  res.json(members);
});

/* GET SINGLE MEMBER */
router.get("/:id", async (req, res) => {
  const member = await Team.findById(req.params.id);
  res.json(member);
});

module.exports = router;
