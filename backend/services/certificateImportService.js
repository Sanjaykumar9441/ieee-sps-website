const Certificate = require("../models/Certificate");
const CertificateCounter = require("../models/CertificateCounter");

const TYPE_PREFIX = {
  PARTICIPATION: "P",
  MERIT: "M", // Team Merit for now
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

  return normalize(value);
}

async function nextCertificateId(eventCode, certificateType) {
  const prefix = TYPE_PREFIX[certificateType];
  if (!prefix)
    throw new Error(`Unsupported certificate type: ${certificateType}`);

  const key = `${eventCode}:${certificateType}`;

  const counter = await CertificateCounter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return `${eventCode}-${prefix}-${String(counter.seq).padStart(6, "0")}`;
}

function requiredColumnsForType(type) {
  if (type === "MERIT") {
    return ["Name", "RollNo", "Team", "College", "Position", "Event"];
  }

  if (type === "PARTICIPATION") {
    return ["Name", "RollNo", "Branch", "College", "City"];
  }

  if (type === "VOLUNTEER") {
    return ["Name", "RollNo", "Branch", "College", "City"];
  }

  throw new Error(`Invalid certificateType: ${type}`);
}

async function importRows({ eventCode, certificateType, rows, templateName }) {
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

    if (!name || !rollNo) {
      results.skipped += 1;
      results.errors.push({
        row: index + 2,
        reason: "Name and RollNo are required",
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

      const data = {
        eventCode: normalizedEventCode,
        certificateType: type,
        certificateId,
        name,
        rollNo,
        eventDate: "", // Date is already part of the certificate template.
        templateName: templateName || type.toLowerCase(),
      };

      if (type === "MERIT") {
        data.team = normalize(row.Team);
        data.college = normalize(row.College);
        data.position = normalize(row.Position);
        data.event = normalize(row.Event);

        if (!data.team || !data.college || !data.position || !data.event) {
          throw new Error(
            "Name, RollNo, Team, College, Position and Event are required",
          );
        }
      } else {
        data.branch = normalize(row.Branch);
        data.college = normalize(row.College);
        data.city = normalize(row.City);

        if (!data.branch || !data.college || !data.city) {
          throw new Error(
            "Name, RollNo, Branch, College and City are required",
          );
        }
      }

      await Certificate.create(data);
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
  requiredColumnsForType,
};
