const axios = require("axios");

async function sendMail(to, subject, htmlContent, pdfBuffer, filename) {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) throw new Error("Brevo email service is not configured.");
  const payload = {
    sender: { name: process.env.BREVO_SENDER_NAME || "IEEE SPS", email: process.env.BREVO_SENDER_EMAIL },
    to: [{ email: to }], subject, htmlContent,
    textContent: "Your registration has been confirmed. Please see the attached document.",
    attachment: pdfBuffer ? [{ name: filename || "attachment.pdf", content: pdfBuffer.toString("base64") }] : [],
  };
  try {
    await axios.post("https://api.brevo.com/v3/smtp/email", payload, { headers:{accept:"application/json","api-key":process.env.BREVO_API_KEY,"content-type":"application/json"}, timeout:15000 });
    console.log("Email sent:", to);
  } catch(error) {
    console.error("Brevo mail error:", error.response?.data || error.message);
    throw error;
  }
}

module.exports = sendMail;
