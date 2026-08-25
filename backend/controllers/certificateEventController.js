const Certificate = require("../models/Certificate");
const CertificateEvent = require("../models/CertificateEvent");

function normalizeEventCode(value) {
  return String(value || "").trim().toUpperCase();
}

// GET /api/certificates/events
// Returns created events plus any event codes already present in certificates.
async function getCertificateEvents(req, res) {
  try {
    const [events, certificateEventCodes] = await Promise.all([
      CertificateEvent.find({}).sort({ createdAt: -1 }).lean(),
      Certificate.distinct("eventCode"),
    ]);

    const map = new Map();

    for (const event of events) {
      map.set(event.eventCode, {
        _id: event._id,
        eventCode: event.eventCode,
        createdAt: event.createdAt,
      });
    }

    for (const eventCode of certificateEventCodes) {
      const normalized = normalizeEventCode(eventCode);
      if (!normalized || map.has(normalized)) continue;

      map.set(normalized, {
        _id: null,
        eventCode: normalized,
        createdAt: null,
      });
    }

    const result = Array.from(map.values()).sort((a, b) =>
      a.eventCode.localeCompare(b.eventCode)
    );

    return res.json({
      success: true,
      events: result,
    });
  } catch (error) {
    console.error("Get certificate events error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load certificate events",
    });
  }
}

// POST /api/certificates/events
async function createCertificateEvent(req, res) {
  try {
    const eventCode = normalizeEventCode(req.body.eventCode);

    if (!eventCode) {
      return res.status(400).json({
        success: false,
        message: "Event code is required",
      });
    }

    const existingEvent = await CertificateEvent.findOne({ eventCode }).lean();
    const existingCertificate = await Certificate.exists({ eventCode });

    if (existingEvent || existingCertificate) {
      return res.status(409).json({
        success: false,
        message: "This event code already exists",
      });
    }

    const event = await CertificateEvent.create({ eventCode });

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: {
        _id: event._id,
        eventCode: event.eventCode,
        createdAt: event.createdAt,
      },
    });
  } catch (error) {
    console.error("Create certificate event error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This event code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create certificate event",
    });
  }
}

module.exports = {
  getCertificateEvents,
  createCertificateEvent,
};
