const Certificate = require("../models/Certificate");

const generateParticipationCertificateId = async () => {
  const prefix = "AUS-NSD-2026-P-";

  const lastCertificate = await Certificate.findOne({
    certificateType: "participation",
    certificateId: { $regex: `^${prefix}` },
  })
    .sort({ certificateId: -1 })
    .lean();

  let nextNumber = 1;

  if (lastCertificate) {
    const lastNumber = parseInt(
      lastCertificate.certificateId.replace(prefix, ""),
      10,
    );

    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};

module.exports = {
  generateParticipationCertificateId,
};
