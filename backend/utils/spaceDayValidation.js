const spaceDayConfig = require("../config/spaceDayConfig");
/* ===========================================
   EMAIL
=========================================== */

const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/* ===========================================
   PHONE
=========================================== */

const validatePhone = (phone) => {
  return /^[6-9]\d{9}$/.test(phone);
};

/* ===========================================
   REQUIRED
=========================================== */

const required = (value) => {
  return (
    value !== undefined && value !== null && value.toString().trim() !== ""
  );
};

/* ===========================================
   DUPLICATE VALUES INSIDE TEAM
=========================================== */

const hasDuplicate = (members, field) => {
  const values = members
    .map((member) => member[field]?.trim().toLowerCase())
    .filter(Boolean);

  return new Set(values).size !== values.length;
};

/* ===========================================
   VALIDATE REGISTRATION
=========================================== */

const validateRegistration = (data) => {
  const errors = [];

  const config = spaceDayConfig[data.eventType];

  if (!config) {
    errors.push("Invalid Event Type.");
    return errors;
  }

  /* -----------------------
     Event
  ----------------------- */

  if (!required(data.eventType)) errors.push("Event Type is required.");

  /* -----------------------
     Team
  ----------------------- */

  if (config.registrationType === "team") {
    if (!required(data.teamName)) errors.push("Team Name is required.");

    if (
      Number(data.teamSize) < config.minTeamSize ||
      Number(data.teamSize) > config.maxTeamSize
    ) {
      errors.push(
        `Team size must be between ${config.minTeamSize} and ${config.maxTeamSize}.`,
      );
    }
  }

  /* -----------------------
   Theme
----------------------- */

  if (config.requiresTheme && !required(data.selectedTheme)) {
    errors.push("Please select a prototype theme.");
  }

  /* -----------------------
     Members
  ----------------------- */

  if (!Array.isArray(data.members) || data.members.length === 0) {
    errors.push("Members are required.");
  } else {
    data.members.forEach((member, index) => {
      if (!required(member.fullName))
        errors.push(`Member ${index + 1}: Full Name required.`);

      if (!required(member.rollNumber))
        errors.push(`Member ${index + 1}: Roll Number required.`);

      if (!validateEmail(member.email))
        errors.push(`Member ${index + 1}: Invalid Email.`);

      if (!validatePhone(member.phone))
        errors.push(`Member ${index + 1}: Invalid Phone.`);

      if (!required(member.department))
        errors.push(`Member ${index + 1}: Department required.`);

      if (!required(member.year))
        errors.push(`Member ${index + 1}: Year required.`);

      if (!required(member.college))
        errors.push(`Member ${index + 1}: College required.`);

      if (member.college === "Other") {
        if (!required(member.otherCollege))
          errors.push(`Member ${index + 1}: College Name required.`);

        if (!required(member.otherCollegeCity))
          errors.push(`Member ${index + 1}: City required.`);

        if (!required(member.otherCollegeDistrict))
          errors.push(`Member ${index + 1}: District required.`);

        if (!required(member.otherCollegeState))
          errors.push(`Member ${index + 1}: State required.`);

        if (!required(member.otherCollegePincode))
          errors.push(`Member ${index + 1}: Pincode required.`);
      }
    });
    /* -----------------------
      DUPLICATE MEMBERS
    ----------------------- */

    if (hasDuplicate(data.members, "rollNumber")) {
      errors.push("Duplicate Roll Numbers are not allowed.");
    }

    if (hasDuplicate(data.members, "email")) {
      errors.push("Duplicate Email Addresses are not allowed.");
    }

    if (hasDuplicate(data.members, "phone")) {
      errors.push("Duplicate Phone Numbers are not allowed.");
    }
  }

  /* -----------------------
     Accommodation
  ----------------------- */

  if (data.accommodation) {
    if (!required(data.arrivalDate)) errors.push("Arrival Date required.");

    if (!required(data.arrivalTime)) errors.push("Arrival Time required.");

    if (!required(data.departureDate)) errors.push("Departure Date required.");

    if (!required(data.departureTime)) errors.push("Departure Time required.");
  }

  /* -----------------------
     Payment
  ----------------------- */

  if (!required(data.transactionId)) errors.push("Transaction ID required.");

  return errors;
};

module.exports = {
  validateRegistration,
  hasDuplicate,
};
