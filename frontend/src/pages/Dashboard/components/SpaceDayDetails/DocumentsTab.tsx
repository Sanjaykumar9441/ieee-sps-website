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

  return (
    <div className="space-y-6">
      {/* Registration Documents */}

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-6 py-5">
          <h3 className="text-2xl font-bold">Documents</h3>

          <p className="mt-1 text-slate-500">
            Download or preview registration related documents.
          </p>
        </div>

        <div className="divide-y">
          {/* Acknowledgement */}

          <div className="flex items-center justify-between px-6 py-5">
            <div>
              <h4 className="font-semibold text-lg">
                📄 Registration Acknowledgement
              </h4>

              <p className="text-sm text-slate-500 mt-1">
                Generated immediately after successful registration.
              </p>
            </div>

            <button
              onClick={downloadAcknowledgement}
              disabled={isDownloading}
              className="rounded-xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isDownloading ? "Downloading..." : "Download"}
            </button>
          </div>

          {/* Screenshot */}

          <div className="flex items-center justify-between px-6 py-5">
            <div>
              <h4 className="font-semibold text-lg">🖼 Payment Screenshot</h4>

              <p className="text-sm text-slate-500 mt-1">
                Uploaded by participant.
              </p>
            </div>

            <button
              onClick={() => setPreviewOpen(true)}
              className="rounded-xl border px-5 py-2 hover:bg-slate-100"
            >
              Preview
            </button>
          </div>

          {/* Email */}

          <div className="flex items-center justify-between px-6 py-5">
            <div>
              <h4 className="font-semibold text-lg">📧 Confirmation Email</h4>

              <p className="text-sm text-slate-500 mt-1">
                {registration.paymentStatus === "Verified"
                  ? "Confirmation email has been sent."
                  : "Will be sent automatically after payment verification."}
              </p>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold
        ${
          registration.paymentStatus === "Verified"
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
            >
              {registration.paymentStatus === "Verified" ? "Sent" : "Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* Future Documents */}

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-6 py-5">
          <h3 className="text-2xl font-bold">Upcoming Documents</h3>
        </div>

        <div className="divide-y">
          <div className="flex justify-between px-6 py-5">
            <div>
              <h4 className="font-semibold">🎓 Participation Certificate</h4>

              <p className="text-sm text-slate-500 mt-1">
                Available after the completion of National Space Day.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-500">
              Coming Soon
            </span>
          </div>

          <div className="flex justify-between px-6 py-5">
            <div>
              <h4 className="font-semibold">🏆 Winner Certificate</h4>

              <p className="text-sm text-slate-500 mt-1">
                Available only for winning teams.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-500">
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
