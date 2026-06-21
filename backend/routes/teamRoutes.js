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

    // Get highest existing priority
    const lastMember = await Team.findOne().sort({ priority: -1 });

    const nextPriority = lastMember
      ? lastMember.priority + 1
      : 1;

    const newMember = new Team({
      ...req.body,

      // Use provided priority or next available
      priority: req.body.priority
        ? Number(req.body.priority)
        : nextPriority,

      photo: req.file ? req.file.path : null,
    });

    const newPriority = Number(newMember.priority);

    // Shift existing members if inserting in between
    await Team.updateMany(
      {
        priority: { $gte: newPriority },
      },
      {
        $inc: { priority: 1 },
      }
    );

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
    const member = await Team.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ msg: "Member not found" });
    }

    const oldPriority = Number(member.priority);
    const newPriority = Number(req.body.priority);

    if (oldPriority !== newPriority) {

      if (newPriority < oldPriority) {

        await Team.updateMany(
          {
            _id: { $ne: member._id },
            priority: {
              $gte: newPriority,
              $lt: oldPriority
            }
          },
          {
            $inc: { priority: 1 }
          }
        );

      } else {

        await Team.updateMany(
          {
            _id: { $ne: member._id },
            priority: {
              $gt: oldPriority,
              $lte: newPriority
            }
          },
          {
            $inc: { priority: -1 }
          }
        );
      }
    }

    const updateData = {
      ...req.body,
      priority: newPriority
    };

    if (req.file) {
      updateData.photo = req.file.path;
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