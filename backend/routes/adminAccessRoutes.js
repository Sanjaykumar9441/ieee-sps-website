const express = require("express");
const router = express.Router();

const AdminAccess = require("../models/AdminAccess");
const verifyToken = require("../middleware/verifyToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logActivity = require("../utils/logActivity");
const UAParser = require("ua-parser-js");
const { getIO } = require("../socket");

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

    await logActivity("Super Admin", "Created Admin", username);

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
        returnDocument: "after",
      },
    );

    await logActivity("Super Admin", "Updated Admin Access", updated.username);
    console.log("📤 Emitting adminPermissionsUpdated", {
      adminId: updated._id.toString(),
      permissions: updated.permissions,
    });
    getIO().emit("adminPermissionsUpdated", {
      adminId: updated._id,
      permissions: updated.permissions,
      isPaused: updated.isPaused,
    });

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
    const admin = await AdminAccess.findById(req.params.id);

    await AdminAccess.findByIdAndDelete(req.params.id);

    await logActivity("Super Admin", "Deleted Admin", admin.username);

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

    admin.lastLogin = new Date();

    const parser = new UAParser(req.headers["user-agent"]);

    const browser = parser.getBrowser().name || "Unknown Browser";

    const os = parser.getOS().name || "Unknown OS";

    admin.loginHistory.unshift({
      loginAt: new Date(),
      device: `${browser} • ${os}`,
    });

    admin.loginHistory = admin.loginHistory.slice(0, 10);

    await admin.save();

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
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
      adminId: admin._id,
      role: admin.role,
      permissions: admin.permissions,
      member: admin.memberId,
      mustChangePassword: admin.mustChangePassword,
      isPaused: admin.isPaused,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/* =========================
   CHANGE PASSWORD
========================= */

router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await AdminAccess.findById(req.user.id);

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password incorrect",
      });
    }

    admin.password = await bcrypt.hash(newPassword, 10);

    admin.mustChangePassword = false;

    admin.lastPasswordChange = new Date();

    await admin.save();

    await logActivity(admin.username, "Changed Password", admin.username);

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});

/* =========================
   RESET PASSWORD
========================= */

router.post("/reset-password/:id", verifyToken, async (req, res) => {
  try {
    const admin = await AdminAccess.findById(req.params.id).populate(
      "memberId",
    );

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    let defaultPassword = "";

    if (admin.isExternal === false && admin.memberId) {
      defaultPassword = admin.memberId.rollNumber;
    } else {
      defaultPassword = "ChangeMe123";
    }

    admin.password = await bcrypt.hash(defaultPassword, 10);

    admin.mustChangePassword = true;

    admin.lastPasswordChange = null;

    await admin.save();

    await logActivity("Super Admin", "Reset Password", admin.username);

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to reset password",
    });
  }
});

router.put("/toggle-status/:id", verifyToken, async (req, res) => {
  try {
    const admin = await AdminAccess.findById(req.params.id);

    const { reason } = req.body;

    admin.isPaused = !admin.isPaused;

    if (admin.isPaused) {
      admin.pauseReason = reason || "Temporary Committee Restriction";
    } else {
      admin.pauseReason = "";
    }

    await admin.save();
    console.log("📤 Emitting adminPermissionsUpdated", {
      adminId: updated._id.toString(),
      permissions: updated.permissions,
    });
    getIO().emit("adminPermissionsUpdated", {
      adminId: admin._id,
      permissions: admin.permissions,
      isPaused: admin.isPaused,
    });

    await logActivity(
      "Super Admin",
      admin.isPaused ? "Paused Admin" : "Resumed Admin",
      admin.isPaused
        ? `${admin.username} (${admin.pauseReason})`
        : admin.username,
    );

    res.json({
      success: true,
      isPaused: admin.isPaused,
      pauseReason: admin.pauseReason,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed",
    });
  }
});

/* =========================
   MY PROFILE
========================= */

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const admin = await AdminAccess.findById(req.user.id).populate("memberId");

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    res.json(admin);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
});

router.get("/permissions", verifyToken, async (req, res) => {
  try {
    const admin = await AdminAccess.findById(req.user.id);

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    res.json(admin.permissions);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});

router.delete("/:id/login-history", verifyToken, async (req, res) => {
  try {
    await Admin.findByIdAndUpdate(req.params.id, {
      loginHistory: [],
      lastLogin: null,
    });

    res.json({ msg: "Login history deleted." });
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
});

router.delete("/:id/login-history", verifyToken, async (req, res) => {
  try {
    await AdminAccess.findByIdAndUpdate(req.params.id, {
      loginHistory: [],
      lastLogin: null,
    });

    res.json({
      msg: "Login history deleted.",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Server Error",
    });
  }
});

router.delete("/clear-all", verifyToken, async (req, res) => {
  try {
    await AdminAccess.updateMany(
      {},
      {
        $set: {
          loginHistory: [],
          lastLogin: null,
        },
      },
    );

    res.json({
      msg: "All login history deleted.",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Server Error",
    });
  }
});

module.exports = router;
