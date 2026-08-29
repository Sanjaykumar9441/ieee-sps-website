/**
 * Arduino Days 2026 - Brevo Transactional Email Sender
 * Uses Brevo HTTP API through axios.
 */

const axios = require("axios");

const sendMail = async (
  to,
  subject,
  htmlContent,
  pdfBuffer,
  filename
) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName =
      process.env.BREVO_SENDER_NAME || "IEEE SPS Student Branch Chapter";

    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not configured");
    }

    if (!senderEmail) {
      throw new Error("BREVO_SENDER_EMAIL is not configured");
    }

    const email = {
      sender: {
        name: senderName,
        email: senderEmail,
      },

      to: [
        {
          email: to,
        },
      ],

      subject,

      htmlContent,

      // Plain-text fallback
      textContent:
        "Your Arduino Days 2026 registration has been confirmed. Please see the attached event pass.",

      headers: {
        "X-Mailer": "ArduinoRegistrationMailer",
        "Auto-Submitted": "auto-generated",
        Precedence: "bulk",
      },

      // Keep PDF attachment functionality
      attachment: pdfBuffer
        ? [
            {
              name: filename || "event-pass.pdf",
              content: pdfBuffer.toString("base64"),
            },
          ]
        : [],
    };

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      email,
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
      "✅ Arduino registration email sent:",
      to,
      response.data?.messageId || ""
    );

    return response.data;
  } catch (error) {
    const brevoError =
      error?.response?.data?.message ||
      error?.response?.data?.code ||
      error?.message ||
      "Brevo email sending failed";

    console.error("❌ Arduino Brevo Mail error:", brevoError);

    throw new Error(brevoError);
  }
};

module.exports = sendMail;