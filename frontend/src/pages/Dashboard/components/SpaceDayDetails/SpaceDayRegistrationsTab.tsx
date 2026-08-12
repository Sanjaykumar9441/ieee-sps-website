import { useEffect, useState, useMemo } from "react";  
import axios from "axios";  
import SpaceDayRegistrationDetailsModal from "./SpaceDayRegistrationDetailsModal";  
import { eventThemes } from "@/components/spaceDay/registration/eventTheme";  
import {  
  Member,  
  SpaceDayRegistration,  
} from "@/components/spaceDay/registration/types";  
import {  
  departments,  
  colleges,  
  years,  
} from "../../../../components/spaceDay/registration/data/formOptions";  
import {  
  updatePaymentStatus,  
  exportRegistrations,  
} from "../../../../api/spaceDayAdmin";  
import toast from "react-hot-toast";  
import {  
  Eye,  
  CheckCircle,  
  XCircle,  
  Download,  
  User,  
  Users,  
  Trash2,  
  DollarSign,  
  TrendingUp,  
  Home,  
  UserCheck,  
} from "lucide-react";  
import {  
  PieChart,  
  Pie,  
  Cell,  
  Tooltip,  
  Legend,  
  ResponsiveContainer,  
} from "recharts";  
import { socket } from "@/lib/socket";  
import ToggleSwitch from "../../../../common/ToggleSwitch";

/* ── ANALYTICS CONSTANTS ── */  
const STATUS_COLORS = ["#eab308", "#22c55e", "#DC3D3D"];  
const EVENT_COLORS = ["#3b82f6", "#a855f7", "#f97316"];

const StatCard = ({ label, value, color, icon: Icon }: any) => {  
  const colorMap: Record<  
    string,  
    { border: string; text: string; glow: string; bg: string }  
  > = {  
    emerald: {  
      border: "rgba(34,197,94,0.25)",  
      text: "#22c55e",  
      glow: "rgba(34,197,94,0.08)",  
      bg: "rgba(34,197,94,0.06)",  
    },  
    blue: {  
      border: "rgba(59,130,246,0.25)",  
      text: "#60a5fa",  
      glow: "rgba(59,130,246,0.08)",  
      bg: "rgba(59,130,246,0.06)",  
    },  
    purple: {  
      border: "rgba(168,85,247,0.25)",  
      text: "#c084fc",  
      glow: "rgba(168,85,247,0.08)",  
      bg: "rgba(168,85,247,0.06)",  
    },  
    orange: {  
      border: "rgba(249,115,22,0.25)",  
      text: "#fb923c",  
      glow: "rgba(249,115,22,0.08)",  
      bg: "rgba(249,115,22,0.06)",  
    },  
    cyan: {  
      border: "rgba(6,182,212,0.25)",  
      text: "#22d3ee",  
      glow: "rgba(6,182,212,0.08)",  
      bg: "rgba(6,182,212,0.06)",  
    },  
  };  
  const c = colorMap[color] || colorMap.blue;  
  return (  
    <div  
      className="p-4 rounded-xl relative overflow-hidden"  
      style={{  
        backgroundColor: "#FFFFFF",  
        border: `1px solid ${c.border}`,  
        background: `linear-gradient(135deg, #FFFFFF, ${c.bg})`,  
      }}  
    >  
      <div className="flex items-start justify-between">  
        <div>  
          <p  
            className="text-xs font-medium uppercase tracking-wider mb-2"  
            style={{ color: "#8A8578" }}  
          >  
            {label}  
          </p>  
          <p className="text-2xl font-bold" style={{ color: c.text }}>  
            {value}  
          </p>  
        </div>  
        {Icon && (  
          <div className="p-2 rounded-lg" style={{ backgroundColor: c.glow }}>  
            <Icon size={16} style={{ color: c.text }} />  
          </div>  
        )}  
      </div>  
    </div>  
  );  
};
  
