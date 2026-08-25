const Certificate = require("../models/Certificate");
const CertificateEvent = require("../models/CertificateEvent");

const cleanCode = (value) => String(value || "").trim().toUpperCase();

exports.listEvents = async (req, res) => {
  try {
    const events = await CertificateEvent.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, events });
  } catch (err) {
    console.error("listEvents:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const eventCode = cleanCode(req.body.eventCode);

    if (!eventCode) {
      return res.status(400).json({
        success: false,
        message: "Event code is required",
      });
    }

    // Event name is intentionally not required in the dashboard.
    // Keep the schema compatible by using the event code as the name.
    const eventName = String(req.body.eventName || eventCode).trim();

    const existingEvent = await CertificateEvent.findOne({ eventCode }).lean();
    const existingCertificate = await Certificate.exists({ eventCode });

    if (existingEvent || existingCertificate) {
      return res.status(409).json({
        success: false,
        message: "Event code already exists",
      });
    }

    const event = await CertificateEvent.create({
      eventCode,
      eventName,
    });

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Event code already exists",
      });
    }

    console.error("createEvent:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const eventCode = cleanCode(req.params.eventCode);

    if (!eventCode) {
      return res.status(400).json({
        success: false,
        message: "Event code is required",
      });
    }

    // IMPORTANT: delete certificates first, then delete the event record.
    const result = await Certificate.deleteMany({ eventCode });
    const event = await CertificateEvent.findOneAndDelete({ eventCode });

    return res.json({
      success: true,
      deletedCertificates: result.deletedCount || 0,
      deletedEvent: Boolean(event),
    });
  } catch (err) {
    console.error("deleteEvent:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
