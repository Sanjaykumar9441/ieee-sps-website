import { registrationConfig } from "../registrationConfig";
import { EventType } from "../types";
import { calculateFees } from "../components/feeCalculator";
import { astroModelerThemes } from "../data/themeConfig";
import { eventThemes } from "../eventTheme";

interface TeamSummaryProps {
  eventType: EventType;
  teamSize: 2 | 3;
  formData: any;
  onBack: () => void;
  onNext: () => void;
}

export default function TeamSummary({
  eventType,
  teamSize,
  formData,
  onBack,
  onNext,
}: TeamSummaryProps) {
  const config = registrationConfig[eventType];
  const theme = eventThemes[eventType];
  const fees = calculateFees({
    eventFee: config.eventFee,
    feeType: config.feeType as "student" | "team",

    accommodationFee: config.accommodationFee,

    teamSize,

    accommodation: formData.accommodation,
    accommodationMembers: formData.accommodationMembers,

    arrivalDate: formData.arrivalDate,
    departureDate: formData.departureDate,
  });
  const selectedTheme = astroModelerThemes.find(
    (theme) => theme.id === formData.selectedTheme,
  );
  const stayingMembers =
    formData.accommodationMembers?.filter(Boolean).length || 0;
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

        <p className="text-slate-500 mt-2">
          Please verify all information before proceeding to payment.
        </p>

        {/* Team */}

        <div className="mt-10 border rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">Team Information</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500">Team Name</span>

              <p className="font-semibold">{formData.teamName}</p>
            </div>

            <div>
              <span className="text-slate-500">Team Size</span>

              <p className="font-semibold">{teamSize} Members</p>
            </div>
          </div>
        </div>

        {/* Members */}

        <div className="mt-8 space-y-4">
          {formData.members
            .slice(0, teamSize)
            .map((member: any, index: number) => (
              <div key={index} className="border rounded-2xl p-5">
                <h4 className="font-bold mb-3">Member {index + 1}</h4>

                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>Name:</strong> {member.fullName}
                  </div>
                  <div>
                    <strong>Roll:</strong> {member.rollNumber}
                  </div>
                  <div>
                    <strong>Email:</strong> {member.email}
                  </div>
                  <div>
                    <strong>Phone:</strong> {member.phone}
                  </div>
                  <div>
                    <strong>Department:</strong> {member.department}
                  </div>
                  <div>
                    <strong>Year:</strong> {member.year}
                  </div>
                  {member.college === "Other" ? (
                    <>
                      <div>
                        <strong>College:</strong> {member.otherCollege}
                      </div>

                      <div>
                        <strong>City:</strong> {member.otherCollegeCity}
                      </div>

                      <div>
                        <strong>District:</strong> {member.otherCollegeDistrict}
                      </div>

                      <div>
                        <strong>State:</strong> {member.otherCollegeState}
                      </div>

                      <div>
                        <strong>PIN Code:</strong> {member.otherCollegePincode}
                      </div>
                    </>
                  ) : (
                    <div>
                      <strong>College:</strong> {member.college}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>

        {eventType === "astromodeler" && (
          <div
            className={`mt-8 rounded-2xl border ${theme.border} ${theme.light} p-6`}
          >
            <h3 className="text-xl font-bold mb-4">Prototype Theme</h3>

            <p className={`font-semibold ${theme.text}`}>
              {selectedTheme
                ? `${selectedTheme.title}: ${selectedTheme.subtitle}`
                : "-"}
            </p>
          </div>
        )}

        {/* Accommodation */}

        <div
          className={`mt-8 rounded-2xl border ${theme.border} ${theme.light} p-6`}
        >
          <h3 className="font-bold mb-4">Accommodation</h3>

          <p>{formData.accommodation ? "Yes" : "No"}</p>

          {formData.accommodation && (
            <div className="mt-4 text-sm space-y-2">
              <p>
                <strong>Arrival:</strong> {formData.arrivalDate}{" "}
                {formData.arrivalTime}
              </p>

              <p>
                <strong>Departure:</strong> {formData.departureDate}{" "}
                {formData.departureTime}
              </p>
            </div>
          )}
        </div>

        {/* Fee */}

        <div
          className={`mt-8 rounded-2xl border ${theme.border} ${theme.light} p-6`}
        >
          <h3 className="text-xl font-bold mb-5">Fee Summary</h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Registration Fee</span>
              <span>₹{fees.registrationFee}</span>
            </div>

            {formData.accommodation && (
              <>
                <div className="flex justify-between">
                  <span>Students Staying</span>
                  <span>{stayingMembers}</span>
                </div>

                <div className="flex justify-between">
                  <span>Accommodation Days</span>
                  <span>{fees.numberOfDays}</span>
                </div>

                <div className="flex justify-between">
                  <span>
                    Accommodation ({stayingMembers} × ₹{config.accommodationFee}{" "}
                    × {fees.numberOfDays} day{fees.numberOfDays > 1 ? "s" : ""})
                  </span>
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

        {/* Buttons */}

        <div className="flex justify-between mt-10">
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
            ← Edit Details
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
            Continue to Payment →
          </button>
        </div>
      </div>
    </div>
  );
}
