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
      <p className="text-sm text-[#8A8578]">{label}</p>

      <h4 className="mt-1 text-base font-semibold text-[#1C1B22]">  
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
      <div className="rounded-2xl border border-[#EBE8E2] bg-[#FAF9F7] p-10 text-center">  
        <h3 className="text-xl font-bold text-[#1C1B22]">  
          Accommodation Not Required  
        </h3>

        <p className="mt-2 text-[#8A8578]">  
          This participant/team has not requested accommodation.  
        </p>  
      </div>  
    );  
  }

  return (  
    <div className="space-y-8">

      <div className="rounded-2xl border border-[#EBE8E2] bg-white p-6" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>

        <h3 className="text-xl font-bold mb-6 text-[#1C1B22]">  
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
        <div className="rounded-2xl border border-[#EBE8E2] bg-white p-6" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>

          <h3 className="text-xl font-bold mb-6 text-[#1C1B22]">  
            Members Staying  
          </h3>

          <div className="space-y-3">

            {registration.members.map(  
              (member: Member, index: number) => (  
                <div  
                  key={index}  
                  className="flex justify-between rounded-lg border border-[#EBE8E2] p-4"  
                >  
                  <span className="text-[#1C1B22]">{member.fullName}</span>

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