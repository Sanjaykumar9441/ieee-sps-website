import axios from "axios";

export const updatePaymentStatus = async (
  registrationId: string,
  paymentStatus: "Verified" | "Rejected",
) => {
  const token = localStorage.getItem("token");

  const res = await axios.put(
    `${import.meta.env.VITE_API_URL}/api/space-day/admin/payment/${registrationId}`,
    { paymentStatus },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};

export const exportRegistrations = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/api/space-day/export/excel`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob",
    }
  );

  return response.data;
};