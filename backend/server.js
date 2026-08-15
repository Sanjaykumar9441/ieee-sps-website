require("dotenv").config();
console.log("MONGO_URI from ENV:", process.env.MONGO_URI);

const http = require("http");
const { Server } = require("socket.io");
const { initSocket } = require("./socket");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const EventSettings = require("./models/EventSettings");
const teamRoutes = require("./routes/teamRoutes");
const adminRoutes = require("./routes/adminRoutes");
const eventRoutes = require("./routes/eventRoutes");
const contactRoutes = require("./routes/contactRoutes");
const Admin = require("./models/admin");
const arduinoRegistrationRoutes = require("./routes/arduinoRegistrationRoutes");
const membershipRoutes = require("./routes/membershipRoutes");
const spaceDayRegistrationRoutes = require("./routes/spaceDayRegistrationRoutes");
const spaceDayAdminRoutes = require("./routes/spaceDayAdminRoutes");
const telegramRoutes = require("./routes/telegramRoutes");
const spaceDayExportRoutes = require("./routes/spaceDayExportRoutes");
const eventSettingsRoutes = require("./routes/eventSettingsRoutes");
const adminAccessRoutes = require("./routes/adminAccessRoutes");
const compression = require("compression");
const axios = require("axios");
const verifyToken = require("./middleware/verifyToken");
const app = express();
const server = http.createServer(app);
app.set("trust proxy", 1);

const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "uploads");
const galleryRoutes = require("./routes/galleryRoutes");

const spsApplicationRoutes = require("./routes/spsApplicationRoutes");

const activityRoutes = require("./routes/activityRoutes");

/* ===============================*/
const assessmentRoutes = require("./routes/assessmentRoutes");
const assessmentSettingsRoutes = require("./routes/assessmentSettingsRoutes");
const questionBankRoutes = require("./routes/questionBankRoutes");
const questionRoutes = require("./routes/questionRoutes");
const studentAssessmentRoutes = require("./routes/studentAssessmentRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const liveMonitorRoutes = require("./routes/liveMonitorRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const adminForceSubmitRoutes = require("./routes/adminForceSubmitRoutes");
const dashboardAnalyticsRoutes = require("./routes/dashboardAnalyticsRoutes");
const exportRoutes = require("./routes/exportRoutes");
const studentAuthRoutes = require("./routes/studentAuthRoutes");
const emailworker = require("../backend/services/emailWorker");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
/* ===============================
   ✅ CORS (Allow Vercel + Local)
================================= */
app.use(
  cors({
    origin: ["http://localhost:5173", "https://ieeespsaditya.vercel.app"],
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
/* ===============================
   ✅ ROOT ROUTE
================================= */
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

/* ===============================
   ❤️ HEALTH CHECK ROUTE
================================= */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Server Running" });
});

app.get("/test-events", (req, res) => {
  res.json({ message: "Events route working" });
});

app.get("/ping", (req, res) => {
  res.send("pong");
});

/* ===============================
   ✅ Routes
================================= */
app.use("/admin", adminRoutes);
app.use("/events", eventRoutes);
app.use("/contact", contactRoutes);
app.use("/team", teamRoutes);
app.use("/api/activity-logs", activityRoutes);
app.use("/api", arduinoRegistrationRoutes);
app.use("/api/membership", membershipRoutes);
app.use("/api/space-day", spaceDayRegistrationRoutes);
app.use("/api/space-day/admin", spaceDayAdminRoutes);
app.use("/api/telegram", telegramRoutes);
app.use("/api/space-day/export", spaceDayExportRoutes);
app.use("/api/space-day/settings", eventSettingsRoutes);
app.use("/api/admin-access", adminAccessRoutes);
app.use("/api", galleryRoutes);
app.use("/api/sps-applications", spsApplicationRoutes);
app.use("/uploads", express.static("uploads"));

/* ===============================
   🧠 Assessment Routes
================================= */
app.use("/api/assessments", assessmentRoutes);
app.use("/api/assessment-settings", assessmentSettingsRoutes);
app.use("/api/question-banks", questionBankRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/student-assessments", studentAssessmentRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/live-monitor", liveMonitorRoutes);
app.use("/api/admin/leaderboard", leaderboardRoutes);
app.use("/api/admin/force-submit", adminForceSubmitRoutes);
app.use("/api/admin/dashboard-analytics", dashboardAnalyticsRoutes);
app.use("/api/admin/export", exportRoutes);
app.use("/api/student-auth", studentAuthRoutes);

/* ===============================
   ✅ MongoDB Connection
================================= */
async function connectDB() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
}

/* ===============================
   🔐 AUTO CREATE DEFAULT ADMIN
================================= */
async function ensureAdmin() {
  try {
    const existing = await Admin.findOne({ email: "admin@ieee.com" });

    if (!existing) {
      const hashed = await bcrypt.hash("admin123", 10);

      await Admin.create({
        email: "admin@ieee.com",
        password: hashed,
      });

      console.log("✅ Default admin created");
    } else {
      console.log("ℹ️ Admin already exists");
    }
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
  }
}

/* ===============================
   🚀 AUTO CREATE EVENT SETTINGS
================================= */

async function ensureEventSettings() {
  try {
    const existing = await EventSettings.findOne({
      event: "space-day",
    });

    if (!existing) {
      await EventSettings.create({
        event: "space-day",

        enabled: true,

        events: {
          astroquiz: true,
          astrodesign: true,
          astromodeler: true,
        },
      });
    } else {
      console.log("ℹ️ Space Day settings already exist");
    }
  } catch (err) {
    console.error("❌ Error creating Event Settings:", err.message);
  }
}
/* ===============================
   🚀 Start Server
================================= */
const PORT = process.env.PORT;

console.log("🚀 Starting server...");

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://ieeespsaditya.vercel.app"],
    credentials: true,
  },
});

initSocket(io);

io.on("connection", (socket) => {
  socket.on("disconnect", () => {});
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ RUN OTHER TASKS IN BACKGROUND
(async () => {
  try {
    await connectDB();
    console.log("✅ DB Connected");

    await ensureAdmin();
    console.log("✅ Admin ensured");

    await ensureEventSettings();
    console.log("✅ Event settings ensured");

    // ❗ TEMP DISABLE THIS
    // await setTelegramCommands();
  } catch (err) {
    console.error("❌ Background error:", err);
  }
})();
