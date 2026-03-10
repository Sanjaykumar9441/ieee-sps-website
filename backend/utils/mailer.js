const SibApiV3Sdk = require("sib-api-v3-sdk");

const client = SibApiV3Sdk.ApiClient.instance;

client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendMail = async (to, subject, htmlContent) => {

  try {

    const email = {
      sender: {
        name: "Arduino Days 2026",
        email: "ieee.club.aus@gmail.com"
      },

      to: [{ email: to }],

      subject: subject,

      htmlContent: htmlContent

    };

    await apiInstance.sendTransacEmail(email);

    console.log("✅ Email sent:", to);

  } catch (error) {

    console.error("❌ Brevo Mail error:", error.response?.body || error.message);

    throw error;

  }

};

module.exports = sendMail;