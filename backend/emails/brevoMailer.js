const axios = require("axios");

function getBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "IEEE SPS";

  if (!apiKey) throw new Error("BREVO_API_KEY is not configured.");
  if (!senderEmail) throw new Error("BREVO_SENDER_EMAIL is not configured.");

  return { apiKey, senderEmail, senderName };
}

async function sendBrevoEmail({ to, cc = [], subject, html, attachments = [] }) {
  const { apiKey, senderEmail, senderName } = getBrevoConfig();

  const recipients = (Array.isArray(to) ? to : [to])
    .filter(Boolean)
    .map((item) =>
      typeof item === "string"
        ? { email: item }
        : { email: item.email, name: item.name },
    )
    .filter((item) => item.email);

  if (!recipients.length) throw new Error("At least one email recipient is required.");

  const body = {
    sender: { email: senderEmail, name: senderName },
    to: recipients,
    subject,
    htmlContent: html,
  };

  const ccRecipients = (Array.isArray(cc) ? cc : [])
    .filter(Boolean)
    .map((item) =>
      typeof item === "string"
        ? { email: item }
        : { email: item.email, name: item.name },
    )
    .filter((item) => item.email);

  if (ccRecipients.length) body.cc = ccRecipients;

  if (attachments.length) {
    body.attachment = attachments.map((a) => ({
      name: a.name,
      content: Buffer.isBuffer(a.content)
        ? a.content.toString("base64")
        : a.content,
    }));
  }

  try {
    return await axios.post("https://api.brevo.com/v3/smtp/email", body, {
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      timeout: 30000,
    });
  } catch (error) {
    console.error(
      "Brevo API error:",
      error.response?.data || error.message || error,
    );
    throw error;
  }
}

module.exports = { sendBrevoEmail };
