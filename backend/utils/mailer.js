const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
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

    console.log("Email sent to:", to);

  } catch (error) {

    console.error("Mail error:", error);

  }

};

module.exports = sendMail;