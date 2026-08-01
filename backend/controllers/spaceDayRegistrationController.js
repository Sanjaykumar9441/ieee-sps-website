const SpaceDayRegistration = require("../models/SpaceDayRegistration");
const EventSettings = require("../models/EventSettings");
const generateRegistrationId = require("../utils/spaceDayRegistrationId");
const { validateRegistration } = require("../utils/spaceDayValidation");
const calculateFees = require("../utils/spaceDayFeeCalculator");
const spaceDayConfig = require("../config/spaceDayConfig");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const generateAcknowledgement = require("../pdf/generateAcknowledgement");
const { sendRegistrationToTelegram } = require("../services/telegramService");
const AttendanceLog = require("../models/SpaceDayAttendanceLog");
const ExcelJS = require("exceljs");

/* ============================================
   SUBMIT REGISTRATION
============================================ */

exports.submitRegistration = async (req, res) => {
  try {
    const registrationData = JSON.parse(req.body.registration);
    const {
      eventType,
      teamName,
      teamSize,
      selectedTheme,
      members,
      accommodation,
      accommodationMembers,
      arrivalDate,
      arrivalTime,
      departureDate,
      departureTime,
      transactionId,
      markAttendance,
    } = registrationData;

    /* ------------------------------
   REGISTRATION SETTINGS
------------------------------ */

    const settings = await EventSettings.findOne({
      event: "space-day",
    });

    if (!settings?.enabled) {
      return res.status(403).json({
        success: false,
        message: "Registrations for National Space Day are closed.",
      });
    }

    if (!settings.events[eventType]) {
      const eventNames = {
        astroquiz: "Astro Quiz",
        astrodesign: "AI Astro Design",
        astromodeler: "Astro Modeler",
      };

      return res.status(403).json({
        success: false,
        message: `Registrations for ${eventNames[eventType]} are closed.`,
      });
    }

    /* ------------------------------
       VALIDATION
    ------------------------------ */

    const validationErrors = validateRegistration(registrationData);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors,
      });
    }

    /* ------------------------------
   DATABASE DUPLICATE CHECK
------------------------------ */

    /* Transaction ID */

    const existingTransaction = await SpaceDayRegistration.findOne({
      transactionId,
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID has already been used.",
      });
    }

    /* Members */

    for (const member of members) {
      const existingMember = await SpaceDayRegistration.findOne({
        eventType,
        $or: [
          { "members.rollNumber": member.rollNumber },
          { "members.email": member.email },
          { "members.phone": member.phone },
        ],
      });

      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: `Member ${member.fullName} is already registered.`,
        });
      }
    }

    /* ------------------------------
       Registration ID
    ------------------------------ */

    const registrationId = await generateRegistrationId();

    /* ------------------------------
   CALCULATE FEES
------------------------------ */

    const fees = calculateFees({
      eventType,
      teamSize,
      accommodation,
      accommodationMembers,
      arrivalDate,
      departureDate,
    });

    /* ------------------------------
   EVENT CONFIG
------------------------------ */

    const eventConfig = spaceDayConfig[eventType];

    if (!eventConfig) {
      return res.status(400).json({
        success: false,
        message: "Invalid Event Type.",
      });
    }

    const registrationType = eventConfig.registrationType;

    /* ------------------------------
       Payment Screenshot
    ------------------------------ */

    let paymentScreenshot = "";
    let paymentScreenshotPublicId = "";

    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "SpaceDay2026/Payments",
      );

      paymentScreenshot = uploadResult.secure_url;

      paymentScreenshotPublicId = uploadResult.public_id;
    }

    /* ------------------------------
       Save Registration
    ------------------------------ */

    const registration = await SpaceDayRegistration.create({
      registrationId,

      eventType,
      registrationType,

      teamName,
      teamSize,

      selectedTheme,

      members,

      accommodation,
      accommodationMembers,

      arrivalDate,
      arrivalTime,

      departureDate,
      departureTime,

      transactionId,

      paymentScreenshot,

      paymentScreenshotPublicId,

      registrationFee: fees.registrationFee,

      accommodationFee: fees.accommodationFee,

      totalFee: fees.totalFee,
    });

    const telegramMessage = await sendRegistrationToTelegram(registration);

    registration.telegramChatId = telegramMessage.chat.id;

    registration.telegramMessageId = telegramMessage.message_id;

    await registration.save();
    const { getIO } = require("../socket");

    const newRegistration = await SpaceDayRegistration.findById(
      registration._id,
    ).lean();

    getIO().emit("newRegistration", newRegistration);

    console.log(`🆕 New Registration → ${newRegistration.registrationId}`);

    return res.status(201).json({
      success: true,

      message: "Registration submitted successfully.",

      registrationId,

      registration,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

/* ============================================
   CHECK MEMBERS
============================================ */

exports.checkMembers = async (req, res) => {
  try {
    const { members, eventType } = req.body;

    if (!members || !Array.isArray(members)) {
      return res.status(400).json({
        success: false,
        message: "Members are required.",
      });
    }

    /* -------------------------
   TEAM NAME
------------------------- */

    if (req.body.teamName) {
      const existingTeam = await SpaceDayRegistration.findOne({
        eventType,
        teamName: req.body.teamName.trim(),
      });

      if (existingTeam) {
        return res.json({
          success: true,
          exists: true,
          type: "teamName",
          message: "Team Name already exists.",
        });
      }
    }

    /* -------------------------
   MEMBERS
------------------------- */

    for (const member of members) {
      const existing = await SpaceDayRegistration.findOne({
        eventType,
        $or: [
          { "members.rollNumber": member.rollNumber },
          { "members.email": member.email },
          { "members.phone": member.phone },
        ],
      });

      if (existing) {
        let type = "";

        if (existing.members.some((m) => m.rollNumber === member.rollNumber)) {
          type = "rollNumber";
        } else if (existing.members.some((m) => m.email === member.email)) {
          type = "email";
        } else if (existing.members.some((m) => m.phone === member.phone)) {
          type = "phone";
        }

        return res.json({
          success: true,
          exists: true,
          type,
          member: member.fullName,
          message: `${type} already registered.`,
        });
      }
    }

    return res.json({
      success: true,
      exists: false,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================================
   DOWNLOAD ACKNOWLEDGEMENT
============================================ */

exports.downloadAcknowledgement = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await SpaceDayRegistration.findOne({
      registrationId,
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found.",
      });
    }

    const pdf = await generateAcknowledgement(registration);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${registration.registrationId}.pdf`,
      "Content-Length": pdf.length,
    });

    return res.send(pdf);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================================
   GET ALL REGISTRATIONS
============================================ */

exports.getRegistrations = async (req, res) => {
  try {
    const registrations = await SpaceDayRegistration.find({
      paymentStatus: "Verified",
    }).sort({
      createdAt: -1,
    });
    return res.json({
      success: true,
      registrations,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================
   GET REGISTRATION STATUS
============================================ */

exports.getRegistrationStatus = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await SpaceDayRegistration.findOne({
      registrationId,
    })
      .populate("members.attendance.markedBy", "username name")
      .lean();

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found.",
      });
    }

    return res.json({
      success: true,
      registration,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================
   MARK ATTENDANCE
========================================== */

exports.markAttendance = async (req, res) => {
  try {
    const settings = await EventSettings.findOne({
      event: "space-day",
    });

    if (!settings || !settings.attendanceOpen) {
      return res.status(403).json({
        success: false,
        message: "Attendance is currently closed.",
      });
    }
    const { registrationId, memberIndex } = req.body;

    const registration = await SpaceDayRegistration.findOne({
      registrationId,
    });

    const Admin = require("../models/admin");

    const AdminAccess = require("../models/AdminAccess");

    let admin = await AdminAccess.findById(req.user.id);

    let adminName = "Main Admin";
    let adminRole = "superadmin";

    if (admin) {
      adminName = admin.username;
      adminRole = admin.role || "admin";
    } else {
      const mainAdmin = await Admin.findById(req.user.id);

      if (!mainAdmin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found.",
        });
      }

      adminName = mainAdmin.email;
    }

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found.",
      });
    }

    if (registration.paymentStatus !== "Verified") {
      return res.status(403).json({
        success: false,
        message: "Registration is not verified.",
      });
    }

    if (memberIndex < 0 || memberIndex >= registration.members.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid member.",
      });
    }

    const member = registration.members[memberIndex];

    if (member.attendance?.present) {
      return res.json({
        success: true,
        alreadyPresent: true,
        attendance: member.attendance,
      });
    }

    member.attendance = {
      present: true,
      markedAt: new Date(),
      markedBy: req.user.id,
    };

    registration.markModified("members");

    await registration.save();

    await AttendanceLog.create({
      registrationId: registration.registrationId,

      eventType: registration.eventType,

      teamName: registration.teamName,

      memberName: member.fullName,

      rollNumber: member.rollNumber,

      memberIndex,

      markedBy: adminName,

      action: "MARK",

      markedAt: member.attendance.markedAt,
    });

    const { getIO } = require("../socket");

    getIO().emit("attendanceUpdated", {
      registrationId,

      memberIndex,

      attendance: member.attendance,

      memberName: member.fullName,

      eventType: registration.eventType,

      teamName: registration.teamName,

      markedBy: adminName,
    });

    const updatedRegistration = await SpaceDayRegistration.findOne({
      registrationId,
    }).lean();

    return res.json({
      success: true,
      message: "Attendance marked successfully.",
      attendance: member.attendance,
      registration: updatedRegistration,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to mark attendance.",
    });
  }
};

/* ==========================================
   GET REGISTRATION FOR ADMIN
========================================== */

exports.getRegistrationForAttendance = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await SpaceDayRegistration.findOne({
      registrationId,
    })
      .populate("members.attendance.markedBy", "username")
      .lean();

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found.",
      });
    }

    if (registration.paymentStatus !== "Verified") {
      return res.status(403).json({
        success: false,
        message: "Registration is not verified.",
      });
    }

    return res.json({
      success: true,
      registration,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================
   ATTENDANCE SUMMARY
========================================== */

exports.getAttendanceSummary = async (req, res) => {
  try {
    const registrations = await SpaceDayRegistration.find({
      paymentStatus: "Verified",
    }).lean();

    let registered = 0;
    let present = 0;

    registrations.forEach((registration) => {
      registered += registration.members.length;

      registration.members.forEach((member) => {
        if (member.attendance?.present) {
          present++;
        }
      });
    });

    return res.json({
      success: true,
      registered,
      present,
      absent: registered - present,
      percentage:
        registered === 0
          ? 0
          : Number(((present / registered) * 100).toFixed(1)),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================
   GET ATTENDANCE LOGS
========================================== */

exports.getAttendanceLogs = async (req, res) => {
  try {
    const logs = await AttendanceLog.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({
      success: true,
      logs,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.exportAttendanceExcel = async (req, res) => {
  try {
    const registrations = await SpaceDayRegistration.find({
      paymentStatus: "Verified",
    })
      .populate("members.attendance.markedBy", "username")
      .lean();

    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet("Attendance");

    sheet.columns = [
      { header: "Registration ID", key: "registrationId", width: 20 },
      { header: "Event", key: "event", width: 20 },
      { header: "Team", key: "team", width: 25 },
      { header: "Member", key: "member", width: 25 },
      { header: "Roll Number", key: "roll", width: 18 },
      { header: "Department", key: "department", width: 15 },
      { header: "Year", key: "year", width: 10 },
      { header: "Payment", key: "payment", width: 15 },
      { header: "Attendance", key: "attendance", width: 15 },
      { header: "Time", key: "time", width: 18 },
      { header: "Marked By", key: "markedBy", width: 20 },
    ];

    registrations.forEach((registration) => {
      registration.members.forEach((member) => {
        sheet.addRow({
          registrationId: registration.registrationId,
          event: registration.eventType,
          team:
            registration.registrationType === "team"
              ? registration.teamName
              : "-",
          member: member.fullName,
          roll: member.rollNumber,
          department: member.department,
          year: member.year,
          payment: registration.paymentStatus,
          attendance: member.attendance?.present ? "Present" : "Absent",
          time: member.attendance?.markedAt
            ? new Date(member.attendance.markedAt).toLocaleString()
            : "-",
          markedBy: member.attendance?.markedBy?.username || "-",
        });
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="SpaceDayAttendance.xlsx"',
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.bulkAttendance = async (req, res) => {
  try {
    const { getIO } = require("../socket");
    const Admin = require("../models/admin");
    const AdminAccess = require("../models/AdminAccess");

    const { registrationId, memberIndexes } = req.body;

    const settings = await EventSettings.findOne({
      event: "space-day",
    });

    if (!settings || !settings.attendanceOpen) {
      return res.status(403).json({
        success: false,
        message: "Attendance is currently closed.",
      });
    }

    const registration = await SpaceDayRegistration.findOne({
      registrationId,
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found.",
      });
    }

    if (registration.paymentStatus !== "Verified") {
      return res.status(403).json({
        success: false,
        message: "Registration is not verified.",
      });
    }

    let admin = await AdminAccess.findById(req.user.id);

    let adminName = "Main Admin";

    if (admin) {
      adminName = admin.username;
    } else {
      const mainAdmin = await Admin.findById(req.user.id);

      if (!mainAdmin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found.",
        });
      }

      adminName = mainAdmin.email;
    }

    const updatedMembers = [];

    for (const index of memberIndexes) {
      const member = registration.members[index];

      if (!member) continue;

      if (member.attendance?.present) continue;

      member.attendance = {
        present: true,
        markedAt: new Date(),
        markedBy: req.user.id,
      };

      updatedMembers.push({
        memberIndex: index,
        attendance: member.attendance,
        memberName: member.fullName,
      });

      await AttendanceLog.create({
        registrationId: registration.registrationId,
        eventType: registration.eventType,
        teamName: registration.teamName,
        memberName: member.fullName,
        rollNumber: member.rollNumber,
        memberIndex: index,
        markedBy: adminName,
        action: "MARK",
        markedAt: member.attendance.markedAt,
      });

      getIO().emit("attendanceUpdated", {
        registrationId,
        memberIndex: index,
        attendance: member.attendance,
        memberName: member.fullName,
        eventType: registration.eventType,
        teamName: registration.teamName,
        markedBy: adminName,
      });
    }

    registration.markModified("members");

    await registration.save();

    getIO().emit("attendanceBulkUpdated", {
      registrationId,
      updatedMembers,
      eventType: registration.eventType,
      teamName: registration.teamName,
      markedBy: adminName,
    });

    return res.json({
      success: true,
      registration,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.removeAttendance = async (req, res) => {
  try {
    const { getIO } = require("../socket");
    const Admin = require("../models/admin");
    const AdminAccess = require("../models/AdminAccess");

    const { registrationId, memberIndex } = req.body;

    let admin = await AdminAccess.findById(req.user.id);

    let adminName = "Main Admin";
    let adminRole = "superadmin";

    if (admin) {
      adminName = admin.username;
      adminRole = admin.role || "admin";
    } else {
      const mainAdmin = await Admin.findById(req.user.id);

      if (!mainAdmin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found.",
        });
      }

      adminName = mainAdmin.email;
    }

    if (adminRole !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can remove attendance.",
      });
    }

    const registration = await SpaceDayRegistration.findOne({
      registrationId,
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found.",
      });
    }

    if (registration.paymentStatus !== "Verified") {
      return res.status(403).json({
        success: false,
        message: "Registration is not verified.",
      });
    }

    const member = registration.members[memberIndex];

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      });
    }

    if (!member.attendance?.present) {
      return res.status(400).json({
        success: false,
        message: "Attendance already removed.",
      });
    }

    member.attendance = {
      present: false,
      markedAt: null,
      markedBy: null,
    };

    registration.markModified("members");

    await registration.save();

    await AttendanceLog.create({
      registrationId: registration.registrationId,
      eventType: registration.eventType,
      teamName: registration.teamName,
      memberName: member.fullName,
      rollNumber: member.rollNumber,
      memberIndex,
      markedBy: adminName,
      action: "REMOVE",
      markedAt: new Date(),
    });

    getIO().emit("attendanceRemoved", {
      registrationId,
      memberIndex,
      attendance: member.attendance,
      memberName: member.fullName,
      eventType: registration.eventType,
      teamName: registration.teamName,
      removedBy: adminName,
    });

    const updatedRegistration = await SpaceDayRegistration.findOne({
      registrationId,
    }).lean();

    return res.json({
      success: true,
      message: "Attendance removed successfully.",
      registration: updatedRegistration,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMissingParticipants = async (req, res) => {
  try {
    const registrations = await SpaceDayRegistration.find({
      paymentStatus: "Verified",
    });

    const missing = [];

    registrations.forEach((registration) => {
      registration.members.forEach((member, index) => {
        if (member.attendance?.present) return;

        missing.push({
          registrationId: registration.registrationId,

          eventType: registration.eventType,

          registrationType: registration.registrationType,

          teamName: registration.teamName,

          memberIndex: index,

          fullName: member.fullName,

          rollNumber: member.rollNumber,

          email: member.email,

          phone: member.phone,

          department: member.department,

          year: member.year,
        });
      });
    });
    return res.json({
      success: true,
      total: missing.length,
      participants: missing,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
