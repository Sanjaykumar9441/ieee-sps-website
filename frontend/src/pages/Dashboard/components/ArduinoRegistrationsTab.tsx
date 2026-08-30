import { useEffect, useState, useMemo } from "react";  
import axios from "axios";  
import * as XLSX from "xlsx";  
import { saveAs } from "file-saver";  
import {  
  Download,  
  Eye,  
  Check,  
  Trash2,  
  Search,  
  X,  
  Home,  
  Users,  
  BookOpen,  
  DollarSign,  
  TrendingUp,  
} from "lucide-react";  
import {  
  PieChart,  
  Pie,  
  Cell,  
  Tooltip,  
  Legend,  
  ResponsiveContainer,  
} from "recharts";

/* ── CONSTANTS ── */  
const STATUS_COLORS = ["#eab308", "#22c55e"];  
const EVENT_COLORS = ["#3b82f6", "#a855f7"];

const collegeMap: Record<string, string> = {  
  AUS: "Aditya University (AUS)",  
  ACET: "Aditya College of Engineering & Technology (ACET)",  
};

const normalizeCollege = (college: string) => {  
  if (!college) return "Unknown";  
  if (college === "AUS" || college.includes("Aditya University")) return "AUS";  
  if (  
    college === "ACET" ||  
    college.includes("Aditya College of Engineering & Technology")  
  )  
    return "ACET";  
  return college;  
};

/* ── STYLE HELPERS ── */  
const inputStyle: React.CSSProperties = {  
  backgroundColor: "#FAF9F7",  
  border: "1px solid #EBE8E2",  
  color: "#1C1B22",  
  borderRadius: "10px",  
  padding: "10px 14px",  
  width: "100%",  
  fontSize: "14px",  
  outline: "none",  
  transition: "border 0.2s, box-shadow 0.2s",  
};

