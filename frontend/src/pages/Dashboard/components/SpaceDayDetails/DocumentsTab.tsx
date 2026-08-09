import { useState } from "react";
import SpaceDayImagePreviewModal from "./SpaceDayImagePreviewModal";
import { SpaceDayRegistration } from "../../../../components/spaceDay/registration/types";
import axios from "axios";
import toast from "react-hot-toast";
import { saveAs } from "file-saver";

interface Props {
  registration: SpaceDayRegistration;
}

export default function DocumentsTab({ registration }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const downloadAcknowledgement = async () => {
    if (isDownloading) return;

    setIsDownloading(true);

    const toastId = toast.loading("Preparing acknowledgement...");

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/space-day/acknowledgement/${registration.registrationId}`,
        {
          responseType: "blob",
        },
      );

      saveAs(
        response.data,
        `National-Space-Day-2026-${registration.registrationId}.pdf`,
      );

      toast.success("Acknowledgement downloaded successfully!", {
        id: toastId,
      });
    } catch (error) {
      console.error(error);

      toast.error("Failed to download acknowledgement.", {
        id: toastId,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (isResending) return;

    setIsResending(true);

    const toastId = toast.loading("Resending verification email...");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/space-day/resend-verification-email/${registration.registrationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success(
        response.data?.message || "Verification email sent successfully!",
        {
          id: toastId,
        },
      );
    } catch (error: any) {
      console.error("Resend email error:", error);

      toast.error(
        error.response?.data?.message || "Failed to resend verification email.",
        {
          id: toastId,
        },
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Registration Documents */}

      <div
        className="rounded-2xl border border-[#EBE8E2] bg-white"
        style={{
          boxShadow:
            "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)",
        }}
      >
        <div className="border-b border-[#EBE8E2] px-6 py-5">
          <h3 className="text-2xl font-bold text-[#1C1B22]">Documents</h3>

          <p className="mt-1 text-[#8A8578]">
            Download or preview registration related documents.
          </p>
        </div>

        <div className="divide-y divide-[#EBE8E2]">
          {/* Acknowledgement */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5">
            <div>
              <h4 className="font-semibold text-lg text-[#1C1B22]">
                📄 Registration Acknowledgement
              </h4>

              <p className="text-sm text-[#8A8578] mt-1">
                Generated immediately after successful registration.
              </p>
            </div>

            <button
              onClick={downloadAcknowledgement}
              disabled={isDownloading}
              className="w-full sm:w-auto shrink-0 rounded-xl bg-[#7C6FEF] px-5 py-2 text-white hover:bg-[#6C5FE0] transition disabled:opacity-60"
            >
              {isDownloading ? "Downloading..." : "Download"}
            </button>
          </div>

          {/* Screenshot */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5">
            <div>
              <h4 className="font-semibold text-lg text-[#1C1B22]">
                🖼 Payment Screenshot
              </h4>

              <p className="text-sm text-[#8A8578] mt-1">
                Uploaded by participant.
              </p>
            </div>

            <button
              onClick={() => setPreviewOpen(true)}
              className="w-full sm:w-auto shrink-0 rounded-xl border border-[#EBE8E2] px-5 py-2 text-[#1C1B22] hover:bg-[#FAF9F7] transition"
            >
              Preview
            </button>
          </div>

          {/* Email */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5">
            <div>
              <h4 className="font-semibold text-lg text-[#1C1B22]">
                📧 Confirmation Email
              </h4>

              <p className="text-sm text-[#8A8578] mt-1">
                {registration.paymentStatus === "Verified"
                  ? "Verification email was sent to the team leader with other members in CC."
                  : "Will be sent automatically after payment verification."}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Email Status */}

              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  registration.paymentStatus === "Verified"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {registration.paymentStatus === "Verified" ? "Sent" : "Pending"}
              </span>

              {/* Resend */}

              {registration.paymentStatus === "Verified" && (
                <button
                  onClick={resendVerificationEmail}
                  disabled={isResending}
                  className="rounded-xl bg-[#00629B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004E7C] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isResending ? "Resending..." : "Resend"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Future Documents */}

      <div
        className="rounded-2xl border border-[#EBE8E2] bg-white"
        style={{
          boxShadow:
            "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)",
        }}
      >
        <div className="border-b border-[#EBE8E2] px-6 py-5">
          <h3 className="text-2xl font-bold text-[#1C1B22]">
            Upcoming Documents
          </h3>
        </div>

        <div className="divide-y divide-[#EBE8E2]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5">
            <div>
              <h4 className="font-semibold text-[#1C1B22]">
                🎓 Participation Certificate
              </h4>

              <p className="text-sm text-[#8A8578] mt-1">
                Available after the completion of National Space Day.
              </p>
            </div>

            <span className="shrink-0 self-start sm:self-auto rounded-full bg-[#EBE8E2] px-4 py-2 text-[#8A8578]">
              Coming Soon
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5">
            <div>
              <h4 className="font-semibold text-[#1C1B22]">
                🏆 Winner Certificate
              </h4>

              <p className="text-sm text-[#8A8578] mt-1">
                Available only for winning teams.
              </p>
            </div>

            <span className="shrink-0 self-start sm:self-auto rounded-full bg-[#EBE8E2] px-4 py-2 text-[#8A8578]">
              If Applicable
            </span>
          </div>
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
