const express = require("express");
const router = express.Router();
const Team = require("../models/team");
const multer = require("multer");
const jwt = require("jsonwebtoken");

/* ===============================
   📸 Upload Setup
================================= */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* ===============================
   🔐 Auth Middleware
================================= */

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ msg: "No token provided" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
};

/* ===============================
   ➕ ADD MEMBER (Protected)
================================= */

router.post("/", verifyToken, upload.single("photo"), async (req, res) => {
  try {

    const newMember = new Team({
      ...req.body,
      photo: req.file ? req.file.filename : null
    });

    await newMember.save();

    res.json({ success: true, member: newMember });

  } catch (err) {
    console.error("ADD MEMBER ERROR:", err);
    res.status(500).json({ msg: "Error adding member" });
  }
});

/* ===============================
   ✏️ EDIT MEMBER (Protected)
================================= */

router.put("/:id", verifyToken, upload.single("photo"), async (req, res) => {
  try {

    const updateData = { ...req.body };

    if (req.file) {
      updateData.photo = req.file.filename;
    }

    const updated = await Team.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ msg: "Member not found" });
    }

    res.json(updated);

  } catch (err) {
    console.error("EDIT MEMBER ERROR:", err);
    res.status(500).json({ msg: "Error updating member" });
  }
});

/* ===============================
   🗑 DELETE MEMBER (Protected)
================================= */

router.delete("/:id", verifyToken, async (req, res) => {
  try {

    const deleted = await Team.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ msg: "Member not found" });
    }

    res.json({ msg: "Member deleted successfully" });

  } catch (err) {
    console.error("DELETE MEMBER ERROR:", err);
    res.status(500).json({ msg: "Error deleting member" });
  }
});

/* ===============================
   📥 GET ALL MEMBERS (Public)
================================= */

router.get("/", async (req, res) => {
  try {
    const members = await Team.find().sort({ priority: 1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching members" });
  }
});

/* ===============================
   📥 GET SINGLE MEMBER (Public)
================================= */

router.get("/:id", async (req, res) => {
  try {
    const member = await Team.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ msg: "Member not found" });
    }

    res.json(member);

  } catch (err) {
    res.status(500).json({ msg: "Error fetching member" });
  }
});

module.exports = router;