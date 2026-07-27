const SibApiV3Sdk = require("sib-api-v3-sdk");

const { renderVerificationEmail } = require("./renderEmail");

const client = SibApiV3Sdk.ApiClient.instance;

client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const api = new SibApiV3Sdk.TransactionalEmailsApi();

const sendVerificationEmail = async (registration, pdfBuffer) => {
  const member = registration.members[0];

  const html = await renderVerificationEmail(registration);

  try {
    await api.sendTransacEmail({
      sender: {
        name: "IEEE SPS Student Branch Chapter",
        email: process.env.BREVO_SENDER_EMAIL,
      },

      to: [
        {
          email: member.email,
          name: member.fullName,
        },
      ],

      subject: `National Space Day 2026 | Registration Verified | ${registration.registrationId}`,

      htmlContent: html,

      attachment: [
        {
          name: `National_Space_Day_2026_Verified_Acknowledgement_${registration.registrationId}.pdf`,
          content: pdfBuffer.toString("base64"),
        },
      ],
    });

    console.log(`Verification email sent successfully to ${member.email}`);
  } catch (error) {
    console.error(
      "Brevo Error:",
      error.response?.body || error.message || error,
    );

    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
};
