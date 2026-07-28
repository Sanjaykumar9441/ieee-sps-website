import { X, Check } from "lucide-react";
import { markAttendance } from "../../../services/spaceDayRegistrationService";
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

  useEffect(() => {
    setCurrentRegistration(registration);
  }, [registration]);
  if (!currentRegistration) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-6">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-2xl font-bold">Attendance</h2>

            <p className="text-slate-500 mt-1">
              {currentRegistration.registrationId}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-slate-100"
          >
            <X size={22} />
          </button>
        </div>

        {/* Registration Details */}
        <div className="grid grid-cols-2 gap-6 border-b p-6">
          <div>
            <p className="text-sm text-slate-500">Event</p>

            <p className="font-semibold">{currentRegistration.eventType}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Registration Type</p>

            <p className="font-semibold">
              {currentRegistration.registrationType}
            </p>
          </div>

          {currentRegistration.registrationType === "team" && (
            <div>
              <p className="text-sm text-slate-500">Team Name</p>

              <p className="font-semibold">{currentRegistration.teamName}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-slate-500">Payment</p>

            <p className="font-semibold">{currentRegistration.paymentStatus}</p>
          </div>
        </div>

        {/* Members */}
        <div className="max-h-[420px] overflow-y-auto p-6 space-y-5">
          {currentRegistration.members.map((member: any, index: number) => (
            <div key={index} className="rounded-2xl border p-5">
              <div className="flex justify-between items-start gap-6">
                {/* Left Side */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{member.fullName}</h3>

                  <p className="text-slate-600">{member.rollNumber}</p>

                  <p className="text-slate-600">{member.email}</p>

                  <p className="text-slate-600">{member.phone}</p>

                  <p className="text-slate-600">
                    {member.department} • Year {member.year}
                  </p>
                </div>

                {/* Right Side */}
                <div className="flex items-start shrink-0">
                  {member.attendance?.present ? (
                    <div className="rounded-xl bg-green-100 px-4 py-2 font-semibold text-green-700">
                      <div className="flex items-center gap-2">
                        <Check size={18} />
                        Present
                      </div>

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
                              `Already Present\n${new Date(
                                result.attendance.markedAt,
                              ).toLocaleTimeString()}`,
                            );
                            return;
                          }

                          // Successfully marked
                          onClose();
                        } catch (err) {
                          console.error(err);
                          toast.error("Unable to mark attendance.");
                        }
                      }}
                      className="rounded-xl bg-[#00629B] px-5 py-3 font-semibold text-white hover:bg-[#004E7C]"
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
    </div>
  );
}
