const { renderVerificationEmail } = require("./renderEmail");
const { sendBrevoEmail } = require("./brevoMailer");

const sendVerificationEmail = async (registration, pdfBuffer) => {
  const leader = registration?.members?.[0];

  if (!leader?.email) {
    throw new Error("Leader email is required to send verification email.");
  }

  const cc = (registration.members || [])
    .slice(1)
    .filter((member) => member?.email)
    .map((member) => ({
      email: member.email,
      name: member.fullName,
    }));

  const html = await renderVerificationEmail(registration);

  await sendBrevoEmail({
    to: [{ email: leader.email, name: leader.fullName }],
    cc,
    subject:
      `National Space Day 2026 | Registration Verified | ${registration.registrationId}`,
    html,
    attachments: pdfBuffer
      ? [{
          name:
            `National_Space_Day_2026_Verified_Acknowledgement_${registration.registrationId}.pdf`,
          content: pdfBuffer,
        }]
      : [],
  });

  console.log(`Verification email sent to ${leader.email}`);
};

module.exports = { sendVerificationEmail };
