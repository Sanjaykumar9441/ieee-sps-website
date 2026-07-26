const SibApiV3Sdk = require("sib-api-v3-sdk");

const {
  renderVerificationEmail,
} = require("./renderEmail");

/* ==========================================
   BREVO CONFIGURATION
========================================== */

const client = SibApiV3Sdk.ApiClient.instance;

client.authentications["api-key"].apiKey =
  process.env.BREVO_API_KEY;

const api = new SibApiV3Sdk.TransactionalEmailsApi();

/* ==========================================
   SEND VERIFICATION EMAIL
========================================== */

const sendVerificationEmail = async (
  registration,
  pdfBuffer,
) => {
  const member = registration.members[0];

  const html = renderVerificationEmail(
    registration,
  );

  const subject = `National Space Day 2026 | Registration Verified | ${registration.registrationId}`;

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

    subject,

    htmlContent: html,

    attachment: [
      {
        name: `${registration.registrationId}_Acknowledgement.pdf`,
        content: pdfBuffer.toString("base64"),
      },
    ],
  });
};

/* ==========================================
   EXPORT
========================================== */

module.exports = {
  sendVerificationEmail,
};