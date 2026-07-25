export const validateRequired = (value: string) => {
  return value.trim().length > 0;
};

export const validateEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

export const validatePhone = (phone: string) => {
  const regex = /^[6-9]\d{9}$/;
  return regex.test(phone.trim());
};

export const validateRollNumber = (roll: string) => {
  return roll.trim().length > 0;
};

export const hasDuplicate = (
  members: any[],
  field: "rollNumber" | "email" | "phone"
) => {
  const values = members
    .map((m) => String(m[field] ?? "").trim().toLowerCase())
    .filter(Boolean);

  return new Set(values).size !== values.length;
};

