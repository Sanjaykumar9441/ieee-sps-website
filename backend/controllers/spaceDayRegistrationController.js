const SpaceDayRegistration = require("../models/SpaceDayRegistration");
const generateRegistrationId = require("../utils/spaceDayRegistrationId");
const { validateRegistration } = require("../utils/spaceDayValidation");
const calculateFees = require("../utils/spaceDayFeeCalculator");
const spaceDayConfig = require("../config/spaceDayConfig");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const generateAcknowledgement = require("../pdf/generateAcknowledgement");

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
    } = registrationData;
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

    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        `SpaceDay${process.env.SPACE_DAY_YEAR}/Payments`,
      );

      paymentScreenshot = uploadResult.secure_url;
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

      registrationFee: fees.registrationFee,

      accommodationFee: fees.accommodationFee,

      totalFee: fees.totalFee,
    });

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
    const registrations = await SpaceDayRegistration.find()
      .sort({ createdAt: -1 });

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