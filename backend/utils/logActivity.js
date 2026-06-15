const ActivityLog = require("../models/ActivityLog");

const logActivity = async (
  adminName,
  action,
  details = ""
) => {
  try {
    await ActivityLog.create({
      adminName,
      action,
      details,
    });
  } catch (err) {
    console.error(
      "ACTIVITY LOG ERROR:",
      err
    );
  }
};

module.exports = logActivity;