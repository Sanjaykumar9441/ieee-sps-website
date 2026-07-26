import { useState } from "react";
import toast from "react-hot-toast";
import SpaceDayImagePreviewModal from "./SpaceDayImagePreviewModal";
import { updatePaymentStatus } from "../../../../api/spaceDayAdmin";
import { SpaceDayRegistration } from "../../../../components/spaceDay/registration/types";

interface Props {
  registration: SpaceDayRegistration;
  onStatusChanged: () => void;
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>

      <h4 className="mt-1 text-base font-semibold">{value || "-"}</h4>
    </div>
  );
}

export default function PaymentTab({ registration, onStatusChanged }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleVerify = async () => {
    console.log("Verify clicked");
    alert("Verify clicked");

    try {
      setLoading(true);

      await updatePaymentStatus(registration.registrationId, "Verified");

      onStatusChanged();

      toast.success("Payment Verified");
    } catch (err) {
      console.error(err);
      toast.error(
        (err as any).response?.data?.message || "Verification Failed",
      );
    } finally {
      setLoading(false);
    }
  };
  const handleReject = async () => {
    try {
      setLoading(true);

      await updatePaymentStatus(registration.registrationId, "Rejected");
      onStatusChanged();
      toast.success("Payment Rejected");
    } catch (err) {
      toast.error((err as any).response?.data?.message || "Request Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Payment Information */}

      <div className="rounded-2xl border bg-white shadow-sm p-6">
        <h3 className="text-xl font-bold mb-6">Payment Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Info label="Transaction ID" value={registration.transactionId} />

          <Info label="Payment Status" value={registration.paymentStatus} />

          <Info
            label="Registration Fee"
            value={`₹${registration.registrationFee}`}
          />

          <Info
            label="Accommodation Fee"
            value={`₹${registration.accommodationFee}`}
          />

          <Info label="Total Paid" value={`₹${registration.totalFee}`} />

          <Info
            label="Submitted On"
            value={new Date(registration.createdAt).toLocaleString()}
          />
        </div>

        {registration.paymentStatus === "Pending" && (
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleReject}
              disabled={loading}
              className="rounded-xl bg-red-600 px-6 py-3 text-white disabled:opacity-60"
            >
              {loading ? "Updating..." : "Reject"}
            </button>

            <button
              onClick={handleVerify}
              disabled={loading}
              className="rounded-xl bg-green-600 px-6 py-3 text-white disabled:opacity-60"
            >
              {loading ? "Updating..." : "Verify Payment"}
            </button>
          </div>
        )}
      </div>

      {/* Screenshot */}

      <div className="rounded-2xl border bg-white shadow-sm p-6">
        <h3 className="text-xl font-bold mb-5">Payment Screenshot</h3>

        <div onClick={() => setPreviewOpen(true)} className="cursor-pointer">
          <img
            src={registration.paymentScreenshot}
            alt="Payment Screenshot"
            className="rounded-xl border w-full max-w-md transition hover:opacity-90"
          />
        </div>
      </div>
      {previewOpen && (
        <SpaceDayImagePreviewModal
          image={registration.paymentScreenshot}
          title="Payment Screenshot"
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}
