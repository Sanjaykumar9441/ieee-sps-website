require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await Admin.create({
      email: "admin@ieee.com",
      password: hashedPassword
    });

    console.log("✅ Admin Created Successfully");

    process.exit();

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

createAdmin();
