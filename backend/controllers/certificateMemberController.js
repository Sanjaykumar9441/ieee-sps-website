const mongoose = require("mongoose");
const Certificate = require("../models/Certificate");

const cleanCode = (v) => String(v || "").trim().toUpperCase();
const cleanType = (v) => String(v || "").trim().toUpperCase();
const allowedTypes = new Set(["PARTICIPATION", "MERIT", "VOLUNTEER"]);
const prefixes = { PARTICIPATION: "P", MERIT: "M", VOLUNTEER: "V" };

function makeData(body, type, eventCode) {
  const data = {
    eventCode,
    certificateType: type,
    name: String(body.name || "").trim(),
    rollNo: String(body.rollNo || "").trim().toUpperCase(),
    college: String(body.college || "").trim(),
    templateName: type === "MERIT" ? "merit" : type === "VOLUNTEER" ? "volunteer" : "participation",
  };
  if (type === "MERIT") {
    data.team = String(body.team || "").trim();
    data.position = String(body.position || "").trim();
    data.event = String(body.event || "").trim();
  } else {
    data.branch = String(body.branch || "").trim();
    data.city = String(body.city || "").trim();
  }
  return data;
}

function validate(data) {
  if (!data.eventCode) return "Event code is required";
  if (!allowedTypes.has(data.certificateType)) return "Invalid certificate type";
  if (!data.name) return "Name is required";
  if (!data.rollNo) return "Roll number is required";
  if (!data.college) return "College is required";
  if (data.certificateType === "MERIT") {
    if (!data.team) return "Team is required";
    if (!data.position) return "Position is required";
    if (!data.event) return "Event is required";
  }
  return null;
}

async function nextCertificateId(eventCode, type) {
  const prefix = prefixes[type];
  const rows = await Certificate.find({ eventCode, certificateType: type })
    .select("certificateId").lean();
  let max = 0;
  for (const row of rows) {
    const m = String(row.certificateId || "").match(/-(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  let n = max + 1;
  let id;
  do {
    id = `${eventCode}-${prefix}-${String(n).padStart(6, "0")}`;
    n++;
  } while (await Certificate.exists({ certificateId: id }));
  return id;
}

exports.listMembers = async (req, res) => {
  try {
    const eventCode = cleanCode(req.query.eventCode);
    const certificateType = cleanType(req.query.certificateType);
    if (!eventCode || !allowedTypes.has(certificateType)) {
      return res.status(400).json({ success: false, message: "Event code and certificate type are required" });
    }
    const certificates = await Certificate.find({ eventCode, certificateType })
      .sort({ createdAt: 1 }).lean();
    return res.json({ success: true, certificates });
  } catch (err) {
    console.error("listMembers:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const type = cleanType(req.body.certificateType);
    const eventCode = cleanCode(req.body.eventCode);
    const data = makeData(req.body, type, eventCode);
    const error = validate(data);
    if (error) return res.status(400).json({ success: false, message: error });

    if (await Certificate.exists({ eventCode, certificateType: type, rollNo: data.rollNo })) {
      return res.status(409).json({ success: false, message: "A certificate already exists for this roll number" });
    }

    data.certificateId = await nextCertificateId(eventCode, type);
    const certificate = await Certificate.create(data);
    return res.status(201).json({ success: true, certificate });
  } catch (err) {
    console.error("addMember:", err);
    if (err.code === 11000) return res.status(409).json({ success: false, message: "A certificate already exists for this roll number" });
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.editMember = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid member ID" });

    const existing = await Certificate.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Member not found" });

    const type = existing.certificateType;
    const data = makeData(req.body, type, existing.eventCode);
    const error = validate(data);
    if (error) return res.status(400).json({ success: false, message: error });

    const duplicate = await Certificate.findOne({
      _id: { $ne: existing._id },
      eventCode: existing.eventCode,
      certificateType: type,
      rollNo: data.rollNo,
    }).lean();

    if (duplicate) return res.status(409).json({ success: false, message: "Another certificate already uses this roll number" });

    Object.assign(existing, data);
    // Existing certificateId is deliberately preserved.
    existing.certificateId = existing.get("certificateId");
    await existing.save();

    return res.json({ success: true, certificate: existing });
  } catch (err) {
    console.error("editMember:", err);
    if (err.code === 11000) return res.status(409).json({ success: false, message: "Duplicate certificate" });
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const result = await Certificate.deleteOne({ _id: req.params.id });
    if (!result.deletedCount) return res.status(404).json({ success: false, message: "Member not found" });
    return res.json({ success: true });
  } catch (err) {
    console.error("deleteMember:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteMembers = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.filter((id) => mongoose.Types.ObjectId.isValid(id)) : [];
    const eventCode = cleanCode(req.body.eventCode);
    const certificateType = cleanType(req.body.certificateType);

    if (!ids.length) return res.status(400).json({ success: false, message: "No members selected" });
    if (!eventCode || !allowedTypes.has(certificateType)) {
      return res.status(400).json({ success: false, message: "Event code and certificate type are required" });
    }

    const result = await Certificate.deleteMany({
      _id: { $in: ids },
      eventCode,
      certificateType,
    });

    return res.json({ success: true, deletedCount: result.deletedCount || 0 });
  } catch (err) {
    console.error("deleteMembers:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
