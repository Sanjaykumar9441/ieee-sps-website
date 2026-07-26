import { SpaceDayRegistration } from "../../../../components/spaceDay/registration/types";

interface Props {
  registration: SpaceDayRegistration;
}

export default function DocumentsTab({
  registration,
}: Props) {
  const downloadAcknowledgement = () => {
    window.open(
      `${import.meta.env.VITE_API_URL}/api/space-day/acknowledgement/${registration.registrationId}`,
      "_blank"
    );
  };

  return (
    <div className="space-y-6">

      {/* Registration Documents */}

      <div className="rounded-2xl border bg-white shadow-sm p-6">

        <h3 className="text-xl font-bold mb-6">
          Registration Documents
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <button
            onClick={downloadAcknowledgement}
            className="rounded-xl border bg-blue-600 text-white p-5 text-left hover:bg-blue-700 transition"
          >
            <h4 className="text-lg font-semibold">
              📄 Acknowledgement
            </h4>

            <p className="mt-1 text-sm text-blue-100">
              Download registration acknowledgement PDF.
            </p>
          </button>

          <a
            href={registration.paymentScreenshot}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border bg-slate-100 p-5 hover:bg-slate-200 transition"
          >
            <h4 className="text-lg font-semibold">
              🖼 Payment Screenshot
            </h4>

            <p className="mt-1 text-sm text-slate-600">
              Open uploaded payment proof.
            </p>
          </a>

        </div>

      </div>

      {/* Future Documents */}

      <div className="rounded-2xl border border-dashed bg-slate-50 p-6">

        <h3 className="text-xl font-bold mb-4">
          Future Documents
        </h3>

        <div className="space-y-3">

          <div className="flex justify-between border rounded-lg p-4">
            <span>Participation Certificate</span>
            <span className="text-slate-400">
              Available After Event
            </span>
          </div>

          <div className="flex justify-between border rounded-lg p-4">
            <span>Winner Certificate</span>
            <span className="text-slate-400">
              Available If Applicable
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}