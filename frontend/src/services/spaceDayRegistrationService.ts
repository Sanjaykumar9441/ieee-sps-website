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

export const getAttendanceRegistration = async (
  registrationId: string
) => {
  const token = localStorage.getItem("token");

  const response = await API.get(
    `/api/space-day/attendance/${registrationId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const markAttendance = async (
  registrationId: string,
  memberIndex: number
) => {
  const token = localStorage.getItem("token");

  const response = await API.post(
    "/api/space-day/attendance",
    {
      registrationId,
      memberIndex,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const getAttendanceLogs = async () => {
  const token = localStorage.getItem("token");

  const response = await API.get(
    "/api/space-day/attendance/logs",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const exportAttendanceExcel = async () => {
   const token = localStorage.getItem("token"); 
   const response = await API.get(
    "/api/space-day/attendance/export",
    {
       headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

/* ==========================================
   EVENT SETTINGS
========================================== */

export const getEventSettings = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/api/space-day/settings`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const updateAttendanceStatus = async (
  attendanceOpen: boolean
) => {
  const token = localStorage.getItem("token");

  const response = await axios.patch(
    `${import.meta.env.VITE_API_URL}/api/space-day/settings/attendance`,
    {
      attendanceOpen,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const bulkAttendance = async (
  registrationId: string,
  memberIndexes: number[],
) => {
  const token = localStorage.getItem("token");

  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/space-day/attendance/bulk`,
    {
      registrationId,
      memberIndexes,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
};

export const removeAttendance = async (
  registrationId: string,
  memberIndex: number,
) => {
  const token = localStorage.getItem("token");

  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/space-day/attendance/remove`,
    {
      registrationId,
      memberIndex,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
};

export const getMissingParticipants =
  async () => {

    const token =
      localStorage.getItem("token");

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/space-day/attendance/missing`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
};