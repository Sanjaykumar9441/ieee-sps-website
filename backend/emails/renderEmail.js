const { render } = require("@react-email/render");
const React = require("react");

const VerificationEmail =
  require("./templates/VerificationEmail").default;

const themes = require("./theme");

const eventNames = {
  astroquiz: "Astro Quiz Competition",

  astrodesign: "AI Astro Design Competition",

  astromodeler: "Astro Modeler Competition",
};

const whatsappLinks = {
  astroquiz:
    "https://chat.whatsapp.com/IKoC6O57ezV0VUR7LxXR2p?s=cl&p=a&ilr=1",

  astrodesign:
    "https://chat.whatsapp.com/L0f3qeoV0MhJAmUZLTv8NL?s=cl&p=a&ilr=1",

  astromodeler:
    "https://chat.whatsapp.com/G7wc65lWxuGAZgHMHOttFi?s=cl&p=a&ilr=1",
};

const renderVerificationEmail = (registration) => {

 const theme =
  themes[registration.eventType] ||
  themes.astroquiz;

  const member = registration.members[0];

  return render(
    React.createElement(
      VerificationEmail,
      {
        participantName: member.fullName,

        registrationId:
          registration.registrationId,

        eventName:
          eventNames[registration.eventType],

        paymentStatus:
          registration.paymentStatus,

        whatsappLink:
          whatsappLinks[
            registration.eventType
          ],

        statusLink:
`https://ieeespsaditya.vercel.app/space-day/status/${registration.registrationId}`,

        primaryColor: theme.primary,
      }
    )
  );

};

module.exports = {
  renderVerificationEmail,
};