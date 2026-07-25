import { registrationConfig } from "../registrationConfig";
import { EventType } from "../types";
import { calculateFees } from "../components/feeCalculator";
import { eventThemes } from "../eventTheme";
import { paymentDetails } from "../data/paymentConfig";

interface IndividualPaymentProps {
  eventType: EventType;
  formData: any;

  updateField: (field: string, value: any) => void;

  onBack: () => void;
  onSubmit: () => void;
}

export default function IndividualPayment({
  eventType,
  formData,
  updateField,
  onBack,
  onSubmit,
}: IndividualPaymentProps) {
  const config = registrationConfig[eventType];
  const theme = eventThemes[eventType];
  const fees = calculateFees({
    eventFee: config.eventFee,
    feeType: config.feeType as "student" | "team",
    accommodationFee: config.accommodationFee,
    teamSize: 1,
    accommodation: formData.accommodation,
    arrivalDate: formData.arrivalDate,
    departureDate: formData.departureDate,
  });
  const canSubmit =
    formData.transactionId?.trim() && formData.paymentScreenshot;
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      <div className={`h-2 bg-gradient-to-r ${theme.gradient}`} />

      <div className="p-8 md:p-10">
        <h2 className="text-3xl font-bold text-slate-900">Payment</h2>

        <div
          className={`mt-3 h-1 w-24 rounded-full bg-gradient-to-r ${theme.gradient}`}
        />

        <p className={`mt-3 font-medium ${theme.text}`}>
          Complete your registration by making the payment.
        </p>

        <div
          className={`mt-10 rounded-2xl border ${theme.border} ${theme.light} p-6`}
        >
          <h3 className="text-xl font-semibold mb-4">Fee Summary</h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Registration Fee</span>
              <span>₹{fees.registrationFee}</span>
            </div>

            {formData.accommodation && (
              <>
                <div className="flex justify-between">
                  <span>Accommodation Days</span>
                  <span>{fees.numberOfDays}</span>
                </div>

                <div className="flex justify-between">
                  <span>Accommodation</span>
                  <span>₹{fees.accommodationTotal}</span>
                </div>
              </>
            )}

            <div
              className={`border-t pt-3 flex justify-between text-xl font-bold ${theme.text}`}
            >
              <span>Grand Total</span>
              <span>₹{fees.total}</span>
            </div>
          </div>
        </div>
        {/* Bank Details */}

        <div
          className={`mt-8 rounded-2xl border ${theme.border} ${theme.light} p-6 shadow-sm`}
        >
          <h3 className="text-xl font-bold mb-5">Bank Details</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Bank Name</p>
              <p className="font-semibold">{paymentDetails.bankName}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-1">Account Number</p>

              <div className="flex items-center gap-2">
                <p className="font-semibold font-mono tracking-wider">
                  {paymentDetails.accountNumber}
                </p>

                <button
                  type="button"
                  onClick={() => copyToClipboard(paymentDetails.accountNumber)}
                  className={`text-xs px-2 py-1 rounded-md border ${theme.border} ${theme.text} hover:bg-white transition`}
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-1">IFSC Code</p>

              <div className="flex items-center gap-2">
                <p className="font-semibold font-mono">
                  {paymentDetails.ifscCode}
                </p>

                <button
                  type="button"
                  onClick={() => copyToClipboard(paymentDetails.ifscCode)}
                  className={`text-xs px-2 py-1 rounded-md border ${theme.border} ${theme.text} hover:bg-white transition`}
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500">Account Name</p>
              <p className="font-semibold">{paymentDetails.accountName}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm text-slate-500">Branch</p>
              <p className="font-semibold">{paymentDetails.branch}</p>
            </div>
          </div>
        </div>

        {/* Payment Instructions */}

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h4 className="mb-2 font-semibold text-amber-800">
            Payment Instructions
          </h4>

          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>
              Transfer the exact registration amount to the above bank account.
            </li>
            <li>After successful payment, note the UTR Number.</li>
            <li>Upload a clear payment screenshot.</li>
            <li>
              Registration will be confirmed only after payment verification.
            </li>
          </ul>
        </div>

        {/* Payment Details */}

        <div className="mt-10">
          <h3 className="mb-6 text-xl font-bold">Payment Details</h3>

          <div className="grid gap-6">
            <div>
              <label className="mb-2 block font-medium">
                 UTR Number
              </label>

              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                minLength={12}
                maxLength={22}
                required
                autoComplete="off"
                value={formData.transactionId || ""}
                onChange={(e) =>
                  updateField("transactionId", e.target.value.replace(/\D/g, ""))
                }
                placeholder="Enter UTR Number"
                className={`
          w-full
          rounded-xl
          border
          px-4
          py-3
          outline-none
          transition
          ${theme.border}
          ${theme.ring}
          focus:ring-2
        `}
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Payment Screenshot
              </label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) =>
                  updateField("paymentScreenshot", e.target.files?.[0] || null)
                }
                className={`
          w-full
          rounded-xl
          border
          px-4
          py-3
          outline-none
          transition
          ${theme.border}
          ${theme.ring}
          focus:ring-2
        `}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-12">
          <button
            onClick={onBack}
            className={`
  rounded-xl
  border
  ${theme.border}
  ${theme.text}
  ${theme.light}
  px-6
  py-3
  font-medium
  transition
  hover:shadow-md
`}
          >
            ← Back
          </button>

          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className={`
  rounded-xl
  bg-gradient-to-r
  ${theme.gradient}
  px-8
  py-3
  font-semibold
  text-white
  shadow-lg
  transition-all
  duration-300
  hover:scale-105
`}
          >
            Submit Registration
          </button>
        </div>
      </div>
    </div>
  );
}
