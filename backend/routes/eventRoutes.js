const express = require("express");
const router = express.Router();
const Event = require("../models/event");
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

  // Remove "Bearer " if present
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // optional but useful
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
      ? req.files.map(file => file.filename)
      : [];

    const newEvent = new Event({
      title,
      description,
      date,
      location,   // ✅ ADD THIS
      status,
      images
    });

    await newEvent.save();

    res.json({ success: true, event: newEvent });

  } catch (err) {
    console.error("ADD EVENT ERROR:", err); // 🔥 ADD THIS
    res.status(500).json({ msg: "Error adding event" });
  }
});


/* ===============================
   ✏️ EDIT EVENT + ADD NEW IMAGES
================================= */

router.put("/:id", verifyToken, upload.array("images", 10), async (req, res) => {
  try {
    if (!verifyToken(req, res)) return;

    const updateData = {
      $set: {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        date: req.body.date
      }
    };

    // ✅ IMPORTANT IMPROVEMENT
    // If new images uploaded → push them to existing images array
    if (req.files && req.files.length > 0) {
      updateData.$push = {
        images: {
          $each: req.files.map(file => file.filename)
        }
      };
    }

    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ msg: "Event not found" });
    }

    res.json(updated);

  } catch (err) {
    res.status(500).json({ msg: "Error updating event" });
  }
});

/* ===============================
   🔄 UPDATE STATUS ONLY
================================= */

router.put("/status/:id", async (req, res) => {
  try {
    if (!verifyToken(req, res)) return;

    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: { status: req.body.status } },
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    res.status(500).json({ msg: "Error updating status" });
  }
});

/* ===============================
   🗑 DELETE EVENT
================================= */

router.delete("/:id", async (req, res) => {
  try {
    if (!verifyToken(req, res)) return;

    const deleted = await Event.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ msg: "Event not found" });
    }

    res.json({ msg: "Event deleted successfully" });

  } catch (err) {
    res.status(500).json({ msg: "Error deleting event" });
  }
});

/* ===============================
   📥 GET ALL EVENTS
================================= */

router.get("/", async (req, res) => {
  const events = await Event.find().sort({ createdAt: -1 });
  res.json(events);
});

/* ===============================
   📥 GET SINGLE EVENT
================================= */

router.get("/:id", async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({ msg: "Event not found" });
  }

  res.json(event);
});

module.exports = router;
