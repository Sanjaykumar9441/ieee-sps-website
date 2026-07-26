import { SpaceDayRegistration } from "../../../../components/spaceDay/registration/types";

interface Props {
  registration: SpaceDayRegistration;
}

function Info({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div>
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <h4 className="mt-1 text-base font-semibold">
        {value || "-"}
      </h4>
    </div>
  );
}

export default function PaymentTab({
  registration,
}: Props) {
  return (
    <div className="space-y-8">

      {/* Payment Information */}

      <div className="rounded-2xl border bg-white shadow-sm p-6">

        <h3 className="text-xl font-bold mb-6">
          Payment Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Info
            label="Transaction ID"
            value={registration.transactionId}
          />

          <Info
            label="Payment Status"
            value={registration.paymentStatus}
          />

          <Info
            label="Registration Fee"
            value={`₹${registration.registrationFee}`}
          />

          <Info
            label="Accommodation Fee"
            value={`₹${registration.accommodationFee}`}
          />

          <Info
            label="Total Paid"
            value={`₹${registration.totalFee}`}
          />

          <Info
            label="Submitted On"
            value={new Date(
              registration.createdAt
            ).toLocaleString()}
          />

        </div>

      </div>

      {/* Screenshot */}

      <div className="rounded-2xl border bg-white shadow-sm p-6">

        <h3 className="text-xl font-bold mb-5">
          Payment Screenshot
        </h3>

        <a
          href={registration.paymentScreenshot}
          target="_blank"
          rel="noreferrer"
        >
          <img
            src={registration.paymentScreenshot}
            alt="Payment Screenshot"
            className="rounded-xl border w-full max-w-md cursor-pointer hover:opacity-90 transition"
          />
        </a>

      </div>

    </div>
  );
}