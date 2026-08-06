const axios = require("axios");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const sendRegistrationToTelegram = async (registration) => {
  const member = registration.members[0];

  const eventNames = {
    astroquiz: "Astro Quiz",
    astrodesign: "AI Astro Design",
    astromodeler: "Astro Modeler",
  };

  const caption = `
🚀 <b>National Space Day 2026</b>

━━━━━━━━━━━━━━━━━━━━

<b>Registration ID</b>
<code>${registration.registrationId}</code>

<b>Event</b>
${eventNames[registration.eventType]}

<b>Type</b>
${registration.registrationType === "team" ? "Team" : "Individual"}

<b>${registration.registrationType === "team" ? "Team Name" : "Participant"}</b>
${
  registration.registrationType === "team"
    ? registration.teamName
    : member.fullName
}

<b>Roll Number</b>
${member.rollNumber}

<b>Amount</b>
₹${registration.totalFee}

<b>UTR</b>
<code>${registration.transactionId}</code>

━━━━━━━━━━━━━━━━━━━━
`;

  const response = await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
    {
      chat_id: CHAT_ID,
      photo: registration.paymentScreenshot,
      caption,
      parse_mode: "HTML",

      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✅ Verify",
              callback_data: `verify:${registration.registrationId}`,
            },
            {
              text: "❌ Reject",
              callback_data: `reject:${registration.registrationId}`,
            },
          ],
        ],
      },
    },
  );

  return response.data.result;
};

const editTelegramMessage = async (registration) => {
  const statusEmoji = registration.paymentStatus === "Verified" ? "🟢" : "🔴";

  const eventNames = {
    astroquiz: "Astro Quiz",
    astrodesign: "AI Astro Design",
    astromodeler: "Astro Modeler",
  };

  const member = registration.members[0];

  const caption = `
🚀 <b>National Space Day 2026</b>

━━━━━━━━━━━━━━━━━━

<b>Registration ID</b>
<code>${registration.registrationId}</code>

<b>Event</b>
${eventNames[registration.eventType]}

<b>Participant</b>
${
  registration.registrationType === "team"
    ? registration.teamName
    : member.fullName
}

━━━━━━━━━━━━━━━━━━

${statusEmoji} <b>${registration.paymentStatus.toUpperCase()}</b>

<b>Verified By</b>
${registration.verifiedBy}

<b>Verified Via</b>
${registration.verificationMethod}

<b>Verified At</b>
${new Date(registration.verifiedAt).toLocaleString("en-IN", {
  timeZone: "Asia/Kolkata",
  dateStyle: "medium",
  timeStyle: "short",
})}

━━━━━━━━━━━━━━━━━━

${
  registration.paymentStatus === "Verified"
    ? `✅ <b>Registration Completed</b>

No further action is required.`
    : `❌ <b>Registration Rejected</b>

This registration has been rejected.

No further action is required.`
}
`;

  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/editMessageCaption`,
    {
      chat_id: registration.telegramChatId,
      message_id: registration.telegramMessageId,
      caption,
      parse_mode: "HTML",

      reply_markup: {
        inline_keyboard: [],
      },
    },
  );
};

module.exports = {
  sendRegistrationToTelegram,
  editTelegramMessage,
};
