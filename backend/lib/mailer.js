/**
 * Brevo Transactional Email Sender
 */

const { BrevoClient } = require("@getbrevo/brevo");

let brevoClient = null;

function getBrevoClient() {
  if (brevoClient) {
    return brevoClient;
  }

  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  brevoClient = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
  });

  return brevoClient;
}

async function sendOtpEmail(toEmail, assessmentTitle, otpCode) {
  const client = getBrevoClient();

  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName =
    process.env.BREVO_SENDER_NAME || "IEEE SPS Student Branch Chapter";

  if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL is not configured");
  }

  const subject = `Your OTP for ${assessmentTitle}`;

  const textContent = `
Your login code for ${assessmentTitle} is ${otpCode}.

This OTP is valid for 5 minutes.

Please do not share this OTP with anyone.

IEEE SPS Student Branch Chapter
Aditya University
  `.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f4f7fa;
  font-family:Arial,Helvetica,sans-serif;
">

  <div style="
    max-width:600px;
    margin:40px auto;
    background:#ffffff;
    border:1px solid #e2e8f0;
    border-radius:12px;
    overflow:hidden;
  ">

    <div style="
      background:#003366;
      color:#ffffff;
      padding:24px;
      text-align:center;
    ">
      <h2 style="margin:0;">
        IEEE SPS Student Branch Chapter
      </h2>

      <p style="
        margin:8px 0 0;
        opacity:0.9;
      ">
        Aditya University
      </p>
    </div>

    <div style="padding:32px;">

      <h3 style="
        margin-top:0;
        color:#1e293b;
      ">
        Student Examination Portal
      </h3>

      <p style="color:#475569;">
        Your verification code for
        <strong>${assessmentTitle}</strong>
        is:
      </p>

      <div style="
        margin:30px 0;
        padding:20px;
        background:#f1f5f9;
        border-radius:10px;
        text-align:center;
      ">

        <span style="
          font-size:36px;
          font-weight:bold;
          letter-spacing:8px;
          color:#003366;
        ">
          ${otpCode}
        </span>

      </div>

      <p style="color:#475569;">
        This OTP is valid for
        <strong>5 minutes</strong>.
      </p>

      <p style="color:#64748b;">
        Please do not share this OTP with anyone.
      </p>

    </div>

    <div style="
      background:#f8fafc;
      padding:16px;
      text-align:center;
      font-size:12px;
      color:#64748b;
    ">
      IEEE SPS Assessment Platform
    </div>

  </div>

</body>
</html>
  `.trim();

  const response = await client.transactionalEmails.sendTransacEmail({
    sender: {
      email: senderEmail,
      name: senderName,
    },

    to: [
      {
        email: toEmail,
      },
    ],

    subject,

    textContent,

    htmlContent,
  });

  console.log(
    `[BREVO] OTP email sent to ${toEmail}`,
    response?.messageId || "",
  );

  return response;
}

module.exports = {
  sendOtpEmail,
};
