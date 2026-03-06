const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,           // ✅ use 587 instead of 465
  secure: false,       // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendMail = async (to, subject, html) => {
  try {

    await transporter.sendMail({
      from: `"Arduino Days 2026" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    console.log("✅ Email sent:", to);

  } catch (error) {

    console.error("Mail error:", error);

  }
};

module.exports = sendMail;