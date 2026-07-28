import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const submitSpaceDayRegistration = async (
  registration: any,
  paymentScreenshot: File
) => {
  const formData = new FormData();

  formData.append(
    "registration",
    JSON.stringify(registration)
  );

  formData.append(
    "paymentScreenshot",
    paymentScreenshot
  );

  const response = await API.post(
    "/api/space-day/register",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

/* ==========================================
   CHECK TEAM NAME / MEMBERS
========================================== */

export const checkMembers = async (
  eventType: string,
  teamName: string,
  members: any[]
) => {
  const response = await API.post(
    "/api/space-day/check-members",
    {
      eventType,
      teamName,
      members,
    }
  );

  return response.data;
};

export const checkIndividual = async (
  eventType: string,
  participant: any
) => {
  const response = await API.post(
    "/api/space-day/check-members",
    {
      eventType,
      members: [participant],
    }
  );

  return response.data;
};

export const getRegistrationStatus = async (
  registrationId: string
) => {
  const response = await API.get(
    `/api/space-day/status/${registrationId}`
  );

  return response.data;
};