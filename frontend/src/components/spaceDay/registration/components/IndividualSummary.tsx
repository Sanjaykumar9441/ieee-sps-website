import { registrationConfig } from "../registrationConfig";
import { EventType } from "../types";
import { calculateFees } from "../components/feeCalculator";
import { eventThemes } from "../eventTheme";

interface IndividualSummaryProps {
  eventType: EventType;
  formData: any;

  onBack: () => void;
  onNext: () => void;
}

export default function IndividualSummary({
  eventType,
  formData,
  onBack,
  onNext,
}: IndividualSummaryProps) {
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

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      <div className={`h-2 bg-gradient-to-r ${theme.gradient}`} />

      <div className="p-8 md:p-10">
        <h2 className="text-3xl font-bold text-slate-900">
          Registration Summary
        </h2>

        <div
          className={`mt-3 h-1 w-40 rounded-full bg-gradient-to-r ${theme.gradient}`}
        />

        <p className={`mt-3 font-medium ${theme.text}`}>
          Please verify your details before payment.
        </p>

        <div className="mt-10 border rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4">Participant Details</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <p>
              <strong>Name:</strong> {formData.fullName}
            </p>

            <p>
              <strong>Gender:</strong> {formData.gender}
            </p>

            <p>
              <strong>Roll Number:</strong> {formData.rollNumber}
            </p>

            <p>
              <strong>Email:</strong> {formData.email}
            </p>

            <p>
              <strong>Phone:</strong> {formData.phone}
            </p>

            <p>
              <strong>Department:</strong> {formData.department}
            </p>

            <p>
              <strong>Year:</strong> {formData.year}
            </p>

            {formData.college === "Other" ? (
              <>
                <p>
                  <strong>College:</strong> {formData.otherCollege}
                </p>

                <p>
                  <strong>City / Town:</strong> {formData.otherCollegeCity}
                </p>

                <p>
                  <strong>District:</strong> {formData.otherCollegeDistrict}
                </p>

                <p>
                  <strong>State:</strong> {formData.otherCollegeState}
                </p>

                <p>
                  <strong>PIN Code:</strong> {formData.otherCollegePincode}
                </p>
              </>
            ) : (
              <p>
                <strong>College:</strong> {formData.college}
              </p>
            )}
          </div>
        </div>
        <div className="mt-8 border rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4">Accommodation</h3>

          {formData.accommodation ? (
            <div className="space-y-2">
              <p>
                <strong>Arrival:</strong> {formData.arrivalDate}{" "}
                {formData.arrivalTime}
              </p>

              <p>
                <strong>Departure:</strong> {formData.departureDate}{" "}
                {formData.departureTime}
              </p>
            </div>
          ) : (
            <p>No accommodation required.</p>
          )}
        </div>

        <div
          className={`mt-8 rounded-2xl border ${theme.border} ${theme.light} p-6`}
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
                  <span>Accommodation Fee</span>
                  <span>₹{fees.accommodationTotal}</span>
                </div>
              </>
            )}

            <hr />

            <div
              className={`flex justify-between text-xl font-bold ${theme.text}`}
            >
              <span>Total Amount</span>
              <span>₹{fees.total}</span>
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
            onClick={onNext}
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
            Proceed to Payment →
          </button>
        </div>
      </div>
    </div>
  );
}
