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