export default function SpaceDayRegistrationsTab() {  
  const [registrations, setRegistrations] = useState<SpaceDayRegistration[]>(  
    [],  
  );  
  interface Settings {  
    enabled: boolean;

    events: {  
      astroquiz: boolean;  
      astrodesign: boolean;  
      astromodeler: boolean;  
    };  
  }

  const [loading, setLoading] = useState(true);  
  const [settings, setSettings] = useState<Settings | null>(null);  
  const [search, setSearch] = useState("");  
  const [eventFilter, setEventFilter] = useState("all");  
  const [paymentFilter, setPaymentFilter] = useState("all");  
  const [collegeFilter, setCollegeFilter] = useState("all");  
  const [departmentFilter, setDepartmentFilter] = useState("all");  
  const [yearFilter, setYearFilter] = useState("all");  
  const [selectedRegistration, setSelectedRegistration] = useState<SpaceDayRegistration | null>(null);  
  const stats = {  
    total: registrations.length,

    pending: registrations.filter((r) => r.paymentStatus === "Pending").length,

    verified: registrations.filter((r) => r.paymentStatus === "Verified")  
      .length,

    rejected: registrations.filter((r) => r.paymentStatus === "Rejected")  
      .length,

    revenue: registrations  
      .filter((r: any) => r.paymentStatus === "Verified")  
      .reduce((sum: number, r: any) => sum + r.totalFee, 0),  
  };

  /* ── ANALYTICS: revenue by event ── */  
  const verifiedRegistrations = registrations.filter(  
    (r) => r.paymentStatus === "Verified",  
  );  
  const quizRevenue = verifiedRegistrations  
    .filter((r) => r.eventType === "astroquiz")  
    .reduce((sum, r: any) => sum + r.totalFee, 0);  
  const designRevenue = verifiedRegistrations  
    .filter((r) => r.eventType === "astrodesign")  
    .reduce((sum, r: any) => sum + r.totalFee, 0);  
  const modelerRevenue = verifiedRegistrations  
    .filter((r) => r.eventType === "astromodeler")  
    .reduce((sum, r: any) => sum + r.totalFee, 0);

  /* ── ANALYTICS: participation ── */  
  const individualCount = registrations.filter(  
    (r) => r.registrationType === "individual",  
  ).length;  
  const teamCount = registrations.filter(  
    (r) => r.registrationType === "team",  
  ).length;  
  const totalParticipants = registrations.reduce(  
    (sum, r) => sum + (r.members?.length || 0),  
    0,  
  );  
  const accommodationCount = registrations.filter(  
    (r: any) => !!r.accommodation,  
  ).length;

  /* ── ANALYTICS: chart data ── */  
  const statusData = [  
    { name: "Pending", value: stats.pending },  
    { name: "Verified", value: stats.verified },  
    { name: "Rejected", value: stats.rejected },  
  ];  
  const eventData = [  
    {  
      name: "Astro Quiz",  
      value: registrations.filter((r) => r.eventType === "astroquiz").length,  
    },  
    {  
      name: "AI Astro Design",  
      value: registrations.filter((r) => r.eventType === "astrodesign")  
        .length,  
    },  
    {  
      name: "Astro Modeler",  
      value: registrations.filter((r) => r.eventType === "astromodeler")  
        .length,  
    },  
  ];

  const collegeAnalytics = useMemo(() => {  
    const collegeCounts: Record<string, number> = {};  
    registrations.forEach((reg) => {  
      reg.members?.forEach((member: Member) => {  
        const college =  
          member.college === "Other"  
            ? member.otherCollege || "Other"  
            : member.college || "Unknown";  
        collegeCounts[college] = (collegeCounts[college] || 0) + 1;  
      });  
    });  
    return Object.entries(collegeCounts)  
      .map(([name, value]) => ({ name, value }))  
      .sort((a, b) => b.value - a.value);  
  }, [registrations]);

  const maxCollegeCount = collegeAnalytics[0]?.value || 1;

  useEffect(() => {  
    fetchRegistrations();  
    fetchSettings();

    const handleRegistrationUpdate = (  
      updatedRegistration: SpaceDayRegistration,  
    ) => {  
      console.log("📡 Registration Updated:", updatedRegistration);

      // Update the table  
      setRegistrations((prev) =>  
        prev.map((registration) =>  
          registration.registrationId === updatedRegistration.registrationId  
            ? updatedRegistration  
            : registration,  
        ),  
      );

      // Update the open modal (if it's open)  
      setSelectedRegistration((prev) =>  
        prev?.registrationId === updatedRegistration.registrationId  
          ? updatedRegistration  
          : prev,  
      );  
    };

    const handleNewRegistration = (newRegistration: SpaceDayRegistration) => {  
      console.log("🆕 New Registration:", newRegistration);

      setRegistrations((prev) => [newRegistration, ...prev]);  
    };

    socket.on("registrationUpdated", handleRegistrationUpdate);

    socket.on("newRegistration", handleNewRegistration);

    const handleDeleteRegistration = ({  
      registrationId,  
    }: {  
      registrationId: string;  
    }) => {  
      console.log("🗑 Registration Deleted:", registrationId);

      setRegistrations((prev) =>  
        prev.filter(  
          (registration) => registration.registrationId !== registrationId,  
        ),  
      );

      setSelectedRegistration((prev) =>  
        prev?.registrationId === registrationId ? null : prev,  
      );  
    };

    socket.on("registrationDeleted", handleDeleteRegistration);

    const handleSettingsUpdate = (updatedSettings: Settings) => {  
      console.log("⚙️ Registration Settings Updated");

      setSettings(updatedSettings);  
    };

    socket.on("registrationSettingsUpdated", handleSettingsUpdate);

    return () => {  
      socket.off("registrationUpdated", handleRegistrationUpdate);

      socket.off("newRegistration", handleNewRegistration);

      socket.off("registrationDeleted", handleDeleteRegistration);

      socket.off("registrationSettingsUpdated", handleSettingsUpdate);  
    };  
  }, []);

  const fetchRegistrations = async () => {  
    try {  
      const res = await axios.get<{  
        success: boolean;  
        registrations: SpaceDayRegistration[];  
      }>(`${import.meta.env.VITE_API_URL}/api/space-day/registrations`);

      setRegistrations(res.data.registrations);  
    } catch (err) {  
      console.error(err);  
    } finally {  
      setLoading(false);  
    }  
  };

  const fetchSettings = async () => {  
    try {  
      const res = await axios.get(  
        `${import.meta.env.VITE_API_URL}/api/space-day/admin/settings`,  
        {  
          headers: {  
            Authorization: `Bearer ${localStorage.getItem("token")}`,  
          },  
        },  
      );

      setSettings(res.data.settings);  
    } catch (err) {  
      console.error(err);  
    }  
  };

  const handlePaymentStatus = async (  
    registrationId: string,  
    paymentStatus: "Verified" | "Rejected",  
  ) => {  
    try {  
      await updatePaymentStatus(registrationId, paymentStatus);

      toast.success(`Payment ${paymentStatus}`);  
    } catch (err: any) {  
      toast.error(err.response?.data?.message || "Something went wrong");  
    }  
  };

  const handleDelete = async (registration: SpaceDayRegistration) => {  
    const confirmed = window.confirm(  
      `Delete ${registration.registrationId}?\\n\\nThis will permanently delete:\\n\\n• Registration \\n\\nThis action cannot be undone.`,  
    );

    if (!confirmed) return;

    try {  
      await axios.delete(  
        `${import.meta.env.VITE_API_URL}/api/space-day/admin/${registration.registrationId}`,  
        {  
          headers: {  
            Authorization: `Bearer ${localStorage.getItem("token")}`,  
          },  
        },  
      );

      toast.success("Registration deleted successfully");  
    } catch (err: any) {  
      toast.error(err.response?.data?.message || "Delete failed");  
    }  
  };

  const updateMaster = async (enabled: boolean) => {  
    await axios.patch(  
      `${import.meta.env.VITE_API_URL}/api/space-day/admin/settings/master`,  
      {  
        enabled,  
      },  
      {  
        headers: {  
          Authorization: `Bearer ${localStorage.getItem("token")}`,  
        },  
      },  
    );  
  };

  const updateEvent = async (  
    event: "astroquiz" | "astrodesign" | "astromodeler",  
    enabled: boolean,  
  ) => {  
    await axios.patch(  
      `${import.meta.env.VITE_API_URL}/api/space-day/admin/settings/event`,  
      {  
        event,  
        enabled,  
      },  
      {  
        headers: {  
          Authorization: `Bearer ${localStorage.getItem("token")}`,  
        },  
      },  
    );  
  };

  const downloadExcel = async () => {  
    try {  
      const blob = await exportRegistrations();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;  
      a.download = "SpaceDay_Registrations.xlsx";

      document.body.appendChild(a);  
      a.click();  
      document.body.removeChild(a);

      window.URL.revokeObjectURL(url);

      toast.success("Excel downloaded successfully.");  
    } catch (err: any) {  
      toast.error(err.response?.data?.message || "Failed to download Excel.");  
    }  
  };

  const filteredRegistrations = registrations.filter((registration) => {  
    const keyword = search.toLowerCase();

    const matchesSearch =  
      registration.registrationId.toLowerCase().includes(keyword) ||  
      registration.transactionId.toLowerCase().includes(keyword) ||  
      registration.teamName?.toLowerCase().includes(keyword) ||  
      registration.members.some(  
        (member: Member) =>  
          member.fullName.toLowerCase().includes(keyword) ||  
          member.rollNumber.toLowerCase().includes(keyword),  
      );

    const matchesCollege =  
      collegeFilter === "all" ||  
      registration.members.some(  
        (member: Member) => member.college === collegeFilter,  
      );

    const matchesDepartment =  
      departmentFilter === "all" ||  
      registration.members.some(  
        (member: Member) => member.department === departmentFilter,  
      );

    const matchesYear =  
      yearFilter === "all" ||  
      registration.members.some((member: Member) => member.year === yearFilter);

    const matchesEvent =  
      eventFilter === "all" || registration.eventType === eventFilter;

    const matchesPayment =  
      paymentFilter === "all" || registration.paymentStatus === paymentFilter;

    return (  
      matchesSearch &&  
      matchesEvent &&  
      matchesPayment &&  
      matchesCollege &&  
      matchesDepartment &&  
      matchesYear  
    );  
  });

  if (loading) {  
    return <div className="p-8 text-center text-[#8A8578]">Loading registrations...</div>;  
  }

  const eventNames = {  
    astroquiz: "Astro Quiz",  
    astrodesign: "AI Astro Design",  
    astromodeler: "Astro Modeler",  
  };

  return (  
    <div className="space-y-6 text-[#1C1B22]">  
      <h1 className="text-3xl font-bold text-[#1C1B22]">  
        National Space Day Registrations  
      </h1>  
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-5">  
        <div className="rounded-2xl bg-white border border-[#EBE8E2] p-6" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
          <p className="text-[#8A8578] text-sm">Total Registrations</p>

          <h2 className="mt-2 text-3xl font-bold text-[#1C1B22]">{stats.total}</h2>  
        </div>

        <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-6">  
          <p className="text-yellow-700 text-sm">Pending</p>

          <h2 className="mt-2 text-3xl font-bold text-yellow-700">  
            {stats.pending}  
          </h2>  
        </div>

        <div className="rounded-2xl bg-green-50 border border-green-200 p-6">  
          <p className="text-green-700 text-sm">Verified</p>

          <h2 className="mt-2 text-3xl font-bold text-green-700">  
            {stats.verified}  
          </h2>  
        </div>

        <div className="rounded-2xl bg-red-50 border border-red-200 p-6">  
          <p className="text-red-700 text-sm">Rejected</p>

          <h2 className="mt-2 text-3xl font-bold text-red-700">  
            {stats.rejected}  
          </h2>  
        </div>

        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-6">  
          <p className="text-blue-700 text-sm">Revenue</p>

          <h2 className="mt-2 text-3xl font-bold text-blue-700">  
            ₹{stats.revenue}  
          </h2>  
        </div>  
      </div>

      {/* SECONDARY ANALYTICS CARDS */}  
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">  
        <StatCard  
          label="Astro Quiz Revenue"  
          value={`₹${quizRevenue}`}  
          color="blue"  
          icon={DollarSign}  
        />  
        <StatCard  
          label="Astro Design Revenue"  
          value={`₹${designRevenue}`}  
          color="purple"  
          icon={DollarSign}  
        />  
        <StatCard  
          label="Astro Modeler Revenue"  
          value={`₹${modelerRevenue}`}  
          color="orange"  
          icon={DollarSign}  
        />  
        <StatCard  
          label="Total Participants"  
          value={totalParticipants}  
          color="cyan"  
          icon={Users}  
        />  
        <StatCard  
          label="Individual Entries"  
          value={individualCount}  
          color="blue"  
          icon={User}  
        />  
        <StatCard  
          label="Team Entries"  
          value={teamCount}  
          color="purple"  
          icon={UserCheck}  
        />  
        <StatCard  
          label="Accommodation Required"  
          value={accommodationCount}  
          color="orange"  
          icon={Home}  
        />  
        <StatCard  
          label="Verification Rate"  
          value={`${stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%`}  
          color="emerald"  
          icon={TrendingUp}  
        />  
      </div>

      {/* CHARTS */}  
      <div className="grid md:grid-cols-3 gap-4">  
        <div  
          className="p-5 rounded-2xl border border-[#EBE8E2] bg-white"  
          style={{  
            boxShadow:  
              "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)",  
          }}  
        >  
          <h3  
            className="text-sm font-semibold mb-4 uppercase tracking-wider"  
            style={{ color: "#8A8578" }}  
          >  
            Registration Status  
          </h3>  
          <ResponsiveContainer width="100%" height={220}>  
            <PieChart>  
              <Pie  
                data={statusData}  
                dataKey="value"  
                nameKey="name"  
                outerRadius={80}  
                label  
              >  
                {statusData.map((_, index) => (  
                  <Cell  
                    key={index}  
                    fill={STATUS_COLORS[index % STATUS_COLORS.length]}  
                  />  
                ))}  
              </Pie>  
              <Tooltip  
                contentStyle={{  
                  backgroundColor: "#FFFFFF",  
                  border: "1px solid #EBE8E2",  
                  borderRadius: "8px",  
                  color: "#1C1B22",  
                }}  
              />  
              <Legend />  
            </PieChart>  
          </ResponsiveContainer>  
        </div>

        <div  
          className="p-5 rounded-2xl border border-[#EBE8E2] bg-white"  
          style={{  
            boxShadow:  
              "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)",  
          }}  
        >  
          <h3  
            className="text-sm font-semibold mb-4 uppercase tracking-wider"  
            style={{ color: "#8A8578" }}  
          >  
            Event Type  
          </h3>  
          <ResponsiveContainer width="100%" height={220}>  
            <PieChart>  
              <Pie  
                data={eventData}  
                dataKey="value"  
                nameKey="name"  
                outerRadius={80}  
                label  
              >  
                {eventData.map((_, index) => (  
                  <Cell  
                    key={index}  
                    fill={EVENT_COLORS[index % EVENT_COLORS.length]}  
                  />  
                ))}  
              </Pie>  
              <Tooltip  
                contentStyle={{  
                  backgroundColor: "#FFFFFF",  
                  border: "1px solid #EBE8E2",  
                  borderRadius: "8px",  
                  color: "#1C1B22",  
                }}  
              />  
              <Legend />  
            </PieChart>  
          </ResponsiveContainer>  
        </div>

        <div  
          className="p-5 rounded-2xl border border-[#EBE8E2] bg-white"  
          style={{  
            boxShadow:  
              "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)",  
          }}  
        >  
          <h3  
            className="text-sm font-semibold mb-4 uppercase tracking-wider"  
            style={{ color: "#8A8578" }}  
          >  
            🏫 Top Colleges  
          </h3>  
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">  
            {collegeAnalytics.length === 0 ? (  
              <p className="text-xs" style={{ color: "#B5B1A8" }}>  
                No data yet.  
              </p>  
            ) : (  
              collegeAnalytics.map((college, index) => (  
                <div key={index}>  
                  <div className="flex justify-between items-center mb-1">  
                    <span  
                      className="text-xs font-medium truncate pr-2"  
                      style={{ color: "#8A8578" }}  
                    >  
                      {index + 1}. {college.name}  
                    </span>  
                    <span  
                      className="text-xs font-semibold shrink-0"  
                      style={{ color: "#7C6FEF" }}  
                    >  
                      {college.value}  
                    </span>  
                  </div>  
                  <div  
                    className="h-1 rounded-full"  
                    style={{ backgroundColor: "#EBE8E2" }}  
                  >  
                    <div  
                      className="h-1 rounded-full"  
                      style={{  
                        width: `${(college.value / maxCollegeCount) * 100}%`,  
                        background:  
                          "linear-gradient(to right, #8B7FF5, #6C5FE0)",  
                      }}  
                    />  
                  </div>  
                </div>  
              ))  
            )}  
          </div>  
        </div>  
      </div>

      {settings && (  
        <div className="rounded-2xl border border-[#EBE8E2] bg-white overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
          <div className="border-b border-[#EBE8E2] px-6 py-5">  
            <h2 className="text-2xl font-bold text-[#1C1B22]">🚀 Registration Control</h2>

            <p className="mt-1 text-[#8A8578]">  
              Manage registrations in real time.  
            </p>  
          </div>

          <div className="px-6 divide-y divide-[#EBE8E2]">  
            <div className="flex items-center justify-between gap-4 py-5">  
              <div>  
                <h3 className="text-lg font-semibold text-[#1C1B22]">🌍 National Space Day</h3>

                <p className="text-sm text-[#8A8578]">  
                  Enable or disable all registrations.  
                </p>  
              </div>

              <div className="shrink-0">  
                <ToggleSwitch  
                  enabled={settings!.enabled}  
                  onChange={() => updateMaster(!settings!.enabled)}  
                />  
              </div>  
            </div>

            <div className="flex items-center justify-between gap-4 py-5">  
              <div>  
                <h3 className="font-semibold text-[#1C1B22]">📚 Astro Quiz</h3>

                <p className="text-sm text-[#8A8578]">  
                  Individual Quiz Competition  
                </p>  
              </div>

              <div className="shrink-0">  
                <ToggleSwitch  
                  enabled={settings!.events.astroquiz}  
                  onChange={() =>  
                    updateEvent("astroquiz", !settings!.events.astroquiz)  
                  }  
                />  
              </div>  
            </div>

            <div className="flex items-center justify-between gap-4 py-5">  
              <div>  
                <h3 className="font-semibold text-[#1C1B22]">🎨 AI Astro Design</h3>

                <p className="text-sm text-[#8A8578]">Team Design Competition</p>  
              </div>  
              <div className="shrink-0">  
                <ToggleSwitch  
                  enabled={settings!.events.astrodesign}  
                  onChange={() =>  
                    updateEvent("astrodesign", !settings!.events.astrodesign)  
                  }  
                />  
              </div>  
            </div>

            <div className="flex items-center justify-between gap-4 py-5">  
              <div>  
                <h3 className="font-semibold text-[#1C1B22]">🚀 Astro Modeler</h3>

                <p className="text-sm text-[#8A8578]">Team Model Competition</p>  
              </div>

              <div className="shrink-0">  
                <ToggleSwitch  
                  enabled={settings!.events.astromodeler}  
                  onChange={() =>  
                    updateEvent("astromodeler", !settings!.events.astromodeler)  
                  }  
                />  
              </div>  
            </div>  
          </div>  
        </div>  
      )}  
      <div className="rounded-2xl border border-[#EBE8E2] bg-white p-5 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
        <input  
          type="text"  
          placeholder="Search Registration ID, Name, Team, Roll Number..."  
          value={search}  
          onChange={(e) => setSearch(e.target.value)}  
          className="
w-full lg:w-96
rounded-lg
border border-[#EBE8E2]
bg-[#FAF9F7]
text-[#1C1B22]
placeholder:text-[#B5B1A8]
px-4 py-2
outline-none
focus:border-[#7C6FEF]
transition
"  
        />

        <div className="flex flex-wrap gap-3">  
          {/* Event */}

          <select  
            value={eventFilter}  
            onChange={(e) => setEventFilter(e.target.value)}  
            className="
min-w-[150px]
rounded-lg
border border-[#EBE8E2]
bg-[#FAF9F7]
text-[#1C1B22]
px-4
py-2
outline-none
focus:border-[#7C6FEF]
transition
"  
          >  
            <option value="all">All Events</option>  
            <option value="astroquiz">Astro Quiz</option>  
            <option value="astrodesign">AI Astro Design</option>  
            <option value="astromodeler">Astro Modeler</option>  
          </select>

          {/* Payment */}

          <select  
            value={paymentFilter}  
            onChange={(e) => setPaymentFilter(e.target.value)}  
            className="
min-w-[150px]
rounded-lg
border border-[#EBE8E2]
bg-[#FAF9F7]
text-[#1C1B22]
px-4
py-2
outline-none
focus:border-[#7C6FEF]
transition
"  
          >  
            <option value="all">All Payments</option>  
            <option value="Pending">Pending</option>  
            <option value="Verified">Verified</option>  
            <option value="Rejected">Rejected</option>  
          </select>

          {/* Department */}

          <select  
            value={departmentFilter}  
            onChange={(e) => setDepartmentFilter(e.target.value)}  
            className="
min-w-[150px]
rounded-lg
border border-[#EBE8E2]
bg-[#FAF9F7]
text-[#1C1B22]
px-4
py-2
outline-none
focus:border-[#7C6FEF]
transition
"  
          >  
            <option value="all">All Departments</option>

            {departments.map((department) => (  
              <option key={department} value={department}>  
                {department}  
              </option>  
            ))}  
          </select>

          {/* College */}

          <select  
            value={collegeFilter}  
            onChange={(e) => setCollegeFilter(e.target.value)}  
            className="
min-w-[150px]
rounded-lg
border border-[#EBE8E2]
bg-[#FAF9F7]
text-[#1C1B22]
px-4
py-2
outline-none
focus:border-[#7C6FEF]
transition
"  
          >  
            <option value="all">All Colleges</option>

            {colleges.map((college) => (  
              <option key={college} value={college}>  
                {college}  
              </option>  
            ))}  
          </select>

          {/* Year */}

          <select  
            value={yearFilter}  
            onChange={(e) => setYearFilter(e.target.value)}  
            className="
min-w-[150px]
rounded-lg
border border-[#EBE8E2]
bg-[#FAF9F7]
text-[#1C1B22]
px-4
py-2
outline-none
focus:border-[#7C6FEF]
transition
"  
          >  
            <option value="all">All Years</option>

            {years.map((year) => (  
              <option key={year} value={year}>  
                {year}  
              </option>  
            ))}  
          </select>  
          <button  
            onClick={downloadExcel}  
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-white hover:bg-emerald-700 transition"  
          >  
            <Download size={18} />  
            Export Excel  
          </button>  
        </div>  
      </div>  
      <div className="rounded-2xl border border-[#EBE8E2] bg-white overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)" }}>  
        <div className="px-6 py-4 border-b border-[#EBE8E2]">  
          <h2 className="text-xl font-semibold text-[#1C1B22]">Registrations</h2>  
        </div>

        <div className="overflow-x-auto">  
          <table className="w-full">  
            <thead>
              <tr className="border-b border-[#EBE8E2]">  
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest text-[#8A8578]">  
                  Registration ID  
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest text-[#8A8578]">  
                  Event  
                </th>

                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-widest text-[#8A8578]">  
                  Type  
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest text-[#8A8578]">  
                  Participant / Team  
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest text-[#8A8578]">  
                  Payment  
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest text-[#8A8578]">  
                  Fee  
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest text-[#8A8578]">  
                  Registered On  
                </th>

                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-widest text-[#8A8578]">  
                  Action  
                </th>  
              </tr>  
            </thead>

            <tbody className="text-[#1C1B22]">  
              {filteredRegistrations.map((registration) => {  
                const theme = eventThemes[registration.eventType];

                return (  
                  <tr  
                    key={registration._id}  
                    className="border-b border-[#EBE8E2] hover:bg-[#FAF9F7] transition"  
                  >  
                    <td className="px-6 py-5 font-semibold">  
                      {registration.registrationId}  
                    </td>

                    <td className="px-6 py-5">  
                      <span  
                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold  
      ${theme.light}  
      ${theme.text}`}  
                      >  
                        {eventNames[registration.eventType]}  
                      </span>  
                    </td>

                    <td className="px-6 py-5 text-center">  
                      {registration.registrationType === "individual" ? (  
                        <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">  
                          <User size={14} />  
                          Individual  
                        </span>  
                      ) : (  
                        <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">  
                          <Users size={14} />  
                          Team  
                        </span>  
                      )}  
                    </td>

                    <td className="px-6 py-5">  
                      {registration.registrationType === "individual"  
                        ? registration.members[0].fullName  
                        : registration.teamName}  
                    </td>

                    <td className="px-6 py-5">  
                      <span  
                        className={`px-3 py-1 rounded-full text-sm font-semibold  
    ${  
      registration.paymentStatus === "Verified"  
        ? "bg-green-100 text-green-700"  
        : registration.paymentStatus === "Rejected"  
          ? "bg-red-100 text-red-700"  
          : "bg-yellow-100 text-yellow-700"  
    }`}  
                      >  
                        {registration.paymentStatus}  
                      </span>  
                    </td>

                    <td className="px-6 py-5 font-semibold">  
                      ₹{registration.totalFee}  
                    </td>

                    <td className="px-6 py-5">  
                      {new Date(registration.createdAt).toLocaleDateString()}  
                    </td>

                    <td className="px-6 py-5 text-center">  
                      <div className="flex flex-wrap items-center justify-center gap-2">  
                        {/* View */}

                        <button  
                          onClick={() => setSelectedRegistration(registration)}  
                          className="rounded-lg border border-[#EBE8E2] p-2 text-[#8A8578] hover:bg-[#FAF9F7] hover:text-[#1C1B22] transition"  
                          title="View Registration"  
                        >  
                          <Eye size={18} />  
                        </button>

                        {/* Verify */}

                        {registration.paymentStatus === "Pending" && (  
                          <button  
                            onClick={() =>  
                              handlePaymentStatus(  
                                registration.registrationId,  
                                "Verified",  
                              )  
                            }  
                            className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700 transition"  
                            title="Verify Payment"  
                          >  
                            <CheckCircle size={18} />  
                          </button>  
                        )}

                        {/* Reject */}

                        {registration.paymentStatus === "Pending" && (  
                          <button  
                            onClick={() =>  
                              handlePaymentStatus(  
                                registration.registrationId,  
                                "Rejected",  
                              )  
                            }  
                            className="rounded-lg bg-[#DC3D3D] p-2 text-white hover:bg-[#A32D2D] transition"  
                            title="Reject Payment"  
                          >  
                            <XCircle size={18} />  
                          </button>  
                        )}

                        {/* Delete */}

                        {registration.paymentStatus !== "Pending" && (  
                          <button  
                            onClick={() => handleDelete(registration)}  
                            className="rounded-md bg-[#DC3D3D] p-2 text-white hover:bg-[#A32D2D] transition"  
                            title="Delete Registration"  
                          >  
                            <Trash2 size={18} />  
                          </button>  
                        )}  
                      </div>  
                    </td>  
                  </tr>  
                );  
              })}  
            </tbody>  
          </table>  
        </div>  
      </div>  
      {selectedRegistration && (  
        <SpaceDayRegistrationDetailsModal  
          registration={selectedRegistration}  
          onClose={() => setSelectedRegistration(null)}  
          onStatusChanged={() => {}}  
        />  
      )}  
    </div>  
  );  
}