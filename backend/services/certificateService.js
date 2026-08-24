const CertificateCounter = require("../models/CertificateCounter");

const TYPE_PREFIX = {
  participation: "P",
  merit: "M",
  volunteer: "V",
};

async function generateCertificateId(eventCode, certificateType) {
  const prefix = TYPE_PREFIX[certificateType];

  if (!prefix) {
    throw new Error(
      `Invalid certificate type: ${certificateType}`
    );
  }

  const key = `${eventCode}-${certificateType}`;

  const counter = await CertificateCounter.findOneAndUpdate(
    { key },
    {
      $inc: {
        sequence: 1,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  const sequence = String(counter.sequence).padStart(6, "0");

  return `${eventCode}-${prefix}-${sequence}`;
}

module.exports = {
  generateCertificateId,
};