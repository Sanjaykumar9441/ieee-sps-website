const SpaceDayRegistration = require("../models/SpaceDayRegistration");
const { editTelegramMessage } = require("./telegramService");
const generateAcknowledgement = require("../pdf/generateAcknowledgement");

const { sendVerificationEmail } = require("../emails/sendVerificationEmail");

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
    try {
      console.log(
        `Generating acknowledgement for ${registration.registrationId}...`,
      );

      const pdfBuffer = await generateAcknowledgement(registration);

      console.log("Acknowledgement generated successfully.");

      console.log(
        `Sending verification email to ${registration.members[0].email}...`,
      );

      await sendVerificationEmail(registration, pdfBuffer);

      console.log("Verification email sent successfully.");
    } catch (error) {
      console.error(
        "Verification email failed:",
        error.response?.body || error.message || error,
      );
    }
  }

  return registration;
};

module.exports = {
  verifyRegistration,
};
