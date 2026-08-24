const Certificate = require("../models/Certificate");
const CertificateCounter = require("../models/CertificateCounter");

const TYPE_PREFIX = {
  PARTICIPATION: "P",
  MERIT: "M",
  VOLUNTEER: "V",
};

function normalize(value) {
  return String(value ?? "").trim();
}

function formatDate(value) {
  if (!value) return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const dd = String(value.getDate()).padStart(2, "0");
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    return `${dd}-${mm}-${value.getFullYear()}`;
  }

  const text = normalize(value);

  // Excel may arrive as an ISO date string.
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(text)) {
    const dd = String(parsed.getDate()).padStart(2, "0");
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    return `${dd}-${mm}-${parsed.getFullYear()}`;
  }

  return text;
}

async function nextCertificateId(eventCode, certificateType) {
  const prefix = TYPE_PREFIX[certificateType];
  if (!prefix)
    throw new Error(`Unsupported certificate type: ${certificateType}`);

  const key = `${eventCode}:${certificateType}`;

  const counter = await CertificateCounter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  return `${eventCode}-${prefix}-${String(counter.seq).padStart(6, "0")}`;
}

async function importRows({
  eventCode,
  certificateType,
  rows,
  defaultEventDate,
  templateName = "participation",
}) {
  const normalizedEventCode = normalize(eventCode).toUpperCase();
  const type = normalize(certificateType).toUpperCase();

  if (!normalizedEventCode) throw new Error("eventCode is required");
  if (!TYPE_PREFIX[type]) throw new Error("Invalid certificateType");

  const results = {
    imported: 0,
    skipped: 0,
    errors: [],
  };

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];

    const name = normalize(row.Name);
    const rollNo = normalize(row.RollNo).toUpperCase();
    const branch = normalize(row.Branch);
    const college = normalize(row.College);
    const city = normalize(row.City);
    const eventDate = formatDate(row.Date) || normalize(defaultEventDate);

    if (!name || !rollNo) {
      results.skipped += 1;
      results.errors.push({
        row: index + 2,
        reason: "Name, RollNo and Date are required",
      });
      continue;
    }

    try {
      const existing = await Certificate.findOne({
        eventCode: normalizedEventCode,
        certificateType: type,
        rollNo,
      });

      if (existing) {
        results.skipped += 1;
        continue;
      }

      const certificateId = await nextCertificateId(normalizedEventCode, type);

      const certificateData = {
        eventCode: normalizedEventCode,
        certificateType: type,
        certificateId,
        name,
        rollNo,
        branch,
        college,
        city,
        eventDate,
        templateName,
      };

      if (type === "MERIT") {
        certificateData.team = team;
        certificateData.position = position;
        certificateData.event = event;
      }

      await Certificate.create(certificateData);

      results.imported += 1;
    } catch (error) {
      results.skipped += 1;
      results.errors.push({
        row: index + 2,
        reason: error.message,
      });
    }
  }

  return results;
}

module.exports = {
  importRows,
  formatDate,
};
