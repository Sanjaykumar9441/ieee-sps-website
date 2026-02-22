const express = require("express");
const router = express.Router();
const Team = require("../models/team");
const jwt = require("jsonwebtoken");

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

/* ===============================
   ☁️ Cloudinary Storage
================================= */

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ieee-sps-team",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
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
   ADD MEMBER
================================= */

router.post("/", verifyToken, upload.single("photo"), async (req, res) => {
  try {

    const newMember = new Team({
      ...req.body,
      photo: req.file ? req.file.path : null // ✅ Cloudinary URL
    });

    await newMember.save();

    res.json(newMember);

  } catch (err) {
    console.error("ADD MEMBER ERROR:", err);
    res.status(500).json({ msg: "Error adding member" });
  }
});

/* ===============================
   UPDATE MEMBER
================================= */

router.put("/:id", verifyToken, upload.single("photo"), async (req, res) => {
  try {

    const updateData = { ...req.body };

    if (req.file) {
      updateData.photo = req.file.path; // ✅ Cloudinary URL
    }

    const updated = await Team.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    console.error("UPDATE MEMBER ERROR:", err);
    res.status(500).json({ msg: "Error updating member" });
  }
});

/* ===============================
   DELETE MEMBER
================================= */

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    res.json({ msg: "Member deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting member" });
  }
});

/* ===============================
   GET ALL
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
   GET SINGLE
================================= */

router.get("/:id", async (req, res) => {
  try {
    const member = await Team.findById(req.params.id);
    res.json(member);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching member" });
  }
});

module.exports = router;