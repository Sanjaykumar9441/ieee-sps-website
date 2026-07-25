import {
  validateRequired,
  validateRollNumber,
  validateEmail,
  validatePhone,
} from "./validation";

export const validateIndividualForm = (formData: any) => {
  const errors: Record<string, string> = {};

  if (!validateRequired(formData.fullName))
    errors.fullName0 = "Full Name is required.";

  if (!validateRequired(formData.gender))
    errors.gender0 = "Select Gender.";

  if (!validateRollNumber(formData.rollNumber))
    errors.rollNumber0 = "Enter a valid Roll Number.";

  if (!validateEmail(formData.email))
    errors.email0 = "Enter a valid Email Address.";

  if (!validatePhone(formData.phone))
    errors.phone0 = "Enter a valid 10-digit Mobile Number.";

   if (!validateRequired(formData.department))
    errors.department0 = "Select Department.";

  if (!formData.department)
    errors.department0 = "Select Department.";

  if (!formData.year)
    errors.year0 = "Select Year.";

  if (!formData.college)
    errors.college0 = "Select College.";

  if (formData.college === "Other") {
  if (!(formData.otherCollege ?? "").trim()) {
    errors.otherCollege0 = "College Name is required.";
  }

  if (!(formData.otherCollegeCity ?? "").trim()) {
    errors.otherCollegeCity0 = "City / Town is required.";
  }

  if (!(formData.otherCollegeDistrict ?? "").trim()) {
    errors.otherCollegeDistrict0 = "District is required.";
  }

  if (!(formData.otherCollegeState ?? "").trim()) {
    errors.otherCollegeState0 = "State is required.";
  }

  if (!(formData.otherCollegePincode ?? "").trim()) {
    errors.otherCollegePincode0 = "PIN Code is required.";
  }
}

  /* ==========================
     ACCOMMODATION VALIDATION
  ========================== */

  if (formData.accommodation) {
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