const SibApiV3Sdk = require("sib-api-v3-sdk");

const client = SibApiV3Sdk.ApiClient.instance;

const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendMail = async (to, subject, html) => {

  try {

    const email = {
      sender: {
        name: "Arduino Days 2026",
        email: "ieee.club.aus@gmail.com"
      },
      to: [
        { email: to }
      ],
      subject: subject,
      htmlContent: html
    };

    await apiInstance.sendTransacEmail(email);

    console.log("✅ Email sent:", to);

  } catch (error) {

    console.error("❌ Mail error:", error);

  }

};

module.exports = sendMail;