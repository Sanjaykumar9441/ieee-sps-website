require("dotenv").config();
console.log("MONGO_URI from ENV:", process.env.MONGO_URI);

const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const teamRoutes = require("./routes/teamRoutes");
const adminRoutes = require("./routes/adminRoutes");
const eventRoutes = require("./routes/eventRoutes");
const contactRoutes = require("./routes/contactRoutes");
const Admin = require("./models/admin");

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
  "https://ieee-sps-website-seven.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error("Not allowed by CORS"), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

/* ===============================
   ✅ ROOT ROUTE
================================= */
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
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

/* ===============================
   ✅ Message Schema
================================= */
const messageSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    message: String,
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

/* ===============================
   📩 CONTACT FORM ROUTE
================================= */
app.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ msg: "All fields required" });
    }

    await Message.create({ name, email, message });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"IEEE SPS Website" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `New Contact Message from ${name}`,
        html: `
          <h3>New Message</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong> ${message}</p>
        `,
      });
    }

    res.json({ msg: "Message saved successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

/* ===============================
   🔐 GET MESSAGES (ADMIN)
================================= */
app.get("/messages", async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ msg: "No token" });
    }

    jwt.verify(token, process.env.JWT_SECRET);

    const messages = await Message.find().sort({ createdAt: -1 });

    res.json(messages);

  } catch (error) {
    res.status(401).json({ msg: "Invalid token" });
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