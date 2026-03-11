const SibApiV3Sdk = require("sib-api-v3-sdk");

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendMail = async (to, subject, htmlContent, pdfBuffer, filename) => {
  try {
    const email = {
      sender: {
        name: "Arduino Days 2026",
        email: "ieee.club.aus@gmail.com",
      },

      to: [{ email: to }],

      subject: subject,

      htmlContent: htmlContent,

      // 👇 Plain text fallback (important for Gmail)
      textContent: "Your Arduino Days 2026 registration has been confirmed. Please see the attached event pass.",

      // 👇 Prevent Gmail showing quoted / collapsed message
      headers: {
        "X-Mailer": "ArduinoDaysMailer",
        "Auto-Submitted": "auto-generated",
        "Precedence": "bulk"
      },

      attachment: pdfBuffer
        ? [
            {
              name: filename,
              content: pdfBuffer.toString("base64"),
            },
          ]
        : [],
    };

    await apiInstance.sendTransacEmail(email);

    console.log("✅ Email sent:", to);
  } catch (error) {
    console.error(
      "❌ Brevo Mail error:",
      error.response?.body || error.message
    );

    throw error;
  }
};

module.exports = sendMail;