/**
 * OTP email sender.
 *
 * You already have an emails/ folder in your existing backend — if it
 * exports a reusable transporter or send() function, replace the body of
 * sendOtpEmail below with a call to that instead of creating a second
 * nodemailer transporter. This file is written standalone so it works
 * either way.
 *
 * Required env vars if using this standalone version:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */

const nodemailer = require("nodemailer");

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

async function sendOtpEmail(toEmail, assessmentTitle, otpCode) {
  const t = getTransporter();
  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: `Your OTP for ${assessmentTitle}`,
    text: `Your login code is ${otpCode}. It expires in 5 minutes. Do not share this code with anyone.`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:10px;overflow:hidden">

  <div style="background:#003366;color:#fff;padding:18px;text-align:center">
    <h2 style="margin:0;">IEEE SPS Student Branch Chapter</h2>
    <p style="margin:5px 0 0;">Aditya University</p>
  </div>

  <div style="padding:30px">

    <h3>Hello,</h3>

    <p>Your OTP for <strong>${assessmentTitle}</strong> is</p>

    <div style="
      font-size:34px;
      font-weight:bold;
      letter-spacing:8px;
      text-align:center;
      color:#003366;
      margin:30px 0;
    ">
      ${otpCode}
    </div>

    <p>This OTP is valid for <strong>5 minutes</strong>.</p>

    <p>Please do not share this OTP with anyone.</p>

  </div>

  <div style="
      background:#f5f5f5;
      padding:12px;
      text-align:center;
      font-size:12px;
      color:#666;
  ">

      IEEE SPS Assessment Platform

  </div>

</div>
`,
  });
}

module.exports = { sendOtpEmail };
