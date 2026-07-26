import { Member, SpaceDayRegistration } from "../../../../components/spaceDay/registration/types";

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
      <p className="text-sm text-slate-500">{label}</p>

      <h4 className="mt-1 text-base font-semibold">
        {value || "-"}
      </h4>
    </div>
  );
}

export default function AccommodationTab({
  registration,
}: Props) {
  if (!registration.accommodation) {
    return (
      <div className="rounded-2xl border bg-slate-50 p-10 text-center">
        <h3 className="text-xl font-bold text-slate-700">
          Accommodation Not Required
        </h3>

        <p className="mt-2 text-slate-500">
          This participant/team has not requested accommodation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <div className="rounded-2xl border bg-white shadow-sm p-6">

        <h3 className="text-xl font-bold mb-6">
          Accommodation Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Info
            label="Arrival Date"
            value={registration.arrivalDate}
          />

          <Info
            label="Arrival Time"
            value={registration.arrivalTime}
          />

          <Info
            label="Departure Date"
            value={registration.departureDate}
          />

          <Info
            label="Departure Time"
            value={registration.departureTime}
          />

          <Info
            label="Accommodation Fee"
            value={`₹${registration.accommodationFee}`}
          />

        </div>

      </div>

      {registration.registrationType === "team" && (
        <div className="rounded-2xl border bg-white shadow-sm p-6">

          <h3 className="text-xl font-bold mb-6">
            Members Staying
          </h3>

          <div className="space-y-3">

            {registration.members.map(
              (member: Member, index: number) => (
                <div
                  key={index}
                  className="flex justify-between rounded-lg border p-4"
                >
                  <span>{member.fullName}</span>

                  <span>
                    {registration.accommodationMembers?.[
                      index
                    ]
                      ? "✅ Staying"
                      : "❌ Not Staying"}
                  </span>
                </div>
              )
            )}

          </div>

        </div>
      )}

    </div>
  );
}