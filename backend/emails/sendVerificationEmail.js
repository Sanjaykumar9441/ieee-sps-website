const axios = require("axios");
const { renderVerificationEmail } = require("./renderEmail");

async function sendVerificationEmail(registration, pdfBuffer) {
  const members = Array.isArray(registration?.members) ? registration.members : [];
  const leader = members[0];
  if (!leader?.email) throw new Error("Leader email is required.");

  const cc = members.slice(1).filter((member) => member?.email).map((member) => ({ email: member.email, name: member.fullName }));
  const html = await renderVerificationEmail(registration);
  const attachment = pdfBuffer ? [{ name: `National_Space_Day_2026_Verified_Acknowledgement_${registration.registrationId}.pdf`, content: pdfBuffer.toString("base64") }] : [];

  const payload = {
    sender: { name: process.env.BREVO_SENDER_NAME || "IEEE SPS Student Branch Chapter", email: process.env.BREVO_SENDER_EMAIL },
    to: [{ email: leader.email, name: leader.fullName }],
    subject: `National Space Day 2026 | Registration Verified | ${registration.registrationId}`,
    htmlContent: html,
    textContent: "Your registration has been verified. Please see the attached acknowledgement.",
    attachment,
  };
  if (cc.length) payload.cc = cc;
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) throw new Error("Brevo email service is not configured.");

  try {
    await axios.post("https://api.brevo.com/v3/smtp/email", payload, { headers: { accept:"application/json", "api-key":process.env.BREVO_API_KEY, "content-type":"application/json" }, timeout:15000 });
    console.log(`Verification email sent to ${leader.email}`);
  } catch (error) {
    console.error("Brevo verification email error:", error.response?.data || error.message);
    throw error;
  }
}

module.exports = { sendVerificationEmail };
