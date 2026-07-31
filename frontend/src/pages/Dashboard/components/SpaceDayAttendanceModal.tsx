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
        <div className="rounded-3xl bg-white p-12 text-center shadow-2xl">
          <div className="text-6xl">✅</div>

          <h2 className="mt-6 text-3xl font-bold">Attendance Updated</h2>

          <p className="mt-3 text-slate-600">{successMessage}</p>

          <p className="mt-6 text-sm text-slate-400">Returning to Scanner...</p>
        </div>
      </div>
    );
  }

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

        {currentRegistration.registrationType === "team" && (
          <div className="border-b p-6 flex justify-end">
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
              className="rounded-xl bg-[#00629B] px-6 py-3 font-semibold text-white hover:bg-[#004E7C]"
            >
              {selectedMembers.length === 0
                ? "Mark Entire Team"
                : `Mark Selected (${selectedMembers.length})`}
            </button>
          </div>
        )}

        {/* Members */}
        <div className="max-h-[420px] overflow-y-auto p-6 space-y-5">
          {currentRegistration.members.map((member: any, index: number) => (
            <div key={index} className="rounded-2xl border p-5">
              <div className="flex items-start gap-5">
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
                      className="mt-2 h-5 w-5 accent-[#00629B]"
                    />
                  )}
                {/* Right Side */}
                <div className="flex items-start shrink-0">
                  {member.attendance?.present ? (
                    <div className="rounded-xl bg-green-100 px-4 py-2 font-semibold text-green-700">
                      <div className="flex items-center gap-2">
                        <Check size={18} />
                        Present
                      </div>

                      {isSuperAdmin && (
                        <button
                          onClick={() => {
                            setRemoveMemberIndex(index);
                          }}
                          className="mt-3 text-xs font-semibold text-red-600 hover:underline"
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
                              `Already Present\n${new Date(
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
      {removeMemberIndex !== null && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-red-600">
              Remove Attendance
            </h2>

            <p className="mt-4 text-slate-600">
              Are you sure you want to remove attendance for
            </p>

            <p className="mt-2 font-semibold">
              {currentRegistration.members[removeMemberIndex].fullName}
            </p>

            <p className="text-sm text-slate-500">
              {currentRegistration.members[removeMemberIndex].rollNumber}
            </p>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setRemoveMemberIndex(null)}
                className="rounded-xl border px-5 py-2"
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
                className="rounded-xl bg-red-600 px-5 py-2 text-white hover:bg-red-700"
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
