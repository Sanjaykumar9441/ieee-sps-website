require("dotenv").config();
console.log("MONGO_URI from ENV:", process.env.MONGO_URI);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const teamRoutes = require("./routes/teamRoutes");
const adminRoutes = require("./routes/adminRoutes");
const eventRoutes = require("./routes/eventRoutes");
const contactRoutes = require("./routes/contactRoutes");
const Admin = require("./models/admin");
const registrationRoutes = require("./routes/registrationRoutes");
const uploadRoutes = require("./routes/uploadRoutes");


const app = express();


const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/* ===============================
   ✅ CORS (Allow Vercel + Local)
================================= */
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:5173",
  "https://ieeespsaditya.vercel.app"
];

app.use(cors());

app.use(express.json());

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

/* ===============================
   ✅ Routes
================================= */
app.use("/admin", adminRoutes);
app.use("/events", eventRoutes);
app.use("/contact", contactRoutes);
app.use("/team", teamRoutes);
app.use("/api", registrationRoutes);
app.use("/api/upload", uploadRoutes);
/* ===============================
   📂 Serve Uploaded Images
================================= */
app.use("/uploads", express.static("uploads"));

/* ===============================
   ✅ MongoDB Connection
================================= */
async function connectDB() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4
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
        password: hashed
      });

      console.log("✅ Default admin created");
    } else {
      console.log("ℹ️ Admin already exists");
    }

  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
  }
}
const sendMail = require("./utils/mailer");

app.get("/test-mail", async (req, res) => {

  try {

    await sendMail(
      "sanjaykumarchitturi@gmail.com",
      "Arduino Days Test Email",
      "<h2>Nodemailer is working correctly 🚀</h2>"
    );

    res.send("Test email sent successfully");

  } catch (error) {

    console.error(error);
    res.send("Email failed");

  }

});
/* ===============================
   🚀 Start Server
================================= */
const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await ensureAdmin();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});