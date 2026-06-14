const express = require("express");
const router = express.Router();

const AdminAccess = require("../models/AdminAccess");
const verifyToken = require("../middleware/verifyToken");

/* =========================
   GET ALL ADMINS
========================= */

router.get("/", verifyToken, async (req, res) => {
  try {
    const admins = await AdminAccess.find()
      .populate("memberId");

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
    const admin = new AdminAccess(req.body);

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

module.exports = router;