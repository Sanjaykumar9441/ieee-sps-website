const SibApiV3Sdk = require("sib-api-v3-sdk");

const { renderVerificationEmail } = require("./renderEmail");

const client = SibApiV3Sdk.ApiClient.instance;

client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const api = new SibApiV3Sdk.TransactionalEmailsApi();

const sendVerificationEmail = async (registration, pdfBuffer) => {
  const leader = registration.members[0];

  // Only include members who actually have an email
  const ccMembers = registration.members
    .slice(1)
    .filter((member) => member.email)
    .map((member) => ({
      email: member.email,
      name: member.fullName,
    }));

  const html = await renderVerificationEmail(registration);

  try {
    const emailData = {
      sender: {
        name: "IEEE SPS Student Branch Chapter",
        email: process.env.BREVO_SENDER_EMAIL,
      },

      to: [
        {
          email: leader.email,
          name: leader.fullName,
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
    };

    // IMPORTANT:
    // Only send "cc" when there are actually CC recipients.
    if (ccMembers.length > 0) {
      emailData.cc = ccMembers;
    }

    await api.sendTransacEmail(emailData);

    console.log(
      `Verification email sent to ${leader.email}` +
        (ccMembers.length > 0
          ? ` (CC: ${ccMembers.length} members)`
          : " (No CC members)"),
    );
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