const cardStyle: React.CSSProperties = {  
  backgroundColor: "#FFFFFF",  
  border: "1px solid #EBE8E2",  
  borderRadius: "14px",  
};

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
    yellow: {  
      border: "rgba(234,179,8,0.25)",  
      text: "#facc15",  
      glow: "rgba(234,179,8,0.08)",  
      bg: "rgba(234,179,8,0.06)",  
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

/* ── PROPS ── */  
interface RegistrationsTabProps {  
  token: string | null;  
  navigate: (path: string) => void;  
  registrationOpen: boolean;  
}

/* ══════════════════════════════════════════  
  REGISTRATIONS TAB  
══════════════════════════════════════════ */  
const ArduinoRegistrationsTab = ({  
  token,  
  navigate,  
  registrationOpen,  
}: RegistrationsTabProps) => {  
  const [registrations, setRegistrations] = useState<any[]>([]);  
  const [latestRegistrations, setLatestRegistrations] = useState<any[]>([]);  
  const [newRegsBannerDismissed, setNewRegsBannerDismissed] = useState(false);  
  const [registrationView, setRegistrationView] = useState("pending");  
  const [registrationFilter, setRegistrationFilter] = useState("all");  
  const [searchTerm, setSearchTerm] = useState("");  
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);  
  const [selectedFullDetails, setSelectedFullDetails] = useState<any>(null);

  /* ── DERIVED COUNTS ── */  
  const totalCount = registrations.length;  
  const pendingCount = registrations.filter(  
    (r) => r.registrationStatus === "Pending"  
  ).length;  
  const confirmedCount = registrations.filter(  
    (r) => r.registrationStatus === "Confirmed"  
  ).length;  
  const comboCount = registrations.filter(  
    (r) => r.eventType === "combo"  
  ).length;  
  const buildathonCount = registrations.filter(  
    (r) => r.eventType === "buildathon"  
  ).length;  
  const hostelCount = registrations.filter(  
    (r) => r.accommodationRequired === true  
  ).length;  
  const confirmedComboTeams = registrations.filter(  
    (r) => r.registrationStatus === "Confirmed" && r.eventType === "combo"  
  ).length;  
  const confirmedBuildathonTeams = registrations.filter(  
    (r) => r.registrationStatus === "Confirmed" && r.eventType === "buildathon"  
  ).length;  
  const hostelStudents = registrations  
    .filter((r) => r.registrationStatus === "Confirmed")  
    .reduce((count, r) => count + (r.hostelMembers?.length || 0), 0);  
  const confirmedRegistrations = registrations.filter(  
    (r) => r.registrationStatus === "Confirmed"  
  );  
  const totalMembers = registrations.reduce(  
    (sum, r) => sum + (r.teamMembers?.length || 0),  
    0  
  );  
  const comboMembers = registrations  
    .filter((r) => r.eventType === "combo")  
    .reduce((sum, r) => sum + (r.teamMembers?.length || 0), 0);  
  const buildathonMembers = registrations  
    .filter((r) => r.eventType === "buildathon")  
    .reduce((sum, r) => sum + (r.teamMembers?.length || 0), 0);  
  const totalRevenue = confirmedRegistrations.reduce(  
    (sum, r) => sum + (r.expectedAmount || 0),  
    0  
  );  
  const comboRevenue = confirmedRegistrations  
    .filter((r) => r.eventType === "combo")  
    .reduce((sum, r) => sum + (r.expectedAmount || 0), 0);  
  const buildathonRevenue = confirmedRegistrations  
    .filter((r) => r.eventType === "buildathon")  
    .reduce((sum, r) => sum + (r.expectedAmount || 0), 0);

  const statusData = [  
    { name: "Pending", value: pendingCount },  
    { name: "Confirmed", value: confirmedCount },  
  ];  
  const eventData = [  
    { name: "Combo", value: comboCount },  
    { name: "Buildathon", value: buildathonCount },  
  ];

  const collegeAnalytics = useMemo(() => {  
    const collegeCounts: Record<string, number> = {};  
    registrations.forEach((reg) => {  
      reg.teamMembers?.forEach((member: any) => {  
        const college = normalizeCollege(member.college) || "Unknown";  
        collegeCounts[college] = (collegeCounts[college] || 0) + 1;  
      });  
    });  
    return Object.entries(collegeCounts)  
      .map(([name, value]) => ({ name, value }))  
      .sort((a, b) => b.value - a.value);  
  }, [registrations]);

  const maxCollegeCount = collegeAnalytics[0]?.value || 1;

  /* ── FETCH ── */  
  const fetchRegistrations = async () => {  
    try {  
      const res = await axios.get(  
        "VITE_API_URL/api/registrations",  
        {  
          headers: { Authorization: `Bearer ${token}` },  
        }  
      );  
      const newData = res.data;  
      if (registrations.length > 0) {  
        const newOnes = newData.filter(  
          (r: any) => !registrations.some((old) => old._id === r._id)  
        );  
        if (newOnes.length > 0) {  
          setLatestRegistrations(newOnes);  
          setNewRegsBannerDismissed(false);  
        }  
      }  
      setRegistrations(newData);  
    } catch (error: any) {  
      if (error.response?.status === 401) {  
        alert("Session expired. Please login again.");  
        localStorage.removeItem("token");  
        navigate("/");  
      }  
      console.error("Registration Fetch Error:", error);  
    }  
  };

  const confirmRegistration = async (id: string) => {  
    if (!confirm("Confirm this registration?")) return;  
    try {  
      await axios.put(  
        `VITE_API_URL/api/confirm/${id}`,  
        {},  
        { headers: { Authorization: `Bearer ${token}` } }  
      );  
      fetchRegistrations();  
    } catch (error) {  
      console.error("Confirmation error:", error);  
    }  
  };

  const deleteRegistration = async (id: string) => {  
    if (!confirm("Delete this registration?")) return;  
    await axios.delete(`VITE_API_URL/api/${id}`, {  
      headers: { Authorization: `Bearer ${token}` },  
    });  
    fetchRegistrations();  
  };

  /* ── HELPERS ── */  
  const formatDate = (date: string) => {  
    if (!date) return "-";  
    const d = new Date(date);  
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getFullYear()).slice(-2)}`;  
  };

  const filteredRegistrations = (viewStatus: string) =>  
    registrations  
      .filter((reg) => {  
        if (registrationFilter === "startup")  
          return (reg.startup?.answer || "").toLowerCase() === "yes";  
        if (registrationFilter === "hostel")  
          return (  
            reg.accommodationRequired === true && reg.hostelMembers?.length > 0  
          );  
        if (registrationFilter !== "all")  
          return reg.eventType === registrationFilter;  
        return true;  
      })  
      .filter((reg) => reg.registrationStatus === viewStatus)  
      .filter((reg) => {  
        const term = searchTerm.toLowerCase();  
        return (  
          reg.teamName.toLowerCase().includes(term) ||  
          reg.teamMembers.some((m: any) =>  
            m.rollNo?.toLowerCase().includes(term)  
          )  
        );  
      })  
      .sort(  
        (a, b) =>  
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()  
      );

  const exportRegistrations = () => {  
    const confirmed = registrations.filter(  
      (r) => r.registrationStatus === "Confirmed"  
    );  
    const combo = confirmed.filter((r) => r.eventType === "combo");  
    const buildathon = confirmed.filter((r) => r.eventType === "buildathon");  
    const hostel = confirmed.filter((r) => r.hostelMembers?.length > 0);  
    const createRows = (data: any[]) => {  
      const rows: any[] = [];  
      rows.push([  
        "Date & Time",  
        "Reg ID",  
        "Event",  
        "Team",  
        "Members",  
        "Team Members",  
        "Team Roll Numbers",  
        "Team Years",  
        "Team Colleges",  
        "Team Phone Numbers",  
        "Team Emails",  
        "Hostel Members",  
        "Arrival date and time",  
        "Departure date and time",  
        "Startup",  
        "Idea",  
        "Transaction ID",  
        "Amount",  
        "Status",  
      ]);  
      data.forEach((reg) => {  
        reg.teamMembers.forEach((member: any, index: number) => {  
          const isHostelMember = reg.hostelMembers?.some(  
            (h: any) => h.rollNo === member.rollNo  
          );  
          rows.push([  
            index === 0  
              ? `${formatDate(reg.createdAt)}, ${new Date(reg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`  
              : "",  
            index === 0 ? reg.registrationId : "",  
            index === 0 ? reg.eventName : "",  
            index === 0 ? reg.teamName : "",  
            index === 0 ? reg.teamSize : "",  
            member.fullName || "",  
            member.rollNo || "",  
            member.year || "",  
            member.college || "",  
            member.phone || "",  
            member.email || "",  
            reg.hostelMembers?.find((h: any) => h.rollNo === member.rollNo)  
              ?.rollNo || "-",  
            isHostelMember && reg.arrivalDate  
              ? `${formatDate(reg.arrivalDate)}, ${reg.arrivalTime}`  
              : "-",  
            isHostelMember && reg.departureDate  
              ? `${formatDate(reg.departureDate)}, ${reg.departureTime}`  
              : "-",  
            index === 0 ? reg.startup?.answer || "No" : "",  
            index === 0 ? reg.startup?.idea || "-" : "",  
            index === 0 ? "'" + (reg.payment?.userTransactionId || "") : "",  
            index === 0 ? reg.expectedAmount || "" : "",  
            index === 0 ? reg.registrationStatus : "",  
          ]);  
        });  
      });  
      return rows;  
    };  
    const workbook = XLSX.utils.book_new();  
    XLSX.utils.book_append_sheet(  
      workbook,  
      XLSX.utils.aoa_to_sheet(createRows(combo)),  
      "Combo"  
    );  
    XLSX.utils.book_append_sheet(  
      workbook,  
      XLSX.utils.aoa_to_sheet(createRows(buildathon)),  
      "Buildathon"  
    );  
    XLSX.utils.book_append_sheet(  
      workbook,  
      XLSX.utils.aoa_to_sheet(createRows(hostel)),  
      "Hostel"  
    );  
    const excelBuffer = XLSX.write(workbook, {  
      bookType: "xlsx",  
      type: "array",  
    });  
    saveAs(  
      new Blob([excelBuffer], {  
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  
      }),  
      "arduino-days-2026-registrations.xlsx"  
    );  
  };

  /* ── EFFECTS ── */  
  useEffect(() => {  
    fetchRegistrations();  
    const interval = setInterval(fetchRegistrations, 10000);  
    return () => clearInterval(interval);  
  }, []);

  /* ══ RENDER ══ */  
  return (  
    <div>  
      {/* HEADER */}  
      <div className="mb-8">  
        <h2  
          className="text-2xl font-bold mb-1"  
          style={{ fontFamily: "'Inter', sans-serif" }}  
        >  
          Registrations  
        </h2>  
        <div className="flex items-center gap-3 mt-3 flex-wrap">  
          {/* Registration open/closed badge */}  
          <span  
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"  
            style={{  
              backgroundColor: registrationOpen  
                ? "rgba(34,197,94,0.1)"  
                : "rgba(239,68,68,0.1)",  
              color: registrationOpen ? "#22c55e" : "#ef4444",  
              border: `1px solid ${registrationOpen ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,  
            }}  
          >  
            <span  
              className="w-1.5 h-1.5 rounded-full"  
              style={{  
                backgroundColor: registrationOpen ? "#22c55e" : "#ef4444",  
                animation: registrationOpen ? "pulse 2s infinite" : "none",  
              }}  
            />  
            {registrationOpen ? "Registrations Open" : "Registrations Closed"}  
          </span>  
          {/* Live indicator */}  
          <span  
            className="inline-flex items-center gap-2 text-xs"  
            style={{ color: "#22c55e" }}  
          >  
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />  
            Live Updates  
          </span>  
        </div>  
      </div>

      {/* New registrations banner */}  
      {latestRegistrations.length > 0 && !newRegsBannerDismissed && (  
        <div  
          className="mb-6 p-4 rounded-xl flex items-start justify-between gap-4"  
          style={{  
            backgroundColor: "rgba(59,130,246,0.08)",  
            border: "1px solid rgba(59,130,246,0.2)",  
          }}  
        >  
          <div>  
            <p  
              className="text-sm font-semibold mb-1"  
              style={{ color: "#60a5fa" }}  
            >  
              🔔 New Registrations  
            </p>  
            {latestRegistrations.map((reg, i) => (  
              <p key={i} className="text-xs" style={{ color: "#8A8578" }}>  
                🚀 {reg.teamName} registered for {reg.eventName}  
              </p>  
            ))}  
          </div>  
          <button  
            onClick={() => setNewRegsBannerDismissed(true)}  
            style={{ color: "#8A8578" }}  
          >  
            <X size={16} />  
          </button>  
        </div>  
      )}

      {/* ANALYTICS CARDS */}  
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">  
        <StatCard label="Total Revenue" value={`₹${totalRevenue}`} color="emerald" icon={DollarSign} />  
        <StatCard label="Combo Revenue" value={`₹${comboRevenue}`} color="blue" icon={TrendingUp} />  
        <StatCard label="Buildathon Revenue" value={`₹${buildathonRevenue}`} color="purple" icon={TrendingUp} />  
        <StatCard label="Confirmed Combo" value={confirmedComboTeams} color="cyan" icon={Check} />  
        <StatCard label="Confirmed Buildathon" value={confirmedBuildathonTeams} color="blue" icon={Check} />  
        <StatCard label="Hostel Required" value={hostelCount} color="orange" icon={Home} />  
        <StatCard label="Total Teams" value={totalCount} color="cyan" icon={Users} />  
        <StatCard label="Pending" value={pendingCount} color="yellow" icon={BookOpen} />  
        <StatCard label="Total Members" value={totalMembers} color="cyan" icon={Users} />  
        <StatCard label="Combo Members" value={comboMembers} color="blue" icon={Users} />  
        <StatCard label="Buildathon Members" value={buildathonMembers} color="purple" icon={Users} />  
        <StatCard label="Hostel Students" value={hostelStudents} color="orange" icon={Home} />  
      </div>

      {/* CHARTS */}  
      <div className="grid md:grid-cols-3 gap-4 mb-8">  
        <div className="p-5 rounded-xl" style={cardStyle}>  
          <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: "#8A8578" }}>  
            Registration Status  
          </h3>  
          <ResponsiveContainer width="100%" height={220}>  
            <PieChart>  
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={80} label>  
                {statusData.map((_, index) => (  
                  <Cell key={index} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />  
                ))}  
              </Pie>  
              <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #EBE8E2", borderRadius: "8px", color: "#1C1B22" }} />  
              <Legend />  
            </PieChart>  
          </ResponsiveContainer>  
        </div>  
        <div className="p-5 rounded-xl" style={cardStyle}>  
          <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: "#8A8578" }}>  
            Event Type  
          </h3>  
          <ResponsiveContainer width="100%" height={220}>  
            <PieChart>  
              <Pie data={eventData} dataKey="value" nameKey="name" outerRadius={80} label>  
                {eventData.map((_, index) => (  
                  <Cell key={index} fill={EVENT_COLORS[index % EVENT_COLORS.length]} />  
                ))}  
              </Pie>  
              <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #EBE8E2", borderRadius: "8px", color: "#1C1B22" }} />  
              <Legend />  
            </PieChart>  
          </ResponsiveContainer>  
        </div>  
        <div className="p-5 rounded-xl" style={cardStyle}>  
          <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: "#8A8578" }}>  
            🏫 Top Colleges  
          </h3>  
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">  
            {collegeAnalytics.map((college, index) => (  
              <div key={index}>  
                <div className="flex justify-between items-center mb-1">  
                  <span className="text-xs font-medium" style={{ color: "#8A8578" }}>  
                    {index + 1}. {collegeMap[normalizeCollege(college.name)] || college.name}  
                  </span>  
                  <span className="text-xs font-semibold" style={{ color: "#22d3ee" }}>  
                    {college.value}  
                  </span>  
                </div>  
                <div className="h-1 rounded-full" style={{ backgroundColor: "#EBE8E2" }}>  
                  <div  
                    className="h-1 rounded-full"  
                    style={{  
                      width: `${(college.value / maxCollegeCount) * 100}%`,  
                      background: "linear-gradient(to right, #3b82f6, #06b6d4)",  
                    }}  
                  />  
                </div>  
              </div>  
            ))}  
          </div>  
        </div>  
      </div>

      {/* SEARCH + FILTER */}  
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-5">  
        <div className="relative">  
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#8A8578" }} />  
          <input  
            type="text"  
            placeholder="Search team name or roll no..."  
            value={searchTerm}  
            onChange={(e) => setSearchTerm(e.target.value)}  
            className="pl-9 pr-9 py-2.5 text-sm rounded-xl outline-none"  
            style={{ ...inputStyle, width: "260px" }}  
          />  
          {searchTerm && (  
            <button  
              onClick={() => setSearchTerm("")}  
              className="absolute right-3 top-1/2 -translate-y-1/2"  
              style={{ color: "#8A8578" }}  
            >  
              <X size={14} />  
            </button>  
          )}  
        </div>  
        <div  
          className="flex gap-1 p-1 rounded-xl"  
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #EBE8E2" }}  
        >  
          {["all", "combo", "buildathon", "hostel", "startup"].map((f) => (  
            <button  
              key={f}  
              onClick={() => setRegistrationFilter(f)}  
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"  
              style={{  
                backgroundColor: registrationFilter === f ? "rgba(59,130,246,0.15)" : "transparent",  
                color: registrationFilter === f ? "#60a5fa" : "#8A8578",  
                border: registrationFilter === f ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent",  
              }}  
            >  
              {f === "startup" ? "Startups" : f.charAt(0).toUpperCase() + f.slice(1)}  
            </button>  
          ))}  
        </div>  
      </div>

      {/* PENDING / CONFIRMED SEGMENTED CONTROL */}  
      <div  
        className="flex gap-1 p-1 rounded-xl w-fit mb-6"  
        style={{ backgroundColor: "#FFFFFF", border: "1px solid #EBE8E2" }}  
      >  
        <button  
          onClick={() => setRegistrationView("pending")}  
          className="px-5 py-2 rounded-lg text-sm font-medium transition-all"  
          style={{  
            backgroundColor: registrationView === "pending" ? "rgba(234,179,8,0.15)" : "transparent",  
            color: registrationView === "pending" ? "#eab308" : "#8A8578",  
            border: registrationView === "pending" ? "1px solid rgba(234,179,8,0.25)" : "1px solid transparent",  
          }}  
        >  
          Pending{" "}  
          <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: "rgba(234,179,8,0.15)" }}>  
            {pendingCount}  
          </span>  
        </button>  
        <button  
          onClick={() => setRegistrationView("confirmed")}  
          className="px-5 py-2 rounded-lg text-sm font-medium transition-all"  
          style={{  
            backgroundColor: registrationView === "confirmed" ? "rgba(34,197,94,0.15)" : "transparent",  
            color: registrationView === "confirmed" ? "#22c55e" : "#8A8578",  
            border: registrationView === "confirmed" ? "1px solid rgba(34,197,94,0.25)" : "1px solid transparent",  
          }}  
        >  
          Confirmed{" "}  
          <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: "rgba(34,197,94,0.15)" }}>  
            {confirmedCount}  
          </span>  
        </button>  
      </div>

      <p className="text-xs mb-4 font-medium" style={{ color: "#8A8578" }}>  
        Showing {filteredRegistrations(registrationView === "pending" ? "Pending" : "Confirmed").length} results  
      </p>

      {/* PENDING CARDS */}  
      {registrationView === "pending" && (  
        <div className="grid md:grid-cols-2 gap-4">  
          {filteredRegistrations("Pending").map((reg) => (  
            <div key={reg._id} className="p-5 rounded-xl" style={cardStyle}>  
              <div className="flex items-start justify-between mb-3">  
                <h3 className="font-semibold text-base" style={{ color: "#1C1B22" }}>  
                  {reg.teamName}  
                </h3>  
                <span  
                  className="text-xs px-2 py-1 rounded-full font-mono"  
                  style={{ backgroundColor: "rgba(234,179,8,0.1)", color: "#eab308" }}  
                >  
                  {reg.registrationId}  
                </span>  
              </div>  
              <div className="flex items-center gap-2 mb-3 flex-wrap">  
                <span  
                  className="text-xs px-2.5 py-1 rounded-full"  
                  style={{  
                    backgroundColor: reg.eventType === "combo" ? "rgba(59,130,246,0.12)" : "rgba(168,85,247,0.12)",  
                    color: reg.eventType === "combo" ? "#60a5fa" : "#c084fc",  
                  }}  
                >  
                  {reg.eventName}  
                </span>  
                {reg.accommodationRequired && (  
                  <span  
                    className="text-xs px-2.5 py-1 rounded-full"  
                    style={{ backgroundColor: "rgba(249,115,22,0.12)", color: "#fb923c" }}  
                  >  
                    🏠 Hostel  
                  </span>  
                )}  
                {(reg.startup?.answer || "").toLowerCase() === "yes" && (  
                  <span  
                    className="text-xs px-2.5 py-1 rounded-full"  
                    style={{ backgroundColor: "rgba(236,72,153,0.12)", color: "#f472b6" }}  
                  >  
                    🚀 Startup  
                  </span>  
                )}  
                {reg.payment?.amountMismatch && (  
                  <span  
                    className="text-xs px-2.5 py-1 rounded-full"  
                    style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#f87171" }}  
                  >  
                    ⚠ Mismatch  
                  </span>  
                )}  
              </div>  
              <div className="mb-4">  
                <p className="text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#8A8578" }}>  
                  Team Members  
                </p>  
                <div className="space-y-0.5">  
                  {reg.teamMembers.map((m: any, i: number) => (  
                    <p key={i} className="text-xs" style={{ color: "#8A8578" }}>  
                      {i + 1}. {m.fullName}  
                    </p>  
                  ))}  
                </div>  
              </div>  
              <div  
                className="flex gap-2 flex-wrap pt-3"  
                style={{ borderTop: "1px solid #EBE8E2" }}  
              >  
                <button  
                  onClick={() => setSelectedFullDetails(reg)}  
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"  
                  style={{ backgroundColor: "rgba(6,182,212,0.1)", color: "#22d3ee", border: "1px solid rgba(6,182,212,0.2)" }}  
                >  
                  <Eye size={12} /> Details  
                </button>  
                <button  
                  onClick={() => confirmRegistration(reg._id)}  
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"  
                  style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}  
                >  
                  <Check size={12} /> Confirm  
                </button>  
                <button  
                  onClick={() => deleteRegistration(reg._id)}  
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"  
                  style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}  
                >  
                  <Trash2 size={12} /> Delete  
                </button>  
                {reg.payment?.screenshotUrl && (  
                  <button  
                    onClick={() => setSelectedScreenshot(reg.payment.screenshotUrl)}  
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"  
                    style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}  
                  >  
                    <Eye size={12} /> Payment  
                  </button>  
                )}  
              </div>  
            </div>  
          ))}  
        </div>  
      )}

      {/* CONFIRMED TABLE */}  
      {registrationView === "confirmed" && (  
        <>  
          <div className="flex justify-end mb-4">  
            <button  
              onClick={exportRegistrations}  
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"  
              style={{  
                background: "linear-gradient(135deg, #22c55e, #16a34a)",  
                color: "#fff",  
                boxShadow: "0 2px 12px rgba(34,197,94,0.25)",  
              }}  
            >  
              <Download size={14} /> Export Excel  
            </button>  
          </div>  
          <div className="overflow-x-auto rounded-xl" style={cardStyle}>  
            <table className="w-full">  
              <thead>  
                <tr style={{ borderBottom: "1px solid #EBE8E2" }}>  
                  {["#", "Date & Time", "Reg ID", "Team", "Members", "Event", "Hostel", "Actions"].map((h) => (  
                    <th  
                      key={h}  
                      className={`px-4 py-4 text-xs font-semibold uppercase tracking-widest ${h === "Actions" ? "text-center" : "text-left"}`}  
                      style={{ color: "#8A8578" }}  
                    >  
                      {h}  
                    </th>  
                  ))}  
                </tr>  
              </thead>  
              <tbody>  
                {filteredRegistrations("Confirmed").map((reg, index) => (  
                  <tr  
                    key={reg._id}  
                    className="transition-colors"  
                    style={{ borderBottom: "1px solid #EBE8E2" }}  
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.03)")}  
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}  
                  >  
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "#60a5fa" }}>  
                      {index + 1}  
                    </td>  
                    <td className="px-4 py-3 text-xs" style={{ color: "#8A8578" }}>  
                      {reg.createdAt  
                        ? `${formatDate(reg.createdAt)}, ${new Date(reg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`  
                        : "-"}  
                    </td>  
                    <td className="px-4 py-3">  
                      <span className="text-xs font-mono font-semibold" style={{ color: "#22c55e" }}>  
                        {reg.registrationId}  
                      </span>  
                    </td>  
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "#1C1B22" }}>  
                      {reg.teamName}  
                    </td>  
                    <td className="px-4 py-3 text-xs space-y-0.5" style={{ color: "#8A8578" }}>  
                      {(registrationFilter === "hostel" ? reg.hostelMembers : reg.teamMembers)?.map((m: any, i: number) => (  
                        <div key={i}>{i + 1}. {m.fullName}</div>  
                      ))}  
                    </td>  
                    <td className="px-4 py-3">  
                      <span  
                        className="text-xs px-2.5 py-1 rounded-full"  
                        style={{  
                          backgroundColor: reg.eventType === "combo" ? "rgba(59,130,246,0.12)" : "rgba(168,85,247,0.12)",  
                          color: reg.eventType === "combo" ? "#60a5fa" : "#c084fc",  
                        }}  
                      >  
                        {reg.eventName}  
                      </span>  
                    </td>  
                    <td className="px-4 py-3 text-xs" style={{ color: reg.accommodationRequired ? "#fb923c" : "#8A8578" }}>  
                      {reg.accommodationRequired ? "Yes" : "No"}  
                    </td>  
                    <td className="px-4 py-3">  
                      <div className="flex items-center gap-1.5 justify-center">  
                        <button  
                          onClick={() => setSelectedFullDetails(reg)}  
                          className="p-1.5 rounded-lg"  
                          style={{ backgroundColor: "rgba(6,182,212,0.1)", color: "#22d3ee", border: "1px solid rgba(6,182,212,0.2)" }}  
                        >  
                          <Eye size={13} />  
                        </button>  
                        {reg.payment?.screenshotUrl && (  
                          <button  
                            onClick={() => setSelectedScreenshot(reg.payment.screenshotUrl)}  
                            className="p-1.5 rounded-lg"  
                            style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}  
                          >  
                            <Eye size={13} />  
                          </button>  
                        )}  
                        <button  
                          onClick={() => deleteRegistration(reg._id)}  
                          className="p-1.5 rounded-lg"  
                          style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}  
                        >  
                          <Trash2 size={13} />  
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

      {/* SCREENSHOT MODAL */}  
      {selectedScreenshot && (  
        <div  
          className="fixed inset-0 z-50 flex items-center justify-center p-4"  
          style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}  
          onClick={() => setSelectedScreenshot(null)}  
        >  
          <div  
            className="relative rounded-2xl overflow-hidden"  
            style={{ ...cardStyle, maxWidth: "90vw", maxHeight: "90vh" }}  
            onClick={(e) => e.stopPropagation()}  
          >  
            <button  
              onClick={() => setSelectedScreenshot(null)}  
              className="absolute top-3 right-3 p-1.5 rounded-lg z-10"  
              style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#f87171" }}  
            >  
              <X size={16} />  
            </button>  
            <img  
              src={selectedScreenshot}  
              alt="Payment Screenshot"  
              className="rounded-2xl"  
              style={{ maxHeight: "85vh", objectFit: "contain" }}  
            />  
          </div>  
        </div>  
      )}

      {/* FULL DETAILS MODAL */}  
      {selectedFullDetails && (  
        <div  
          className="fixed inset-0 z-50 flex items-center justify-center p-4"  
          style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}  
          onClick={() => setSelectedFullDetails(null)}  
        >  
          <div  
            className="rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"  
            style={{ ...cardStyle, padding: "28px" }}  
            onClick={(e) => e.stopPropagation()}  
          >  
            <div className="flex items-center justify-between mb-6">  
              <h3  
                className="text-xl font-bold"  
                style={{ fontFamily: "'Inter', sans-serif", color: "#1C1B22" }}  
              >  
                Registration Details  
              </h3>  
              <button  
                onClick={() => setSelectedFullDetails(null)}  
                className="p-1.5 rounded-lg"  
                style={{ backgroundColor: "rgba(100,116,139,0.1)", color: "#8A8578" }}  
              >  
                <X size={16} />  
              </button>  
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">  
              {[  
                {  
                  label: "Registered On",  
                  value: selectedFullDetails.createdAt  
                    ? `${formatDate(selectedFullDetails.createdAt)}, ${new Date(selectedFullDetails.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`  
                    : "-",  
                },  
                { label: "Registration ID", value: selectedFullDetails.registrationId },  
                { label: "Team Name", value: selectedFullDetails.teamName },  
                { label: "Event", value: selectedFullDetails.eventName },  
                { label: "Event Type", value: selectedFullDetails.eventType },  
                {  
                  label: "Accommodation",  
                  value: selectedFullDetails.accommodationRequired ? "Required" : "Not Required",  
                },  
                {  
                  label: "Transaction ID",  
                  value: selectedFullDetails.payment?.userTransactionId || "Not Available",  
                },  
                { label: "Startup Team", value: selectedFullDetails.startup?.answer || "No" },  
                {  
                  label: "Payment Screenshot",  
                  value: selectedFullDetails.payment?.screenshotUrl ? "Submitted" : "Not Submitted",  
                },  
              ].map(({ label, value }) => (  
                <div  
                  key={label}  
                  className="p-3 rounded-lg"  
                  style={{ backgroundColor: "#FAF9F7", border: "1px solid #EBE8E2" }}  
                >  
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#8A8578" }}>  
                    {label}  
                  </p>  
                  <p className="text-sm font-medium" style={{ color: "#1C1B22" }}>  
                    {value}  
                  </p>  
                </div>  
              ))}  
            </div>

            {selectedFullDetails.accommodationRequired && (  
              <div  
                className="mb-4 p-3 rounded-lg"  
                style={{ backgroundColor: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.12)" }}  
              >  
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#fb923c" }}>  
                  Accommodation Details  
                </p>  
                <p className="text-sm" style={{ color: "#8A8578" }}>  
                  Arrival:{" "}  
                  {selectedFullDetails.arrivalDate  
                    ? `${formatDate(selectedFullDetails.arrivalDate)}, ${selectedFullDetails.arrivalTime || "-"}`  
                    : "-"}  
                </p>  
                <p className="text-sm" style={{ color: "#8A8578" }}>  
                  Departure:{" "}  
                  {selectedFullDetails.departureDate  
                    ? `${formatDate(selectedFullDetails.departureDate)}, ${selectedFullDetails.departureTime || "-"}`  
                    : "-"}  
                </p>  
              </div>  
            )}

            {selectedFullDetails.startup?.answer?.toLowerCase() === "yes" && (  
              <div  
                className="mb-4 p-3 rounded-lg"  
                style={{ backgroundColor: "rgba(236,72,153,0.06)", border: "1px solid rgba(236,72,153,0.12)" }}  
              >  
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#f472b6" }}>  
                  Startup Idea  
                </p>  
                <p className="text-sm" style={{ color: "#8A8578" }}>  
                  {selectedFullDetails.startup?.idea || "-"}  
                </p>  
              </div>  
            )}

            {selectedFullDetails.hostelMembers?.length > 0 && (  
              <div className="mb-4">  
                <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: "#8A8578" }}>  
                  Hostel Members  
                </p>  
                <div className="space-y-1.5">  
                  {selectedFullDetails.hostelMembers.map((m: any, i: number) => (  
                    <div  
                      key={i}  
                      className="px-3 py-2 rounded-lg text-sm"  
                      style={{ backgroundColor: "#FAF9F7", color: "#8A8578" }}  
                    >  
                      {i + 1}. {m.fullName}  
                    </div>  
                  ))}  
                </div>  
              </div>  
            )}

            <div>  
              <p className="text-xs uppercase tracking-wider mb-3 font-semibold" style={{ color: "#8A8578" }}>  
                Team Members  
              </p>  
              <div className="space-y-3">  
                {selectedFullDetails.teamMembers.map((m: any, i: number) => (  
                  <div  
                    key={i}  
                    className="p-4 rounded-xl"  
                    style={{ backgroundColor: "#FAF9F7", border: "1px solid #EBE8E2" }}  
                  >  
                    <p className="font-semibold text-sm mb-3" style={{ color: "#60a5fa" }}>  
                      {i + 1}. {m.fullName}  
                    </p>  
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">  
                      {[  
                        ["Roll No", m.rollNo],  
                        ["Email", m.email],  
                        ["Phone", m.phone],  
                        ["Department", m.department],  
                        ["Year", m.year],  
                        ["College", m.college],  
                        ["City", m.collegeCity],  
                        ["District", m.collegeDistrict],  
                        ["State", m.collegeState],  
                        ["Pincode", m.collegePincode],  
                      ].map(([k, v]) =>  
                        v && v !== "N/A" ? (  
                          <div key={k}>  
                            <span className="text-xs" style={{ color: "#8A8578" }}>{k}: </span>  
                            <span className="text-xs" style={{ color: "#8A8578" }}>{v}</span>  
                          </div>  
                        ) : null  
                      )}  
                    </div>  
                  </div>  
                ))}  
              </div>  
            </div>

            <div className="mt-6 flex justify-end">  
              <button  
                onClick={() => setSelectedFullDetails(null)}  
                className="px-5 py-2 rounded-xl text-sm font-medium"  
                style={{  
                  backgroundColor: "rgba(100,116,139,0.1)",  
                  color: "#8A8578",  
                  border: "1px solid rgba(100,116,139,0.15)",  
                }}  
              >  
                Close  
              </button>  
            </div>  
          </div>  
        </div>  
      )}  
    </div>  
  );  
};

export default ArduinoRegistrationsTab;