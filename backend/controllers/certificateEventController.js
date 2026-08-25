const Certificate = require("../models/Certificate");
const CertificateEvent = require("../models/CertificateEvent");

const cleanCode = (value) => String(value || "").trim().toUpperCase();

exports.listEvents = async (req, res) => {
  try {
    const events = await CertificateEvent.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, events });
  } catch (err) {
    console.error("listEvents:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const eventCode = cleanCode(req.body.eventCode);
    const eventName = String(req.body.eventName || "").trim();

    if (!eventCode) return res.status(400).json({ success: false, message: "Event code is required" });
    if (!eventName) return res.status(400).json({ success: false, message: "Event name is required" });

    const event = await CertificateEvent.create({ eventCode, eventName });
    return res.status(201).json({ success: true, event });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Event code already exists" });
    }
    console.error("createEvent:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const eventCode = cleanCode(req.params.eventCode);
    if (!eventCode) return res.status(400).json({ success: false, message: "Event code is required" });

    const result = await Certificate.deleteMany({ eventCode });
    const event = await CertificateEvent.findOneAndDelete({ eventCode });

    return res.json({
      success: true,
      deletedCertificates: result.deletedCount || 0,
      deletedEvent: Boolean(event),
    });
  } catch (err) {
    console.error("deleteEvent:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
