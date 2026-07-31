const EventSettings = require("../models/EventSettings");
const { getIO } = require("../socket");

/* ==========================================
   GET SETTINGS
========================================== */

exports.getSettings = async (req, res) => {
  try {
    const settings = await EventSettings.findOne({
      event: "space-day",
    });

    return res.json({
      success: true,
      settings,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================
   UPDATE MASTER
========================================== */

exports.updateMaster = async (req, res) => {
  try {
    const { enabled } = req.body;

    const settings = await EventSettings.findOneAndUpdate(
      { event: "space-day" },
      {
        enabled,
      },
      {
        returnDocument: "after"
      },
    );
    getIO().emit("registrationSettingsUpdated", settings);

    console.log("⚙️ Registration Settings Updated (Master)");
    return res.json({
      success: true,
      settings,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================
   UPDATE EVENT
========================================== */

exports.updateEvent = async (req, res) => {
  try {
    const { event, enabled } = req.body;

    const settings = await EventSettings.findOne({
      event: "space-day",
    });

    if (!settings.events.hasOwnProperty(event)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event.",
      });
    }

    settings.events[event] = enabled;

    await settings.save();
    getIO().emit("registrationSettingsUpdated", settings);

    console.log(`⚙️ ${event} Registration Updated`);

    return res.json({
      success: true,
      settings,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await EventSettings.findOne({
      event: "space-day",
    });

    return res.json({
      success: true,
      settings,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================
   UPDATE ATTENDANCE STATUS
========================================== */

exports.updateAttendanceStatus = async (req, res) => {
  try {
    const { attendanceOpen } = req.body;

    const settings = await EventSettings.findOneAndUpdate(
      { event: "space-day" },
      {
        attendanceOpen,
      },
      {
        returnDocument: "after"
      },
    );

    getIO().emit("attendanceSettingsUpdated", settings);

    console.log(`⚙️ Attendance ${attendanceOpen ? "Opened" : "Closed"}`);

    return res.json({
      success: true,
      settings,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
