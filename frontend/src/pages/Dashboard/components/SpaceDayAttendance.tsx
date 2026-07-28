import { useEffect, useState } from "react";
import axios from "axios";
import QRScanner from "./QRScanner";
import { getAttendanceRegistration } from "../../../services/spaceDayRegistrationService";
import SpaceDayAttendanceModal from "./SpaceDayAttendanceModal";
import { socket } from "../../../lib/socket";

export default function SpaceDayAttendance() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);

  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);

  const fetchRegistrations = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/space-day/registrations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setRegistrations(res.data.registrations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    socket.on("attendanceUpdated", (data) => {
      setRegistrations((prev) =>
        prev.map((registration) => {
          if (registration.registrationId !== data.registrationId) {
            return registration;
          }

          const updatedMembers = [...registration.members];

          updatedMembers[data.memberIndex] = {
            ...updatedMembers[data.memberIndex],
            attendance: data.attendance,
          };

          return {
            ...registration,
            members: updatedMembers,
          };
        }),
      );

      setSelectedRegistration((prev: any) => {
        if (!prev || prev.registrationId !== data.registrationId) {
          return prev;
        }

        const updatedMembers = [...prev.members];

        updatedMembers[data.memberIndex] = {
          ...updatedMembers[data.memberIndex],
          attendance: data.attendance,
        };

        return {
          ...prev,
          members: updatedMembers,
        };
      });
    });

    return () => {
      socket.off("attendanceUpdated");
    };
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  if (loading) {
    return <div className="p-10 text-center">Loading registrations...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Space Day Attendance</h1>

        <p className="text-slate-500 mt-1">
          Scan participant QR codes or manage attendance manually.
        </p>
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={() => setScannerOpen(true)}
          className="rounded-xl bg-[#00629B] px-5 py-3 font-semibold text-white hover:bg-[#004E7C]"
        >
          📷 Scan QR
        </button>
      </div>
      {scannerOpen && (
        <div className="mb-8 rounded-2xl border bg-white p-6 shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Scan Registration QR</h2>

            <button
              onClick={() => setScannerOpen(false)}
              className="rounded-lg border px-4 py-2 hover:bg-slate-100"
            >
              Close
            </button>
          </div>

          <QRScanner
            onScan={async (registrationId) => {
              if (selectedRegistration) return;

              try {
                const data = await getAttendanceRegistration(registrationId);

                setSelectedRegistration(data.registration);
              } catch (err) {
                console.error(err);
              }
            }}
          />
        </div>
      )}
      <SpaceDayAttendanceModal
        registration={selectedRegistration}
        onClose={() => setSelectedRegistration(null)}
      />

      <div className="rounded-2xl bg-white shadow border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4 text-left">Registration ID</th>
              <th className="p-4 text-left">Event</th>
              <th className="p-4 text-left">Participant / Team</th>
              <th className="p-4 text-left">Members</th>
              <th className="p-4 text-left">Attendance</th>
            </tr>
          </thead>

          <tbody>
            {registrations.map((registration) => {
              const presentCount = registration.members.filter(
                (m: any) => m.attendance?.present,
              ).length;

              return (
                <tr
                  key={registration._id}
                  onClick={() => setSelectedRegistration(registration)}
                  className="border-t cursor-pointer hover:bg-slate-50 transition"
                >
                  <td className="p-4">{registration.registrationId}</td>

                  <td className="p-4">{registration.eventType}</td>

                  <td className="p-4">
                    {registration.registrationType === "team"
                      ? registration.teamName
                      : registration.members[0].fullName}
                  </td>

                  <td className="p-4">{registration.members.length}</td>

                  <td className="p-4">
                    {presentCount}/{registration.members.length}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
