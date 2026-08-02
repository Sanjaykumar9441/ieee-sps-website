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
      <p className="text-sm text-[#8A8578]">{label}</p>

      <h4 className="mt-1 text-base font-semibold text-[#1C1B22]">{value || "-"}</h4>  
    </div>  
  );  
}

export default function PaymentTab({ registration, onStatusChanged }: Props) {  
  const [previewOpen, setPreviewOpen] = useState(false);  
  const [loading, setLoading] = useState(false);  
  const handleVerify = async () => {  
    try {  
      setLoading(true);

      await updatePaymentStatus(registration.registrationId, "Verified");  
      onStatusChanged();  
      toast.success("Payment Verified");  
      setTimeout(() => {  
        window.dispatchEvent(new Event("close-space-day-modal"));  
      }, 300);  
    } catch (err) {  
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

      <div className="rounded-2xl border border-[#EBE8E2] bg-white p-6" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
        <h3 className="text-xl font-bold mb-6 text-[#1C1B22]">Payment Information</h3>

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
          <div className="flex flex-col sm:flex-row gap-4 mt-8">  
            <button  
              onClick={handleReject}  
              disabled={loading}  
              className="rounded-xl bg-[#DC3D3D] px-6 py-3 text-white hover:bg-[#A32D2D] transition disabled:opacity-60"  
            >  
              {loading ? "Updating..." : "Reject"}  
            </button>

            <button  
              onClick={handleVerify}  
              disabled={loading}  
              className="rounded-xl bg-emerald-600 px-6 py-3 text-white hover:bg-emerald-700 transition disabled:opacity-60"  
            >  
              {loading ? "Updating..." : "Verify Payment"}  
            </button>  
          </div>  
        )}  
      </div>

      {/* Screenshot */}

      <div className="rounded-2xl border border-[#EBE8E2] bg-white p-6" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
        <h3 className="text-xl font-bold mb-5 text-[#1C1B22]">Payment Screenshot</h3>

        <div onClick={() => setPreviewOpen(true)} className="cursor-pointer">  
          <img  
            src={registration.paymentScreenshot}  
            alt="Payment Screenshot"  
            className="rounded-xl border border-[#EBE8E2] w-full max-w-md transition hover:opacity-90"  
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