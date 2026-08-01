import { useEffect, useState } from "react";
import axios from "axios";
import QRScanner from "./QRScanner";
import {
  getAttendanceRegistration,
  getAttendanceLogs,
  exportAttendanceExcel,
  getEventSettings,
  updateAttendanceStatus,
  getMissingParticipants,
} from "../../../services/spaceDayRegistrationService";
import SpaceDayAttendanceModal from "./SpaceDayAttendanceModal";
import { socket } from "../../../lib/socket";
import { X } from "lucide-react";
const role = localStorage.getItem("role");

const isSuperAdmin = role === "superadmin";

export default function SpaceDayAttendance() {
  const [search, setSearch] = useState("");
  const [missingSearch, setMissingSearch] = useState("");
  const [attendanceOpen, setAttendanceOpen] = useState(true);
  const [eventFilter, setEventFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [missingParticipants, setMissingParticipants] = useState<any[]>([]);

  const [showMissing, setShowMissing] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState("ALL");

  const fetchMissingParticipants = async () => {
    try {
      const data = await getMissingParticipants();

      setMissingParticipants(data.participants);
    } catch (err) {
      console.error(err);
    }
  };

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
    const loadSettings = async () => {
      try {
        const data = await getEventSettings();

        setAttendanceOpen(data.settings.attendanceOpen);
      } catch (err) {
        console.error(err);
      }
    };

    loadSettings();
  }, []);

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

      setActivityFeed((prev) =>
        [
          {
            registrationId: data.registrationId,
            memberName: data.memberName,
            eventType: data.eventType,
            teamName: data.teamName,
            markedBy: data.markedBy,
            markedAt: data.attendance.markedAt,
          },
          ...prev,
        ].slice(0, 15),
      );
      fetchMissingParticipants();
    });

    socket.on("attendanceBulkUpdated", (data) => {
      setRegistrations((prev) =>
        prev.map((registration) => {
          if (registration.registrationId !== data.registrationId) {
            return registration;
          }

          const updatedMembers = [...registration.members];

          data.updatedMembers.forEach((updated: any) => {
            updatedMembers[updated.memberIndex] = {
              ...updatedMembers[updated.memberIndex],
              attendance: updated.attendance,
            };
          });

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

        data.updatedMembers.forEach((updated: any) => {
          updatedMembers[updated.memberIndex] = {
            ...updatedMembers[updated.memberIndex],
            attendance: updated.attendance,
          };
        });

        return {
          ...prev,
          members: updatedMembers,
        };
      });
      setActivityFeed((prev) =>
        [
          ...data.updatedMembers.map((member: any) => ({
            registrationId: data.registrationId,
            memberName: member.memberName,
            eventType: data.eventType,
            teamName: data.teamName,
            markedBy: data.markedBy,
            markedAt: member.attendance.markedAt,
          })),
          ...prev,
        ].slice(0, 20),
      );
      fetchMissingParticipants();
    });

    socket.on("attendanceRemoved", (data) => {
      // Update registrations table
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

      // Update opened modal
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
      setActivityFeed((prev) =>
        [
          {
            action: "REMOVE",
            registrationId: data.registrationId,
            memberName: data.memberName,
            eventType: data.eventType,
            teamName: data.teamName,
            markedBy: data.removedBy,
            markedAt: new Date(),
          },
          ...prev,
        ].slice(0, 20),
      );
      fetchMissingParticipants();
    });

    socket.on("attendanceSettingsUpdated", (settings) => {
      setAttendanceOpen(settings.attendanceOpen);
    });

    return () => {
      socket.off("attendanceUpdated");
      socket.off("attendanceBulkUpdated");
      socket.off("attendanceRemoved");
      socket.off("attendanceSettingsUpdated");
    };
  }, []);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await getAttendanceLogs();

        setActivityFeed(data.logs);
        await fetchMissingParticipants();
      } catch (err) {
        console.error(err);
      }
    };

    loadLogs();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchRegistrations();
      await fetchMissingParticipants();
    };

    loadData();
  }, []);

  if (loading) {
    return <div className="p-10 text-center">Loading registrations...</div>;
  }

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "Verified":
        return (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            Verified
          </span>
        );

      case "Rejected":
        return (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            Rejected
          </span>
        );

      default:
        return (
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
            Pending
          </span>
        );
    }
  };

  const getAttendanceBadge = (present: number, total: number) => {
    if (present === total) {
      return (
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          {present}/{total}
        </span>
      );
    }

    if (present === 0) {
      return (
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          {present}/{total}
        </span>
      );
    }

    return (
      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
        {present}/{total}
      </span>
    );
  };

  const getLastScan = (members: any[]) => {
    const scans = members
      .filter((m) => m.attendance?.markedAt)
      .map((m) => new Date(m.attendance.markedAt));

    if (scans.length === 0) return "-";

    scans.sort((a, b) => b.getTime() - a.getTime());

    return scans[0].toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEventStats = (eventType: string) => {
    const eventRegistrations = registrations.filter(
      (registration) => registration.eventType === eventType,
    );

    const teams = eventRegistrations.length;

    const members = eventRegistrations.reduce(
      (sum, registration) => sum + registration.members.length,
      0,
    );

    const present = eventRegistrations.reduce(
      (sum, registration) =>
        sum +
        registration.members.filter((member: any) => member.attendance?.present)
          .length,
      0,
    );

    const absent = members - present;

    const percentage =
      members === 0 ? 0 : Math.round((present / members) * 100);

    return {
      teams,
      members,
      present,
      absent,
      percentage,
    };
  };

  const astroQuiz = getEventStats("astroquiz");

  const astroDesign = getEventStats("astrodesign");

  const astroModeler = getEventStats("astromodeler");

  const filteredRegistrations = registrations.filter((registration) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      registration.registrationId.toLowerCase().includes(searchText) ||
      registration.teamName?.toLowerCase().includes(searchText) ||
      registration.members.some(
        (member: any) =>
          member.fullName.toLowerCase().includes(searchText) ||
          member.rollNumber.toLowerCase().includes(searchText),
      );

    const matchesEvent =
      eventFilter === "all" || registration.eventType === eventFilter;

    const present = registration.members.filter(
      (member: any) => member.attendance?.present,
    ).length;

    const total = registration.members.length;

    let matchesAttendance = true;

    if (attendanceFilter === "present") {
      matchesAttendance = present === total;
    } else if (attendanceFilter === "partial") {
      matchesAttendance = present > 0 && present < total;
    } else if (attendanceFilter === "absent") {
      matchesAttendance = present === 0;
    }

    const matchesPayment =
      paymentFilter === "all" || registration.paymentStatus === paymentFilter;

    return matchesSearch && matchesEvent && matchesAttendance && matchesPayment;
  });

  const filteredMissingParticipants = missingParticipants.filter(
    (participant) => {
      const searchText = missingSearch.toLowerCase();

      const matchesSearch =
        participant.fullName.toLowerCase().includes(searchText) ||
        participant.rollNumber.toLowerCase().includes(searchText) ||
        participant.registrationId.toLowerCase().includes(searchText);

      const matchesEvent =
        selectedEvent === "ALL" || participant.eventType === selectedEvent;

      return matchesSearch && matchesEvent;
    },
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Space Day Attendance</h1>

          <p className="mt-1 text-slate-500">
            {isSuperAdmin
              ? "Monitor live attendance across all counters."
              : "Scan participant QR codes."}
          </p>
        </div>

        {!isSuperAdmin && (
          <button
            onClick={() => setScannerOpen(true)}
            className="rounded-xl bg-[#00629B] px-5 py-3 font-semibold text-white hover:bg-[#004E7C]"
          >
            📷 Scan QR
          </button>
        )}
      </div>

      {isSuperAdmin && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-bold">Attendance Status</h2>

            <p
              className={`mt-1 font-semibold ${
                attendanceOpen ? "text-green-600" : "text-red-600"
              }`}
            >
              {attendanceOpen ? "🟢 Attendance Open" : "🔴 Attendance Closed"}
            </p>
          </div>

          <button
            onClick={async () => {
              try {
                const data = await updateAttendanceStatus(!attendanceOpen);

                setAttendanceOpen(data.settings.attendanceOpen);
              } catch (err) {
                console.error(err);
              }
            }}
            className={`rounded-xl px-6 py-3 font-semibold text-white ${
              attendanceOpen
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {attendanceOpen ? "Close Attendance" : "Open Attendance"}
          </button>
        </div>
      )}
      {/* Statistics */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total Registrations</p>
            <h2 className="mt-2 text-3xl font-bold">
              {registrations.reduce(
                (sum, registration) => sum + registration.members.length,
                0,
              )}
            </h2>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Present</p>

            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {registrations.reduce(
                (sum, registration) =>
                  sum +
                  registration.members.filter((m: any) => m.attendance?.present)
                    .length,
                0,
              )}
            </h2>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Absent</p>

            <h2 className="mt-2 text-3xl font-bold text-red-600">
              {registrations.reduce(
                (sum, registration) =>
                  sum +
                  registration.members.filter(
                    (m: any) => !m.attendance?.present,
                  ).length,
                0,
              )}
            </h2>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Attendance %</p>

            <h2 className="mt-2 text-3xl font-bold text-blue-600">
              {Math.round(
                (registrations.reduce(
                  (sum, registration) =>
                    sum +
                    registration.members.filter(
                      (m: any) => m.attendance?.present,
                    ).length,
                  0,
                ) /
                  registrations.reduce(
                    (sum, registration) => sum + registration.members.length,
                    0,
                  )) *
                  100 || 0,
              )}
              %
            </h2>
          </div>
        </div>
      )}
      {/* Search & Filters */}
      {isSuperAdmin && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Registration ID, Team, Roll No..."
              className="rounded-xl border px-4 py-3"
            />

            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="rounded-xl border px-4 py-3"
            >
              <option value="all">All Events</option>
              <option value="astroquiz">Astro Quiz</option>
              <option value="astrodesign">Astro Design</option>
              <option value="astromodeler">Astro Modeler</option>
            </select>

            <select
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
              className="rounded-xl border px-4 py-3"
            >
              <option value="all">All Attendance</option>
              <option value="present">Present</option>
              <option value="partial">Partial</option>
              <option value="absent">Absent</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-xl border px-4 py-3"
            >
              <option value="all">All Payments</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>

            <button
              onClick={async () => {
                try {
                  const blob = await exportAttendanceExcel();

                  console.log(blob);
                  console.log(blob instanceof Blob);

                  const url = window.URL.createObjectURL(blob);

                  const link = document.createElement("a");

                  link.href = url;
                  link.download = "SpaceDayAttendance.xlsx";

                  link.click();

                  window.URL.revokeObjectURL(url);
                } catch (err) {
                  console.error(err);
                }
              }}
              className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
            >
              Export Excel
            </button>
          </div>
        </div>
      )}
      {/* Event wise analytics */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Astro Quiz */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold">Astro Quiz</h3>

            <div className="mt-5 space-y-2">
              <p>
                Registered
                <span className="float-right font-semibold">
                  {astroQuiz.members}
                </span>
              </p>

              <p className="text-green-600">
                Present
                <span className="float-right font-semibold">
                  {astroQuiz.present}
                </span>
              </p>

              <p className="text-red-600">
                Absent
                <span className="float-right font-semibold">
                  {astroQuiz.absent}
                </span>
              </p>
            </div>

            <div className="mt-5">
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${astroQuiz.percentage}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-sm text-slate-500">
                {astroQuiz.percentage}% Attendance
              </p>
            </div>
          </div>

          {/* Astro Design */}

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold">Astro Design</h3>

            <div className="mt-5 space-y-2">
              <p>
                Teams
                <span className="float-right font-semibold">
                  {astroDesign.teams}
                </span>
              </p>

              <p>
                Members
                <span className="float-right font-semibold">
                  {astroDesign.members}
                </span>
              </p>

              <p className="text-green-600">
                Present
                <span className="float-right font-semibold">
                  {astroDesign.present}
                </span>
              </p>

              <p className="text-red-600">
                Absent
                <span className="float-right font-semibold">
                  {astroDesign.absent}
                </span>
              </p>
            </div>

            <div className="mt-5">
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${astroDesign.percentage}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-sm text-slate-500">
                {astroDesign.percentage}% Attendance
              </p>
            </div>
          </div>

          {/* Astro Modeler */}

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold">Astro Modeler</h3>

            <div className="mt-5 space-y-2">
              <p>
                Teams
                <span className="float-right font-semibold">
                  {astroModeler.teams}
                </span>
              </p>

              <p>
                Members
                <span className="float-right font-semibold">
                  {astroModeler.members}
                </span>
              </p>

              <p className="text-green-600">
                Present
                <span className="float-right font-semibold">
                  {astroModeler.present}
                </span>
              </p>

              <p className="text-red-600">
                Absent
                <span className="float-right font-semibold">
                  {astroModeler.absent}
                </span>
              </p>
            </div>

            <div className="mt-5">
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-purple-500"
                  style={{
                    width: `${astroModeler.percentage}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-sm text-slate-500">
                {astroModeler.percentage}% Attendance
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Live Activity */}
      {isSuperAdmin && (
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-bold">Live Activity</h2>

            <p className="text-sm text-slate-500">Latest attendance updates</p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {activityFeed.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No attendance activity yet.
              </div>
            )}

            {activityFeed.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b px-6 py-4 last:border-b-0"
              >
                <div>
                  <p className="font-semibold">✅ {activity.memberName}</p>

                  <div className="text-sm text-slate-500">
                    <p>{activity.eventType}</p>

                    {activity.teamName && <p>{activity.teamName}</p>}
                  </div>

                  <p className="text-xs text-slate-400">
                    Marked by {activity.markedBy}
                  </p>
                </div>

                <div className="text-sm text-slate-500">
                  {new Date(activity.markedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {(!isSuperAdmin || scannerOpen) && (
        <div className="mb-8 rounded-2xl border bg-white p-6 shadow">
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setScannerOpen(false)}
              className="rounded-lg p-2 hover:bg-slate-100"
            >
              <X size={22} />
            </button>
          </div>

          {attendanceOpen ? (
            <QRScanner
              key={scannerKey}
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
          ) : (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <h2 className="text-xl font-bold text-red-700">
                Attendance Closed
              </h2>

              <p className="mt-2 text-red-600">
                Attendance has been closed by the Super Admin.
              </p>
            </div>
          )}
        </div>
      )}
      <SpaceDayAttendanceModal
        registration={selectedRegistration}
        onClose={() => {
          setSelectedRegistration(null);
          setScannerKey((prev) => prev + 1);
        }}
      />

      {isSuperAdmin && (
        <div className="mb-5 flex justify-end">
          <button
            onClick={() => setShowMissing(!showMissing)}
            className="rounded-xl border border-red-300 bg-red-50 px-5 py-3 font-semibold text-red-700 hover:bg-red-100"
          >
            {showMissing
              ? "Hide Missing Participants"
              : "Show Missing Participants"}
          </button>
        </div>
      )}

      {isSuperAdmin && showMissing && (
        <>
          <div className="mb-6 rounded-2xl border bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Missing Participants</h2>

                <p className="mt-1 text-slate-500">
                  Total Missing:
                  <span className="ml-2 font-semibold text-red-600">
                    {filteredMissingParticipants.length}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="Search Name / Roll Number"
                value={missingSearch}
                onChange={(e) => setMissingSearch(e.target.value)}
                className="rounded-xl border px-4 py-3"
              />

              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="rounded-xl border px-4 py-3"
              >
                <option value="ALL">All Events</option>

                <option value="astroquiz">Astro Quiz</option>

                <option value="astrodesign">Astro Design</option>

                <option value="astromodeler">Astro Modeler</option>
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 text-left">Name</th>

                  <th className="p-3 text-left">Roll Number</th>

                  <th className="p-3 text-left">Event</th>

                  <th className="p-3 text-left">Registration</th>

                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredMissingParticipants.map((participant) => (
                  <tr
                    key={participant.registrationId + participant.memberIndex}
                    className="border-t"
                  >
                    <td className="p-3">{participant.fullName}</td>

                    <td className="p-3">{participant.rollNumber}</td>

                    <td className="p-3 capitalize">{participant.eventType}</td>

                    <td className="p-3">{participant.registrationId}</td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <a
                          href={`tel:${participant.phone}`}
                          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                        >
                          📞 Call
                        </a>

                        <button
                          onClick={() => {
                            const registration = registrations.find(
                              (r) =>
                                r.registrationId === participant.registrationId,
                            );

                            if (registration) {
                              setSelectedRegistration(registration);
                            }
                          }}
                          className="rounded-lg bg-[#00629B] px-4 py-2 text-white hover:bg-[#004E7C]"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isSuperAdmin && (
        <div className="overflow-x-auto rounded-2xl border bg-white shadow">
          <table className="w-full">
            <thead className="bg-slate-100 text-sm">
              <tr>
                <th className="p-4 text-left">Registration ID</th>

                <th className="p-4 text-left">Event</th>

                <th className="p-4 text-left">Participant / Team</th>

                <th className="p-4 text-center">Payment</th>

                <th className="p-4 text-center">Attendance</th>

                <th className="p-4 text-center">Last Scan</th>

                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredRegistrations.map((registration) => {
                const presentCount = registration.members.filter(
                  (m: any) => m.attendance?.present,
                ).length;

                return (
                  <tr
                    key={registration._id}
                    className="border-t hover:bg-slate-50 transition"
                  >
                    <td className="p-4 font-medium">
                      {registration.registrationId}
                    </td>

                    <td className="p-4 capitalize">{registration.eventType}</td>

                    <td className="p-4">
                      {registration.registrationType === "team"
                        ? registration.teamName
                        : registration.members[0].fullName}
                    </td>

                    <td className="p-4 text-center">
                      {getPaymentBadge(registration.paymentStatus)}
                    </td>

                    <td className="p-4 text-center">
                      {getAttendanceBadge(
                        presentCount,
                        registration.members.length,
                      )}
                    </td>

                    <td className="p-4 text-center">
                      {getLastScan(registration.members)}
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedRegistration(registration)}
                        className="rounded-lg bg-[#00629B] px-4 py-2 text-sm font-medium text-white hover:bg-[#004E7C]"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
