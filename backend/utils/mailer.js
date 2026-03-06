const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),   // convert env string to number
  secure: false,                          // use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },

  // These help on cloud servers like Render
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
  tls: {
    rejectUnauthorized: false
  }
});

const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Arduino Days 2026" <ieee.club.aus@gmail.com>`,
      to,
      subject,
      html
    });

    console.log("✅ Email sent:", to);

  } catch (error) {
    console.error("❌ Mail error:", error);
    throw error;
  }
};

module.exports = sendMail;