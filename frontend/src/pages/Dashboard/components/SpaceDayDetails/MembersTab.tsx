import { Member, SpaceDayRegistration } from "../../../../components/spaceDay/registration/types";

interface Props {  
   registration: SpaceDayRegistration;  
}

export default function MembersTab({ registration }: Props) {  
  return (  
    <div className="space-y-6">  
      {registration.members.map((member: Member, index: number) => (  
        <div  
          key={index}  
          className="rounded-2xl border border-[#EBE8E2] bg-white overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}  
        >  
          <div className="bg-[#FAF9F7] border-b border-[#EBE8E2] px-6 py-4">  
            <h3 className="text-lg font-bold text-[#1C1B22]">  
              Member {index + 1}  
            </h3>  
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">

            <Info label="Full Name" value={member.fullName} />  
            <Info label="Gender" value={member.gender} />  
            <Info label="Roll Number" value={member.rollNumber} />  
            <Info label="Email" value={member.email} />  
            <Info label="Phone" value={member.phone} />  
            <Info label="Department" value={member.department} />  
            <Info label="Year" value={member.year} />

            <Info  
              label="College"  
              value={  
                member.college === "Other"  
                  ? member.otherCollege  
                  : member.college  
              }  
            />

            {member.college === "Other" && (  
              <>  
                <Info  
                  label="City"  
                  value={member.otherCollegeCity}  
                />

                <Info  
                  label="District"  
                  value={member.otherCollegeDistrict}  
                />

                <Info  
                  label="State"  
                  value={member.otherCollegeState}  
                />

                <Info  
                  label="Pincode"  
                  value={member.otherCollegePincode}  
                />  
              </>  
            )}  
          </div>  
        </div>  
      ))}  
    </div>  
  );  
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
      <p className="text-sm text-[#8A8578]">  
        {label}  
      </p>

      <h4 className="mt-1 text-base font-semibold text-[#1C1B22]">  
        {value || "-"}  
      </h4>  
    </div>  
  );  
}