import axios from "axios";

export const updatePaymentStatus = async (
  registrationId: string,
  paymentStatus: "Verified" | "Rejected",
) => {
  const res = await axios.put(
    `${import.meta.env.VITE_API_URL}/api/space-day/admin/payment/${registrationId}`,
    {
      paymentStatus,
    },
  );

  return res.data;
};