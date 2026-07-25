import {
  validateRequired,
  validateRollNumber,
  validateEmail,
  validatePhone,
  hasDuplicate,
} from "./validation";

import { EventType } from "../types";

export const validateTeamForm = (
  formData: any,
  teamSize: number,
  eventType: EventType
) => {
  const errors: Record<string, string> = {};

  if (!validateRequired(formData.teamName)) {
    errors.teamName = "Team Name is required.";
  }

  if (
  eventType === "astromodeler" &&
  !formData.selectedTheme
) {
  errors.selectedTheme =
    "Please select a prototype theme.";
}

  formData.members
    .slice(0, teamSize)
    .forEach((member: any, index: number) => {

      if (!validateRequired(member.fullName))
  errors[`fullName${index}`] = "Full Name is required.";

      if (!validateRequired(member.gender))
  errors[`gender${index}`] = "Select Gender.";

      if (!validateRollNumber(member.rollNumber))
  errors[`rollNumber${index}`] = "Enter a valid Roll Number.";

      if (!validateEmail(member.email))
  errors[`email${index}`] = "Enter a valid Email Address.";

     if (!validatePhone(member.phone))
  errors[`phone${index}`] = "Enter a valid 10-digit Mobile Number.";
      if (!member.department)
        errors[`department${index}`] = "Select Department.";

      if (!member.year)
        errors[`year${index}`] = "Select Year.";

      if (!member.college)
        errors[`college${index}`] = "Select College.";

      if (member.college === "Other") {

  if (!member.otherCollege?.trim()) {
    errors[`otherCollege${index}`] = "College Name is required.";
  }

  if (!member.otherCollegeCity?.trim()) {
    errors[`otherCollegeCity${index}`] = "City / Town is required.";
  }

  if (!member.otherCollegeDistrict?.trim()) {
    errors[`otherCollegeDistrict${index}`] = "District is required.";
  }

  if (!member.otherCollegeState?.trim()) {
    errors[`otherCollegeState${index}`] = "State is required.";
  }

  if (!member.otherCollegePincode?.trim()) {
    errors[`otherCollegePincode${index}`] = "PIN Code is required.";
  }
}
    });

    const members = formData.members.slice(0, teamSize);

if (hasDuplicate(members, "rollNumber")) {
  errors["duplicateRoll"] =
    "Duplicate Roll Numbers are not allowed.";
}

if (hasDuplicate(members, "email")) {
  errors["duplicateEmail"] =
    "Duplicate Email Addresses are not allowed.";
}

if (hasDuplicate(members, "phone")) {
  errors["duplicatePhone"] =
    "Duplicate Phone Numbers are not allowed.";
}

/* ==========================
   ACCOMMODATION VALIDATION
========================== */

if (formData.accommodation) {
  if (
  !formData.accommodationMembers ||
  !formData.accommodationMembers.some(
    (selected: boolean) => selected
  )
) {
  errors.accommodationMembers =
    "Select at least one member for hostel accommodation.";
}
  if (!formData.arrivalDate) {
    errors.arrivalDate = "Arrival Date is required.";
  }

  if (!formData.arrivalTime) {
    errors.arrivalTime = "Arrival Time is required.";
  }

  if (!formData.departureDate) {
    errors.departureDate = "Departure Date is required.";
  }

  if (!formData.departureTime) {
    errors.departureTime = "Departure Time is required.";
  }

  if (
    formData.arrivalDate &&
    formData.arrivalTime &&
    formData.departureDate &&
    formData.departureTime
  ) {
    const arrivalDate = new Date(formData.arrivalDate);
    const departureDate = new Date(formData.departureDate);

    if (departureDate <= arrivalDate) {
      errors.departureDate =
        "Departure date must be after the arrival date.";
      }
  }
}
  return errors;
};

