const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendMail = async (to, subject, html) => {

  try {

    await transporter.sendMail({
      from: '"Arduino Days 2026" <ieee.club.aus@gmail.com>',
      to,
      subject,
      html
    });

    console.log("Email sent:", to);

  } catch (error) {

    console.error("Mail error:", error);

  }

};

module.exports = sendMail;