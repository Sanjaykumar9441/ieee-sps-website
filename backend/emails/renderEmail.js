const ejs = require("ejs");
const path = require("path");

const themes = require("./templates/theme");

const renderVerificationEmail = async (registration) => {
  const member = registration.members[0];

  const theme = themes[registration.eventType] || themes.astroquiz;

  console.log("Rendering verification email...");

  const html = await ejs.renderFile(
    path.join(__dirname, "templates", "verification.ejs"),
    {
      participantName: member.fullName,
      registrationId: registration.registrationId,
      eventName: theme.eventName,
      paymentStatus: registration.paymentStatus,
      whatsappLink: theme.whatsapp,
      statusLink: `https://ieeespsaditya.vercel.app/space-day/status/${registration.registrationId}`,
      primaryColor: theme.primary,
    },
  );
  console.log("Email rendered successfully.");
  return html;
};

module.exports = {
  renderVerificationEmail,
};
