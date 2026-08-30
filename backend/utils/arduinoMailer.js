const axios = require("axios");

function requireBrevoEnv() {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "IEEE SPS";

  if (!apiKey || !senderEmail) {
    throw new Error(
      "BREVO_API_KEY and BREVO_SENDER_EMAIL must be configured.",
    );
  }

  return { apiKey, senderEmail, senderName };
}

async function sendArduinoEmail({
  to,
  subject,
  html,
  attachments = [],
  cc = [],
}) {
  const { apiKey, senderEmail, senderName } = requireBrevoEnv();

  const normalize = (items) =>
    (Array.isArray(items) ? items : [items])
      .filter(Boolean)
      .map((item) =>
        typeof item === "string"
          ? { email: item }
          : { email: item.email, name: item.name },
      )
      .filter((item) => item.email);

  const payload = {
    sender: { email: senderEmail, name: senderName },
    to: normalize(to),
    subject,
    htmlContent: html,
  };

  const ccRows = normalize(cc);
  if (ccRows.length) payload.cc = ccRows;

  if (attachments.length) {
    payload.attachment = attachments.map((a) => ({
      name: a.name,
      content: Buffer.isBuffer(a.content)
        ? a.content.toString("base64")
        : a.content,
    }));
  }

  if (!payload.to.length) throw new Error("Arduino email recipient is missing.");

  return axios.post("https://api.brevo.com/v3/smtp/email", payload, {
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    timeout: 30000,
  });
}

module.exports = { sendArduinoEmail };
