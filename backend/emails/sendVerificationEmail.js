const axios = require("axios");
const { renderVerificationEmail } = require("./renderEmail");

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

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName =
    process.env.BREVO_SENDER_NAME ||
    "IEEE SPS Student Branch Chapter";

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL is not configured");
  }

  try {
    const emailData = {
      sender: {
        name: senderName,
        email: senderEmail,
      },

      to: [
        {
          email: leader.email,
          name: leader.fullName,
        },
      ],

      subject: `National Space Day 2026 | Registration Verified | ${registration.registrationId}`,

      htmlContent: html,

      attachment: pdfBuffer
        ? [
            {
              name: `National_Space_Day_2026_Verified_Acknowledgement_${registration.registrationId}.pdf`,
              content: pdfBuffer.toString("base64"),
            },
          ]
        : [],
    };

    // Only send CC when there are actually CC recipients
    if (ccMembers.length > 0) {
      emailData.cc = ccMembers;
    }

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      emailData,
      {
        headers: {
          accept: "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },
        timeout: 15000,
      }
    );

    console.log(
      `Verification email sent to ${leader.email}` +
        (ccMembers.length > 0
          ? ` (CC: ${ccMembers.length} members)`
          : " (No CC members)") +
        ` | Message ID: ${response.data?.messageId || "N/A"}`
    );

    return response.data;
  } catch (error) {
    const brevoError =
      error?.response?.data?.message ||
      error?.response?.data?.code ||
      error?.message ||
      "Brevo email sending failed";

    console.error("❌ Brevo Verification Email Error:", brevoError);

    throw new Error(brevoError);
  }
};

module.exports = {
  sendVerificationEmail,
};