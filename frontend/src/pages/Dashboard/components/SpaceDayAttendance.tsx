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
import { X, Users, CheckCircle2, XCircle, Percent, Search } from "lucide-react";  
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
    return <div className="p-10 text-center text-[#8A8578]">Loading registrations...</div>;  
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">  
        <div>  
          <h1 className="text-3xl font-bold text-[#1C1B22]">Space Day Attendance</h1>

          <p className="mt-1 text-[#8A8578]">  
            {isSuperAdmin  
              ? "Monitor live attendance across all counters."  
              : "Scan participant QR codes."}  
          </p>  
        </div>

        {!isSuperAdmin && (  
          <button  
            onClick={() => setScannerOpen(true)}  
            className="w-full sm:w-auto rounded-xl bg-[#7C6FEF] px-5 py-3 font-semibold text-white hover:bg-[#6C5FE0] transition"  
          >  
            📷 Scan QR  
          </button>  
        )}  
      </div>

      {isSuperAdmin && (  
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#EBE8E2] bg-white p-5" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
          <div>  
            <h2 className="text-lg font-bold text-[#1C1B22]">Attendance Status</h2>

            <p  
              className={`mt-1 inline-flex items-center gap-1.5 font-semibold ${  
                attendanceOpen ? "text-emerald-700" : "text-[#DC3D3D]"  
              }`}  
            >  
              <span className={`w-1.5 h-1.5 rounded-full ${attendanceOpen ? "bg-emerald-500" : "bg-[#DC3D3D]"}`} />  
              {attendanceOpen ? "Attendance Open" : "Attendance Closed"}  
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
            className={`w-full sm:w-auto rounded-xl px-6 py-3 font-semibold text-white transition ${  
              attendanceOpen  
                ? "bg-[#DC3D3D] hover:bg-[#A32D2D]"  
                : "bg-emerald-600 hover:bg-emerald-700"  
            }`}  
          >  
            {attendanceOpen ? "Close Attendance" : "Open Attendance"}  
          </button>  
        </div>  
      )}  
      {/* Statistics */}  
      {isSuperAdmin && (  
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">  
          <div className="rounded-2xl border border-[#EBE8E2] bg-white p-6" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
            <div className="flex items-center gap-3">  
              <div className="w-10 h-10 rounded-xl bg-[#EFEBFF] flex items-center justify-center text-[#7C6FEF]">  
                <Users size={18} />  
              </div>  
              <p className="text-sm text-[#8A8578]">Total Registrations</p>  
            </div>  
            <h2 className="mt-3 text-3xl font-bold text-[#1C1B22]">  
              {registrations.reduce(  
                (sum, registration) => sum + registration.members.length,  
                0,  
              )}  
            </h2>  
          </div>

          <div className="rounded-2xl border border-[#EBE8E2] bg-white p-6" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
            <div className="flex items-center gap-3">  
              <div className="w-10 h-10 rounded-xl bg-[#E8F5EE] flex items-center justify-center text-emerald-700">  
                <CheckCircle2 size={18} />  
              </div>  
              <p className="text-sm text-[#8A8578]">Present</p>  
            </div>

            <h2 className="mt-3 text-3xl font-bold text-emerald-700">  
              {registrations.reduce(  
                (sum, registration) =>  
                  sum +  
                  registration.members.filter((m: any) => m.attendance?.present)  
                    .length,  
                0,  
              )}  
            </h2>  
          </div>

          <div className="rounded-2xl border border-[#EBE8E2] bg-white p-6" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
            <div className="flex items-center gap-3">  
              <div className="w-10 h-10 rounded-xl bg-[#FDEBEB] flex items-center justify-center text-[#DC3D3D]">  
                <XCircle size={18} />  
              </div>  
              <p className="text-sm text-[#8A8578]">Absent</p>  
            </div>

            <h2 className="mt-3 text-3xl font-bold text-[#DC3D3D]">  
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

          <div className="rounded-2xl border border-[#EBE8E2] bg-white p-6" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
            <div className="flex items-center gap-3">  
              <div className="w-10 h-10 rounded-xl bg-[#EAF1FB] flex items-center justify-center text-[#3B6FA6]">  
                <Percent size={18} />  
              </div>  
              <p className="text-sm text-[#8A8578]">Attendance %</p>  
            </div>

            <h2 className="mt-3 text-3xl font-bold text-[#3B6FA6]">  
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
        <div className="rounded-2xl border border-[#EBE8E2] bg-white p-5" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
          <div className="relative">  
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B5B1A8]" />  
            <input  
              type="text"  
              value={search}  
              onChange={(e) => setSearch(e.target.value)}  
              placeholder="Search by Registration ID, Team, Roll No..."  
              className="w-full rounded-xl border border-[#EBE8E2] bg-[#FAF9F7] pl-11 pr-4 py-3 text-[#1C1B22] placeholder:text-[#B5B1A8] outline-none focus:border-[#7C6FEF] transition"  
            />  
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">  
            <select  
              value={eventFilter}  
              onChange={(e) => setEventFilter(e.target.value)}  
              className="flex-1 min-w-[160px] rounded-xl border border-[#EBE8E2] bg-[#FAF9F7] px-4 py-3 text-[#1C1B22] outline-none focus:border-[#7C6FEF] transition"  
            >  
              <option value="all">All Events</option>  
              <option value="astroquiz">Astro Quiz</option>  
              <option value="astrodesign">Astro Design</option>  
              <option value="astromodeler">Astro Modeler</option>  
            </select>

            <select  
              value={attendanceFilter}  
              onChange={(e) => setAttendanceFilter(e.target.value)}  
              className="flex-1 min-w-[160px] rounded-xl border border-[#EBE8E2] bg-[#FAF9F7] px-4 py-3 text-[#1C1B22] outline-none focus:border-[#7C6FEF] transition"  
            >  
              <option value="all">All Attendance</option>  
              <option value="present">Present</option>  
              <option value="partial">Partial</option>  
              <option value="absent">Absent</option>  
            </select>

            <select  
              value={paymentFilter}  
              onChange={(e) => setPaymentFilter(e.target.value)}  
              className="flex-1 min-w-[160px] rounded-xl border border-[#EBE8E2] bg-[#FAF9F7] px-4 py-3 text-[#1C1B22] outline-none focus:border-[#7C6FEF] transition"  
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
              className="w-full sm:w-auto rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 transition"  
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
          <div className="rounded-2xl border border-[#EBE8E2] bg-white p-6" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
            <h3 className="text-lg font-bold text-[#1C1B22]">Astro Quiz</h3>

            <div className="mt-5 space-y-2">  
              <p className="text-[#1C1B22]">  
                Registered  
                <span className="float-right font-semibold">  
                  {astroQuiz.members}  
                </span>  
              </p>

              <p className="text-emerald-700">  
                Present  
                <span className="float-right font-semibold">  
                  {astroQuiz.present}  
                </span>  
              </p>

              <p className="text-[#DC3D3D]">  
                Absent  
                <span className="float-right font-semibold">  
                  {astroQuiz.absent}  
                </span>  
              </p>  
            </div>

            <div className="mt-5">  
              <div className="h-3 overflow-hidden rounded-full bg-[#EBE8E2]">  
                <div  
                  className="h-full bg-emerald-500"  
                  style={{  
                    width: `${astroQuiz.percentage}%`,  
                  }}  
                />  
              </div>

              <p className="mt-2 text-sm text-[#8A8578]">  
                {astroQuiz.percentage}% Attendance  
              </p>  
            </div>  
          </div>

          {/* Astro Design */}

          <div className="rounded-2xl border border-[#EBE8E2] bg-white p-6" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
            <h3 className="text-lg font-bold text-[#1C1B22]">Astro Design</h3>

            <div className="mt-5 space-y-2">  
              <p className="text-[#1C1B22]">  
                Teams  
                <span className="float-right font-semibold">  
                  {astroDesign.teams}  
                </span>  
              </p>

              <p className="text-[#1C1B22]">  
                Members  
                <span className="float-right font-semibold">  
                  {astroDesign.members}  
                </span>  
              </p>

              <p className="text-emerald-700">  
                Present  
                <span className="float-right font-semibold">  
                  {astroDesign.present}  
                </span>  
              </p>

              <p className="text-[#DC3D3D]">  
                Absent  
                <span className="float-right font-semibold">  
                  {astroDesign.absent}  
                </span>  
              </p>  
            </div>

            <div className="mt-5">  
              <div className="h-3 overflow-hidden rounded-full bg-[#EBE8E2]">  
                <div  
                  className="h-full bg-blue-500"  
                  style={{  
                    width: `${astroDesign.percentage}%`,  
                  }}  
                />  
              </div>

              <p className="mt-2 text-sm text-[#8A8578]">  
                {astroDesign.percentage}% Attendance  
              </p>  
            </div>  
          </div>

          {/* Astro Modeler */}

          <div className="rounded-2xl border border-[#EBE8E2] bg-white p-6" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
            <h3 className="text-lg font-bold text-[#1C1B22]">Astro Modeler</h3>

            <div className="mt-5 space-y-2">  
              <p className="text-[#1C1B22]">  
                Teams  
                <span className="float-right font-semibold">  
                  {astroModeler.teams}  
                </span>  
              </p>

              <p className="text-[#1C1B22]">  
                Members  
                <span className="float-right font-semibold">  
                  {astroModeler.members}  
                </span>  
              </p>

              <p className="text-emerald-700">  
                Present  
                <span className="float-right font-semibold">  
                  {astroModeler.present}  
                </span>  
              </p>

              <p className="text-[#DC3D3D]">  
                Absent  
                <span className="float-right font-semibold">  
                  {astroModeler.absent}  
                </span>  
              </p>  
            </div>

            <div className="mt-5">  
              <div className="h-3 overflow-hidden rounded-full bg-[#EBE8E2]">  
                <div  
                  className="h-full bg-purple-500"  
                  style={{  
                    width: `${astroModeler.percentage}%`,  
                  }}  
                />  
              </div>

              <p className="mt-2 text-sm text-[#8A8578]">  
                {astroModeler.percentage}% Attendance  
              </p>  
            </div>  
          </div>  
        </div>  
      )}  
      {/* Live Activity */}  
      {isSuperAdmin && (  
        <div className="rounded-2xl border border-[#EBE8E2] bg-white" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
          <div className="border-b border-[#EBE8E2] px-6 py-4">  
            <h2 className="text-lg font-bold text-[#1C1B22]">Live Activity</h2>

            <p className="text-sm text-[#8A8578]">Latest attendance updates</p>  
          </div>

          <div className="max-h-80 overflow-y-auto">  
            {activityFeed.length === 0 && (  
              <div className="p-8 text-center text-[#8A8578]">  
                No attendance activity yet.  
              </div>  
            )}

            {activityFeed.map((activity, index) => (  
              <div  
                key={index}  
                className="flex items-center justify-between border-b border-[#EBE8E2] px-6 py-4 last:border-b-0"  
              >  
                <div>  
                  <p className="font-semibold text-[#1C1B22]">✅ {activity.memberName}</p>

                  <div className="text-sm text-[#8A8578]">  
                    <p>{activity.eventType}</p>

                    {activity.teamName && <p>{activity.teamName}</p>}  
                  </div>

                  <p className="text-xs text-[#B5B1A8]">  
                    Marked by {activity.markedBy}  
                  </p>  
                </div>

                <div className="text-sm text-[#8A8578]">  
                  {new Date(activity.markedAt).toLocaleTimeString()}  
                </div>  
              </div>  
            ))}  
          </div>  
        </div>  
      )}  
      {(!isSuperAdmin || scannerOpen) && (  
        <div className="mb-8 rounded-2xl border border-[#EBE8E2] bg-white p-6" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
          <div className="mb-4 flex justify-end">  
            <button  
              onClick={() => setScannerOpen(false)}  
              className="rounded-lg p-2 hover:bg-[#FAF9F7] transition"  
            >  
              <X size={22} className="text-[#8A8578]" />  
            </button>  
          </div>

          {attendanceOpen ? (  
            <QRScanner  
              paused={selectedRegistration !== null}  
              onScan={async (registrationId) => {  
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
        }}  
      />

      {isSuperAdmin && (  
        <div className="mb-5 flex justify-end">  
          <button  
            onClick={() => setShowMissing(!showMissing)}  
            className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 font-semibold text-red-700 hover:bg-red-100 transition"  
          >  
            {showMissing  
              ? "Hide Missing Participants"  
              : "Show Missing Participants"}  
          </button>  
        </div>  
      )}

      {isSuperAdmin && showMissing && (  
        <>  
          <div className="mb-6 rounded-2xl border border-[#EBE8E2] bg-white p-6" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
            <div className="flex items-center justify-between">  
              <div>  
                <h2 className="text-2xl font-bold text-[#1C1B22]">Missing Participants</h2>

                <p className="mt-1 text-[#8A8578]">  
                  Total Missing:  
                  <span className="ml-2 font-semibold text-[#DC3D3D]">  
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
                className="rounded-xl border border-[#EBE8E2] bg-[#FAF9F7] px-4 py-3 text-[#1C1B22] placeholder:text-[#B5B1A8] outline-none focus:border-[#7C6FEF] transition"  
              />

              <select  
                value={selectedEvent}  
                onChange={(e) => setSelectedEvent(e.target.value)}  
                className="rounded-xl border border-[#EBE8E2] bg-[#FAF9F7] px-4 py-3 text-[#1C1B22] outline-none focus:border-[#7C6FEF] transition"  
              >  
                <option value="ALL">All Events</option>

                <option value="astroquiz">Astro Quiz</option>

                <option value="astrodesign">Astro Design</option>

                <option value="astromodeler">Astro Modeler</option>  
              </select>  
            </div>  
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-[#EBE8E2]" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
            <table className="w-full">  
              <thead>  
                <tr className="border-b border-[#EBE8E2]">  
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-widest text-[#8A8578]">Name</th>

                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-widest text-[#8A8578]">Roll Number</th>

                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-widest text-[#8A8578]">Event</th>

                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-widest text-[#8A8578]">Registration</th>

                  <th className="p-4 text-center text-xs font-semibold uppercase tracking-widest text-[#8A8578]">Action</th>  
                </tr>  
              </thead>

              <tbody>  
                {filteredMissingParticipants.map((participant) => (  
                  <tr  
                    key={participant.registrationId + participant.memberIndex}  
                    className="border-t border-[#EBE8E2] hover:bg-[#FAF9F7] transition"  
                  >  
                    <td className="p-4 text-[#1C1B22]">{participant.fullName}</td>

                    <td className="p-4 text-[#1C1B22]">{participant.rollNumber}</td>

                    <td className="p-4 capitalize text-[#1C1B22]">{participant.eventType}</td>

                    <td className="p-4 text-[#1C1B22]">{participant.registrationId}</td>

                    <td className="p-4 text-center">  
                      <div className="flex flex-wrap items-center justify-center gap-2">  
                        <a  
                          href={`tel:${participant.phone}`}  
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 transition"  
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
                          className="rounded-lg bg-[#7C6FEF] px-4 py-2 text-sm text-white hover:bg-[#6C5FE0] transition"  
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
        <div>  
          <h2 className="mb-3 text-lg font-bold text-[#1C1B22]">All Registrations</h2>
          <div className="overflow-x-auto rounded-2xl border border-[#EBE8E2] bg-white" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
            <table className="w-full">  
              <thead>  
                <tr className="border-b border-[#EBE8E2]">  
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-widest text-[#8A8578]">Registration ID</th>

                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-widest text-[#8A8578]">Event</th>

                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-widest text-[#8A8578]">Participant / Team</th>

                  <th className="p-4 text-center text-xs font-semibold uppercase tracking-widest text-[#8A8578]">Payment</th>

                  <th className="p-4 text-center text-xs font-semibold uppercase tracking-widest text-[#8A8578]">Attendance</th>

                  <th className="p-4 text-center text-xs font-semibold uppercase tracking-widest text-[#8A8578]">Last Scan</th>

                  <th className="p-4 text-center text-xs font-semibold uppercase tracking-widest text-[#8A8578]">Action</th>  
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
                      className="border-t border-[#EBE8E2] hover:bg-[#FAF9F7] transition"  
                    >  
                      <td className="p-4 font-medium text-[#1C1B22]">  
                        {registration.registrationId}  
                      </td>

                      <td className="p-4 capitalize text-[#1C1B22]">{registration.eventType}</td>

                      <td className="p-4 text-[#1C1B22]">  
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

                      <td className="p-4 text-center text-[#1C1B22]">  
                        {getLastScan(registration.members)}  
                      </td>

                      <td className="p-4 text-center">  
                        <button  
                          onClick={() => setSelectedRegistration(registration)}  
                          className="rounded-lg bg-[#7C6FEF] px-4 py-2 text-sm font-medium text-white hover:bg-[#6C5FE0] transition"  
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
        </div>  
      )}  
    </div>  
  );  
}