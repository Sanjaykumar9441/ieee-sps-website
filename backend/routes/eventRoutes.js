const express = require("express");
const router = express.Router();
const Event = require("../models/event");
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
    folder: "ieee-sps-events",
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
   ➕ ADD EVENT
================================= */

router.post("/", verifyToken, upload.array("images", 5), async (req, res) => {
  try {
    const { title, description, date, status, location } = req.body;

    const images = req.files
      ? req.files.map(file => file.path) // ✅ Cloudinary URL
      : [];

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      status,
      images
    });

    await newEvent.save();

    res.json({ success: true, event: newEvent });

  } catch (err) {
    console.error("ADD EVENT ERROR:", err);
    res.status(500).json({ msg: "Error adding event" });
  }
});

/* ===============================
   ✏️ UPDATE EVENT
================================= */

router.put("/:id", verifyToken, upload.array("images", 10), async (req, res) => {
  try {

    const updateData = {
      $set: {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        date: req.body.date,
        location: req.body.location
      }
    };

    if (req.files && req.files.length > 0) {
      updateData.$push = {
        images: {
          $each: req.files.map(file => file.path) // ✅ Cloudinary URL
        }
      };
    }

    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ msg: "Error updating event" });
  }
});

/* ===============================
   DELETE
================================= */

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ msg: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting event" });
  }
});

/* ===============================
   GET ALL
================================= */

router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching events" });
  }
});

/* ===============================
   GET SINGLE
================================= */

router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    res.json(event);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching event" });
  }
});

module.exports = router;