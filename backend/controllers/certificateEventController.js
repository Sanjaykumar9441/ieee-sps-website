const Certificate = require("../models/Certificate");
const CertificateEvent = require("../models/CertificateEvent");

const cleanCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

// ============================================================
// GET ALL EVENTS
// ============================================================

exports.listEvents = async (req, res) => {
  try {
    const events = await CertificateEvent.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      events,
    });
  } catch (err) {
    console.error("listEvents:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to load certificate events",
      error: err.message,
    });
  }
};

// ============================================================
// CREATE EVENT
// Only Event Code is required.
// No event name.
// No date.
// ============================================================

exports.createEvent = async (req, res) => {
  try {
    const eventCode = cleanCode(req.body.eventCode);

    if (!eventCode) {
      return res.status(400).json({
        success: false,
        message: "Event code is required",
      });
    }

    // Check if event already exists
    const existingEvent = await CertificateEvent.findOne({
      eventCode,
    }).lean();

    if (existingEvent) {
      return res.status(409).json({
        success: false,
        message: "Event code already exists",
        event: existingEvent,
      });
    }

    const event = await CertificateEvent.create({
      eventCode,
    });

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
    });
  } catch (err) {
    // MongoDB duplicate protection
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Event code already exists",
      });
    }

    console.error("createEvent:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to create event",
      error: err.message,
    });
  }
};

// ============================================================
// DELETE EVENT
//
// When an event is deleted:
// 1. Delete the event record
// 2. Delete ALL certificates belonging to that event
// ============================================================

exports.deleteEvent = async (req, res) => {
  try {
    const eventCode = cleanCode(req.params.eventCode);

    if (!eventCode) {
      return res.status(400).json({
        success: false,
        message: "Event code is required",
      });
    }

    // Delete all certificates belonging to this event
    const certificateResult = await Certificate.deleteMany({
      eventCode,
    });

    // Delete the event itself
    const eventResult = await CertificateEvent.findOneAndDelete({
      eventCode,
    });

    if (!eventResult) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
        deletedCertificates: certificateResult.deletedCount || 0,
      });
    }

    return res.json({
      success: true,
      message: "Event and all its certificates deleted successfully",
      deletedCertificates: certificateResult.deletedCount || 0,
      deletedEvent: true,
    });
  } catch (err) {
    console.error("deleteEvent:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to delete event",
      error: err.message,
    });
  }
};
