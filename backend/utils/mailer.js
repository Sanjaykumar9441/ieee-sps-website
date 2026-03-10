const SibApiV3Sdk = require("sib-api-v3-sdk");

const client = SibApiV3Sdk.ApiClient.instance;

client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendMail = async (to, subject, html, pdfBuffer, filename, qrCodeImage) => {

  try {

    const attachments = [];

    // PDF attachment
    if (pdfBuffer) {
      attachments.push({
        name: filename,
        content: pdfBuffer.toString("base64")
      });
    }

    // QR image for email preview
    if (qrCodeImage) {
      attachments.push({
        name: "qr.png",
        content: qrCodeImage.split("base64,")[1],
        cid: "qrimage"
      });
    }

    const email = {
      sender: {
        name: "Arduino Days 2026",
        email: "ieee.club.aus@gmail.com"
      },

      to: [{ email: to }],

      subject: subject,

      htmlContent: html,

      attachment: attachments
    };

    await apiInstance.sendTransacEmail(email);

    console.log("✅ Email sent:", to);

  } catch (error) {

    console.error("❌ Brevo Mail error:", error.response?.body || error.message);

    throw error;

  }

};

module.exports = sendMail;