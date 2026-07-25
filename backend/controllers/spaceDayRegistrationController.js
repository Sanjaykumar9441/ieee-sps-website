const SpaceDayRegistration = require("../models/SpaceDayRegistration");
const generateRegistrationId = require("../utils/spaceDayRegistrationId");
const { validateRegistration } = require("../utils/spaceDayValidation");
const calculateFees = require("../utils/spaceDayFeeCalculator");
const spaceDayConfig = require("../config/spaceDayConfig");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

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
    const { members } = req.body;

    if (!members || !Array.isArray(members)) {
      return res.status(400).json({
        success: false,
        message: "Members are required.",
      });
    }

    for (const member of members) {
      const existing = await SpaceDayRegistration.findOne({
        $or: [
          { "members.rollNumber": member.rollNumber },
          { "members.email": member.email },
          { "members.phone": member.phone },
        ],
      });

      if (existing) {
        return res.json({
          success: true,
          exists: true,
          message: `Member ${member.fullName} is already registered.`,
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