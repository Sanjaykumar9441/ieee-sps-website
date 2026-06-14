const express = require("express");
const router = express.Router();

const AdminAccess = require("../models/AdminAccess");
const verifyToken = require("../middleware/verifyToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* =========================
   GET ALL ADMINS
========================= */

router.get("/", verifyToken, async (req, res) => {
  try {
    const admins = await AdminAccess.find().populate("memberId");

    res.json(admins);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch admins",
    });
  }
});

/* =========================
   CREATE ADMIN ACCESS
========================= */

router.post("/", verifyToken, async (req, res) => {
  try {
    const { memberId, username, password, permissions } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new AdminAccess({
      memberId,
      username,
      password: hashedPassword,
      permissions,
    });

    await admin.save();

    res.json({
      success: true,
      admin,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to create admin",
    });
  }
});

/* =========================
   UPDATE PERMISSIONS
========================= */

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const updated = await AdminAccess.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      },
    );

    res.json(updated);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to update permissions",
    });
  }
});

/* =========================
   DELETE ADMIN
========================= */

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await AdminAccess.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to delete admin",
    });
  }
});

/* =========================
   ADMIN LOGIN
========================= */

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await AdminAccess.findOne({
      username,
    }).populate("memberId");

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: "admin",
        permissions: admin.permissions,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.json({
      success: true,
      token,
      role: "admin",
      permissions: admin.permissions,
      member: admin.memberId,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

module.exports = router;
