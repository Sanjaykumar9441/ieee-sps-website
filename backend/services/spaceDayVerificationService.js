const SpaceDayRegistration = require("../models/SpaceDayRegistration");
const { editTelegramMessage } = require("./telegramService");
const generateAcknowledgement = require("../pdf/generateAcknowledgement");

//const { sendVerificationEmail } = require("../emails/sendVerificationEmail");

const verifyRegistration = async ({
  registrationId,
  paymentStatus,
  verifiedBy,
  method,
}) => {
  if (!["Verified", "Rejected"].includes(paymentStatus)) {
    throw new Error("Invalid payment status.");
  }

  /* -------------------------
     Find Registration
  ------------------------- */

  const registration = await SpaceDayRegistration.findOne({
    registrationId,
  });

  if (!registration) {
    throw new Error("Registration not found.");
  }

  /* -------------------------
     Prevent Duplicate Verification
  ------------------------- */

  if (registration.paymentStatus === paymentStatus) {
    throw new Error(`Payment already ${paymentStatus.toLowerCase()}.`);
  }

  /* -------------------------
     Update Status
  ------------------------- */

  registration.paymentStatus = paymentStatus;

  registration.status = paymentStatus === "Verified" ? "Approved" : "Rejected";

  /* -------------------------
     Verification Details
  ------------------------- */

  registration.verifiedBy = verifiedBy;

  registration.verificationMethod = method;

  registration.verifiedAt = new Date();

  await registration.save();

  if (registration.telegramChatId && registration.telegramMessageId) {
    await editTelegramMessage(registration);
  }

  if (paymentStatus === "Verified") {
    /*   
  const pdf =
    await generateAcknowledgement(
      registration
    );

  await sendVerificationEmail(
    registration,
    pdf
  );
  */
  }

  return registration;
};

module.exports = {
  verifyRegistration,
};
