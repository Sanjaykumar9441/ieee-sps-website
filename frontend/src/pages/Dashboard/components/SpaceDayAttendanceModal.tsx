import { X, Check } from "lucide-react";  
import {  
  markAttendance,  
  bulkAttendance,  
  removeAttendance,  
} from "../../../services/spaceDayRegistrationService";  
import { useEffect, useState } from "react";  
import toast from "react-hot-toast";

interface Props {  
  registration: any;  
  onClose: () => void;  
}

export default function SpaceDayAttendanceModal({  
  registration,  
  onClose,  
}: Props) {  
  const [currentRegistration, setCurrentRegistration] = useState(registration);  
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);  
  const [successMessage, setSuccessMessage] = useState("");  
  const isSuperAdmin = localStorage.getItem("role") === "superadmin";  
  const [removeMemberIndex, setRemoveMemberIndex] = useState<number | null>(  
    null,  
  );

  const [removing, setRemoving] = useState(false);

  useEffect(() => {  
    setCurrentRegistration(registration);  
    setSelectedMembers([]);  
  }, [registration]);

  if (successMessage) {  
    return (  
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50">  
        <div className="mx-4 w-full max-w-sm rounded-3xl bg-white p-8 sm:p-12 text-center shadow-2xl">  
          <div className="text-6xl">✅</div>

          <h2 className="mt-6 text-3xl font-bold text-[#1C1B22]">Attendance Updated</h2>

          <p className="mt-3 text-[#8A8578]">{successMessage}</p>

          <p className="mt-6 text-sm text-[#B5B1A8]">Returning to Scanner...</p>  
        </div>  
      </div>  
    );  
  }

  if (!currentRegistration) return null;

  return (  
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4 sm:p-6">  
      <div className="flex w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl max-h-[90vh]">  
        {/* Header */}  
        <div className="flex items-center justify-between border-b border-[#EBE8E2] p-6 shrink-0">  
          <div>  
            <h2 className="text-2xl font-bold text-[#1C1B22]">Attendance</h2>

            <p className="text-[#8A8578] mt-1">  
              {currentRegistration.registrationId}  
            </p>  
          </div>

          <button  
            onClick={onClose}  
            className="rounded-xl p-2 hover:bg-[#FAF9F7]"  
          >  
            <X size={22} />  
          </button>  
        </div>

        {/* Registration Details */}  
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 border-b border-[#EBE8E2] p-6 shrink-0">  
          <div>  
            <p className="text-sm text-[#8A8578]">Event</p>

            <p className="font-semibold text-[#1C1B22]">{currentRegistration.eventType}</p>  
          </div>

          <div>  
            <p className="text-sm text-[#8A8578]">Registration Type</p>

            <p className="font-semibold text-[#1C1B22]">  
              {currentRegistration.registrationType}  
            </p>  
          </div>

          {currentRegistration.registrationType === "team" && (  
            <div>  
              <p className="text-sm text-[#8A8578]">Team Name</p>

              <p className="font-semibold text-[#1C1B22]">{currentRegistration.teamName}</p>  
            </div>  
          )}

          <div>  
            <p className="text-sm text-[#8A8578]">Payment</p>

            <p className="font-semibold text-[#1C1B22]">{currentRegistration.paymentStatus}</p>  
          </div>  
        </div>

        {currentRegistration.registrationType === "team" && (  
          <div className="border-b border-[#EBE8E2] p-6 flex justify-end shrink-0">  
            <button  
              onClick={async () => {  
                try {  
                  let indexes = selectedMembers;

                  if (indexes.length === 0) {  
                    indexes = currentRegistration.members  
                      .map((_: any, i: number) => i)  
                      .filter(  
                        (i: number) =>  
                          !currentRegistration.members[i].attendance?.present,  
                      );  
                  }

                  if (indexes.length === 0) {  
                    toast.success("Entire team already present.");  
                    return;  
                  }

                  await bulkAttendance(  
                    currentRegistration.registrationId,  
                    indexes,  
                  );

                  setSuccessMessage(`${indexes.length} Members Marked Present`);

                  setTimeout(() => {  
                    setSuccessMessage("");  
                    onClose();  
                  }, 2000);  
                } catch (err) {  
                  console.error(err);  
                  toast.error("Unable to mark attendance.");  
                }  
              }}  
              className="w-full sm:w-auto rounded-xl bg-[#7C6FEF] px-6 py-3 font-semibold text-white hover:bg-[#6C5FE0] transition"  
            >  
              {selectedMembers.length === 0  
                ? "Mark Entire Team"  
                : `Mark Selected (${selectedMembers.length})`}  
            </button>  
          </div>  
        )}

        {/* Members */}  
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">  
          {currentRegistration.members.map((member: any, index: number) => (  
            <div key={index} className="rounded-2xl border border-[#EBE8E2] p-5">  
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">  
                {/* Left Side */}  
                <div className="flex-1">  
                  <h3 className="text-lg font-semibold text-[#1C1B22]">{member.fullName}</h3>

                  <p className="text-[#8A8578]">{member.rollNumber}</p>

                  <p className="text-[#8A8578]">{member.email}</p>

                  <p className="text-[#8A8578]">{member.phone}</p>

                  <p className="text-[#8A8578]">  
                    {member.department} • Year {member.year}  
                  </p>  
                </div>  
                {currentRegistration.registrationType === "team" &&  
                  !member.attendance?.present && (  
                    <input  
                      type="checkbox"  
                      checked={selectedMembers.includes(index)}  
                      onChange={(e) => {  
                        if (e.target.checked) {  
                          setSelectedMembers((prev) => [...prev, index]);  
                        } else {  
                          setSelectedMembers((prev) =>  
                            prev.filter((i) => i !== index),  
                          );  
                        }  
                      }}  
                      className="mt-2 h-5 w-5 accent-[#7C6FEF]"  
                    />  
                  )}  
                {/* Right Side */}  
                <div className="flex items-start w-full sm:w-auto sm:shrink-0">  
                  {member.attendance?.present ? (  
                    <div className="w-full sm:w-auto rounded-xl bg-green-100 px-4 py-2 font-semibold text-green-700">  
                      <div className="flex items-center gap-2">  
                        <Check size={18} />  
                        Present  
                      </div>

                      {isSuperAdmin && (  
                        <button  
                          onClick={() => {  
                            setRemoveMemberIndex(index);  
                          }}  
                          className="mt-3 text-xs font-semibold text-[#DC3D3D] hover:underline"  
                        >  
                          Remove Attendance  
                        </button>  
                      )}

                      <p className="mt-1 text-xs">  
                        {member.attendance.markedAt  
                          ? new Date(  
                              member.attendance.markedAt,  
                            ).toLocaleTimeString()  
                          : ""}  
                      </p>  
                    </div>  
                  ) : (  
                    <button  
                      onClick={async () => {  
                        try {  
                          const result = await markAttendance(  
                            currentRegistration.registrationId,  
                            index,  
                          );

                          // Already present  
                          if (result.alreadyPresent) {  
                            toast.success(  
                              `Already Present\\n${new Date(  
                                result.attendance.markedAt,  
                              ).toLocaleTimeString()}`,  
                            );  
                            return;  
                          }

                          // Successfully marked  
                          setSuccessMessage(  
                            `${member.fullName} Marked Present`,  
                          );

                          setTimeout(() => {  
                            setSuccessMessage("");

                            onClose();  
                          }, 2000);  
                        } catch (err) {  
                          console.error(err);  
                          toast.error("Unable to mark attendance.");  
                        }  
                      }}  
                      className="w-full sm:w-auto rounded-xl bg-[#7C6FEF] px-5 py-3 font-semibold text-white hover:bg-[#6C5FE0] transition"  
                    >  
                      Mark Present  
                    </button>  
                  )}  
                </div>  
              </div>  
            </div>  
          ))}  
        </div>  
      </div>  
      {removeMemberIndex !== null && (  
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">  
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">  
            <h2 className="text-xl font-bold text-[#DC3D3D]">  
              Remove Attendance  
            </h2>

            <p className="mt-4 text-[#8A8578]">  
              Are you sure you want to remove attendance for  
            </p>

            <p className="mt-2 font-semibold text-[#1C1B22]">  
              {currentRegistration.members[removeMemberIndex].fullName}  
            </p>

            <p className="text-sm text-[#8A8578]">  
              {currentRegistration.members[removeMemberIndex].rollNumber}  
            </p>

            <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">  
              <button  
                onClick={() => setRemoveMemberIndex(null)}  
                className="w-full sm:w-auto rounded-xl border border-[#EBE8E2] px-5 py-2 text-[#1C1B22] hover:bg-[#FAF9F7] transition"  
              >  
                Cancel  
              </button>

              <button  
                disabled={removing}  
                onClick={async () => {  
                  try {  
                    setRemoving(true);

                    await removeAttendance(  
                      currentRegistration.registrationId,  
                      removeMemberIndex!,  
                    );

                    toast.success("Attendance removed.");

                    setRemoveMemberIndex(null);  
                    onClose();  
                  } catch (err) {  
                    console.error(err);  
                    toast.error("Unable to remove attendance.");  
                  } finally {  
                    setRemoving(false);  
                  }  
                }}  
                className="w-full sm:w-auto rounded-xl bg-[#DC3D3D] px-5 py-2 text-white hover:bg-[#A32D2D] transition disabled:opacity-50"  
              >  
                {removing ? "Removing..." : "Remove Attendance"}  
              </button>  
            </div>  
          </div>  
        </div>  
      )}  
    </div>  
  );  
}