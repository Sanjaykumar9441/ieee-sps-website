const SpaceDayRegistration = require("../models/SpaceDayRegistration");

const generateRegistrationId = async () => {
  const prefix = process.env.SPACE_DAY_REG_PREFIX || "NSD26";

  // Find latest registration
  const latestRegistration = await SpaceDayRegistration.findOne({})
    .sort({ createdAt: -1 })
    .select("registrationId");

  let nextNumber = 1;

  if (
    latestRegistration &&
    latestRegistration.registrationId &&
    latestRegistration.registrationId.startsWith(prefix)
  ) {
    const lastNumber = parseInt(
      latestRegistration.registrationId.replace(prefix, ""),
      10
    );

    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};

module.exports = generateRegistrationId;