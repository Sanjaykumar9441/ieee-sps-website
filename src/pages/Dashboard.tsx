import { useEffect, useState, useMemo } from "react";
import axios from "axios";

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

import {
  Calendar,
  Mail,
  Upload,
  LogOut,
  Users,
  Menu,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Check,
  Zap,
  TrendingUp,
  DollarSign,
  BookOpen,
  Home,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const STATUS_COLORS = ["#eab308", "#22c55e"];
const EVENT_COLORS = ["#3b82f6", "#a855f7"];

/* ── STYLE HELPERS ── */
const inputStyle: React.CSSProperties = {
  backgroundColor: "#080c14",
  border: "1px solid rgba(99,179,237,0.12)",
  color: "#f0f4ff",
  borderRadius: "10px",
  padding: "10px 14px",
  width: "100%",
  fontSize: "14px",
  outline: "none",
  transition: "border 0.2s, box-shadow 0.2s",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#0f1624",
  border: "1px solid rgba(99,179,237,0.10)",
  borderRadius: "14px",
};

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  as,
  children,
}: any) => {
  const [focused, setFocused] = useState(false);
  const focusStyle = focused
    ? {
        border: "1px solid rgba(59,130,246,0.6)",
        boxShadow: "0 0 0 3px rgba(59,130,246,0.08)",
      }
    : {};

  if (as === "select") {
    return (
      <div>
        <label
          className="block text-xs font-medium mb-1.5 uppercase tracking-widest"
          style={{ color: "#64748b" }}
        >
          {label}
        </label>
        <select
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...inputStyle, ...focusStyle }}
          className="appearance-none"
        >
          {children}
        </select>
      </div>
    );
  }
  if (as === "textarea") {
    return (
      <div>
        <label
          className="block text-xs font-medium mb-1.5 uppercase tracking-widest"
          style={{ color: "#64748b" }}
        >
          {label}
        </label>
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={3}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...inputStyle, ...focusStyle, resize: "vertical" }}
        />
      </div>
    );
  }
  return (
    <div>
      <label
        className="block text-xs font-medium mb-1.5 uppercase tracking-widest"
        style={{ color: "#64748b" }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...inputStyle, ...focusStyle }}
      />
    </div>
  );
};

const GradientButton = ({
  onClick,
  children,
  color = "blue",
  className = "",
  disabled = false,
  small = false,
}: any) => {
  const gradients: Record<string, string> = {
    blue: "linear-gradient(135deg, #3b82f6, #06b6d4)",
    green: "linear-gradient(135deg, #22c55e, #16a34a)",
    red: "linear-gradient(135deg, #ef4444, #dc2626)",
    gray: "linear-gradient(135deg, #475569, #334155)",
    purple: "linear-gradient(135deg, #a855f7, #7c3aed)",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-medium rounded-lg transition-all duration-150 ${small ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm"} ${className}`}
      style={{
        background: gradients[color] || gradients.blue,
        color: "#fff",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 2px 12px rgba(59,130,246,0.2)",
      }}
    >
      {children}
    </button>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    Upcoming: {
      bg: "rgba(34,197,94,0.12)",
      color: "#22c55e",
      label: "Upcoming",
    },
    Completed: {
      bg: "rgba(59,130,246,0.12)",
      color: "#60a5fa",
      label: "Completed",
    },
    Pending: { bg: "rgba(234,179,8,0.12)", color: "#eab308", label: "Pending" },
    Confirmed: {
      bg: "rgba(34,197,94,0.12)",
      color: "#22c55e",
      label: "Confirmed",
    },
  };
  const c = config[status] || {
    bg: "rgba(100,116,139,0.12)",
    color: "#64748b",
    label: status,
  };
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
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
        backgroundColor: "#0f1624",
        border: `1px solid ${c.border}`,
        background: `linear-gradient(135deg, #0f1624, ${c.bg})`,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-xs font-medium uppercase tracking-wider mb-2"
            style={{ color: "#64748b" }}
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

/* ── EDITABLE EVENT ── */
const EditableEvent = ({ event, onUpdate, onDelete }: any) => {
  const [edit, setEdit] = useState(false);
  const [data, setData] = useState({
    title: event.title,
    description: event.description,
    date: event.date,
    location: event.location,
    status: event.status,
    pageType: event.pageType || "regular",
    customPage: event.customPage || "",
    images: null,
  });

  return (
    <>
      <tr
        className="border-b transition-colors"
        style={{ borderColor: "rgba(99,179,237,0.08)" }}
      >
        <td
          className="px-5 py-4 text-sm font-medium"
          style={{ color: "#f0f4ff" }}
        >
          {event.title}
        </td>
        <td className="px-5 py-4">
          <StatusBadge status={event.status} />
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-2 justify-center">
            <button
              onClick={() => setEdit(!edit)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: "rgba(59,130,246,0.12)",
                color: "#60a5fa",
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              {edit ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {edit ? "Collapse" : "Edit"}
            </button>
            <button
              onClick={() => onDelete(event._id)}
              className="p-1.5 rounded-lg transition-all"
              style={{
                backgroundColor: "rgba(239,68,68,0.1)",
                color: "#f87171",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
      {edit && (
        <tr style={{ backgroundColor: "rgba(15,22,36,0.8)" }}>
          <td colSpan={3} className="px-5 py-5">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Title"
                value={data.title}
                onChange={(e: any) =>
                  setData({ ...data, title: e.target.value })
                }
                placeholder="Event title"
              />
              <InputField
                label="Date"
                type="date"
                value={data.date}
                onChange={(e: any) =>
                  setData({ ...data, date: e.target.value })
                }
              />
              <InputField
                label="Location"
                value={data.location}
                onChange={(e: any) =>
                  setData({ ...data, location: e.target.value })
                }
                placeholder="Location"
              />
              <InputField
                label="Status"
                as="select"
                value={data.status}
                onChange={(e: any) =>
                  setData({ ...data, status: e.target.value })
                }
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
              </InputField>
              <InputField
                label="Page Type"
                as="select"
                value={data.pageType}
                onChange={(e: any) =>
                  setData({ ...data, pageType: e.target.value })
                }
              >
                <option value="regular">Regular Event</option>
                <option value="custom">Custom Event</option>
              </InputField>

              {data.pageType === "custom" && (
                <InputField
                  label="Custom Page"
                  as="select"
                  value={data.customPage}
                  onChange={(e: any) =>
                    setData({ ...data, customPage: e.target.value })
                  }
                >
                  <option value="">Select Page</option>
                  <option value="arduino-days">Arduino Days</option>
                </InputField>
              )}
              <div className="col-span-2">
                <InputField
                  label="Description"
                  as="textarea"
                  value={data.description}
                  onChange={(e: any) =>
                    setData({ ...data, description: e.target.value })
                  }
                  placeholder="Event description"
                />
              </div>
              {data.status === "Completed" && (
                <div className="col-span-2">
                  <label
                    className="block text-xs font-medium mb-1.5 uppercase tracking-widest"
                    style={{ color: "#64748b" }}
                  >
                    Event Images
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e: any) =>
                      setData({ ...data, images: e.target.files })
                    }
                    className="text-sm"
                    style={{ color: "#94a3b8" }}
                  />
                </div>
              )}
              <div className="col-span-2 flex gap-3 pt-2">
                <GradientButton
                  color="green"
                  small
                  onClick={() => {
                    onUpdate(event, data);
                    setEdit(false);
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <Check size={12} /> Save Changes
                  </span>
                </GradientButton>
                <GradientButton
                  color="gray"
                  small
                  onClick={() => setEdit(false)}
                >
                  Cancel
                </GradientButton>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

/* ══════════════════════════════════════════
  DASHBOARD
══════════════════════════════════════════ */
const Dashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);

  useEffect(() => {
    if (!token) navigate("/");
  }, [token, navigate]);

  const fetchRegistrationStatus = async () => {
    const res = await axios.get(
      "https://ieee-sps-website.onrender.com/events/registration-status",
    );
    setRegistrationOpen(res.data.registrationOpen);
  };

  useEffect(() => {
    fetchRegistrationStatus();
  }, []);

  const [activeTab, setActiveTab] = useState(
    localStorage.getItem("adminTab") || "upload",
  );

  /* EVENTS */
  const [events, setEvents] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("Upcoming");
  const [pageType, setPageType] = useState("regular");
  const [customPage, setCustomPage] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  /* TEAM */
  const [members, setMembers] = useState<any[]>([]);
  const [teamView, setTeamView] = useState("add");
  const [editMember, setEditMember] = useState<any>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [email, setEmail] = useState("");
  const [priority, setPriority] = useState(5);
  const [photo, setPhoto] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(
    null,
  );
  const [selectedFullDetails, setSelectedFullDetails] = useState<any>(null);

  /* REGISTRATIONS */
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [latestRegistrations, setLatestRegistrations] = useState<any[]>([]);
  const [newRegsBannerDismissed, setNewRegsBannerDismissed] = useState(false);

  const totalCount = registrations.length;
  const pendingCount = registrations.filter(
    (r) => r.registrationStatus === "Pending",
  ).length;
  const confirmedCount = registrations.filter(
    (r) => r.registrationStatus === "Confirmed",
  ).length;
  const comboCount = registrations.filter(
    (r) => r.eventType === "combo",
  ).length;
  const buildathonCount = registrations.filter(
    (r) => r.eventType === "buildathon",
  ).length;
  const hostelCount = registrations.filter(
    (r) => r.accommodationRequired === true,
  ).length;
  const confirmedComboTeams = registrations.filter(
    (r) => r.registrationStatus === "Confirmed" && r.eventType === "combo",
  ).length;
  const confirmedBuildathonTeams = registrations.filter(
    (r) => r.registrationStatus === "Confirmed" && r.eventType === "buildathon",
  ).length;
  const hostelStudents = registrations
    .filter((r) => r.registrationStatus === "Confirmed")
    .reduce((count, r) => count + (r.hostelMembers?.length || 0), 0);
  const confirmedRegistrations = registrations.filter(
    (r) => r.registrationStatus === "Confirmed",
  );
  const totalMembers = registrations.reduce(
    (sum, r) => sum + (r.teamMembers?.length || 0),
    0,
  );
  const comboMembers = registrations
    .filter((r) => r.eventType === "combo")
    .reduce((sum, r) => sum + (r.teamMembers?.length || 0), 0);
  const buildathonMembers = registrations
    .filter((r) => r.eventType === "buildathon")
    .reduce((sum, r) => sum + (r.teamMembers?.length || 0), 0);
  const totalRevenue = confirmedRegistrations.reduce(
    (sum, r) => sum + (r.expectedAmount || 0),
    0,
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

  const [registrationView, setRegistrationView] = useState("pending");
  const [registrationFilter, setRegistrationFilter] = useState("all");

  /* MESSAGES */
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    fetchEvents();
    fetchMembers();
    fetchRegistrations();
    const interval = setInterval(() => {
      if (activeTab === "registrations") fetchRegistrations();
    }, 10000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (activeTab === "messages") fetchMessages();
  }, [activeTab]);

  /* FETCH */
  const fetchEvents = async () => {
    const res = await axios.get("https://ieee-sps-website.onrender.com/events");
    setEvents(res.data);
  };

  const fetchMembers = async () => {
    const res = await axios.get("https://ieee-sps-website.onrender.com/team");
    setMembers(
      res.data.sort(
        (a: any, b: any) => Number(a.priority) - Number(b.priority),
      ),
    );
  };

  const fetchRegistrations = async () => {
    try {
      const res = await axios.get(
        "https://ieee-sps-website.onrender.com/api/registrations",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const newData = res.data;
      if (registrations.length > 0) {
        const newOnes = newData.filter(
          (r: any) => !registrations.some((old) => old._id === r._id),
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
        `https://ieee-sps-website.onrender.com/api/confirm/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchRegistrations();
    } catch (error) {
      console.error("Confirmation error:", error);
    }
  };

  const deleteRegistration = async (id: string) => {
    if (!confirm("Delete this registration?")) return;
    await axios.delete(`https://ieee-sps-website.onrender.com/api/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchRegistrations();
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(
        "https://ieee-sps-website.onrender.com/contact",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessages(res.data);
    } catch (error) {
      console.error("Message Fetch Error:", error);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    await axios.delete(`https://ieee-sps-website.onrender.com/contact/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchMessages();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  /* UPLOAD EVENT */
  const handleEventUpload = async (e: any) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("date", date);
    formData.append("location", location);
    formData.append("status", status);
    formData.append("pageType", pageType);
    formData.append("customPage", customPage);
    if (images) {
      for (let i = 0; i < images.length; i++)
        formData.append("images", images[i]);
    }
    await axios.post("https://ieee-sps-website.onrender.com/events", formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert("Event Uploaded Successfully");
    setTitle("");
    setDescription("");
    setDate("");
    setLocation("");
    setStatus("Upcoming");
    setPageType("regular");
    setCustomPage("");
    setImages(null);
    fetchEvents();
  };

  /* UPDATE EVENT */
  const handleUpdate = async (event: any, newData: any) => {
    try {
      const formData = new FormData();
      formData.append("title", newData.title);
      formData.append("description", newData.description);
      formData.append("date", newData.date);
      formData.append("location", newData.location);
      formData.append("status", newData.status);
      formData.append("pageType", newData.pageType);
      formData.append("customPage", newData.customPage);
      if (newData.newImages && newData.newImages.length > 0) {
        for (let i = 0; i < newData.newImages.length; i++)
          formData.append("images", newData.newImages[i]);
      }
      await axios.put(
        `https://ieee-sps-website.onrender.com/events/${event._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Event Updated Successfully");
      fetchEvents();
    } catch (error) {
      console.error("Update Error:", error);
      alert("Error updating event");
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await axios.delete(`https://ieee-sps-website.onrender.com/events/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchEvents();
  };

  /* ADD MEMBER */
  const handleAddMember = async (e: any) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("role", role);
    formData.append("department", department);
    formData.append("rollNumber", rollNumber);
    formData.append("registrationNumber", registrationNumber);
    formData.append("email", email);
    formData.append("priority", priority.toString());
    if (photo) formData.append("photo", photo);
    await axios.post("https://ieee-sps-website.onrender.com/team", formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert("Member Added Successfully");
    setName("");
    setRole("");
    setDepartment("");
    setRollNumber("");
    setRegistrationNumber("");
    setEmail("");
    setPriority(5);
    setPhoto(null);
    fetchMembers();
  };

  const deleteMember = async (id: string) => {
    if (!confirm("Delete this member?")) return;
    await axios.delete(`https://ieee-sps-website.onrender.com/team/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchMembers();
  };

  const handleUpdateMember = async (member: any) => {
    const formData = new FormData();
    formData.append("name", member.name);
    formData.append("role", member.role);
    formData.append("department", member.department);
    formData.append("rollNumber", member.rollNumber);
    formData.append("registrationNumber", member.registrationNumber);
    formData.append("email", member.email);
    formData.append("priority", member.priority);
    if (member.newPhoto) formData.append("photo", member.newPhoto);
    await axios.put(
      `https://ieee-sps-website.onrender.com/team/${member._id}`,
      formData,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    alert("Member Updated Successfully");
    setEditMember(null);
    fetchMembers();
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getFullYear()).slice(-2)}`;
  };

  const exportRegistrations = () => {
    const confirmed = registrations.filter(
      (r) => r.registrationStatus === "Confirmed",
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
            (h: any) => h.rollNo === member.rollNo,
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
      "Combo",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(createRows(buildathon)),
      "Buildathon",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(createRows(hostel)),
      "Hostel",
    );
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    saveAs(
      new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "arduino-days-2026-registrations.xlsx",
    );
  };

  /* MENU */
  const menu = [
    { id: "upload", label: "Upload Event", icon: Upload },
    { id: "events", label: "Manage Events", icon: Calendar },
    { id: "team", label: "Team Management", icon: Users },
    { id: "messages", label: "Messages", icon: Mail },
    { id: "registrations", label: "Registrations", icon: BookOpen },
  ];

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
            m.rollNo?.toLowerCase().includes(term),
          )
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

  /* ══ RENDER ══ */
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#080c14", color: "#f0f4ff" }}
    >
      {/* HEADER */}
      <header
        className="flex items-center justify-between px-6 py-4 sticky top-0 z-30"
        style={{
          backgroundColor: "rgba(8,12,20,0.95)",
          borderBottom: "1px solid rgba(99,179,237,0.08)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden p-2 rounded-lg transition-colors"
            style={{ color: "#64748b" }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              }}
            >
              <Zap size={14} className="text-foreground" />
            </div>
            <div>
              <span
                className="font-bold text-sm tracking-wide"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  color: "#f0f4ff",
                }}
              >
                IEEE SPS
              </span>
              <span
                className="text-xs ml-2 px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(59,130,246,0.12)",
                  color: "#60a5fa",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                Admin
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            backgroundColor: "rgba(239,68,68,0.08)",
            color: "#f87171",
            border: "1px solid rgba(239,68,68,0.15)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor =
              "rgba(239,68,68,0.15)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor =
              "rgba(239,68,68,0.08)";
          }}
        >
          <LogOut size={15} />
          Logout
        </button>
      </header>

      <div className="flex flex-1 relative">
        {/* SIDEBAR OVERLAY (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`fixed lg:sticky top-0 lg:top-[65px] h-screen lg:h-[calc(100vh-65px)] z-20 flex-shrink-0 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
          style={{
            width: "224px",
            backgroundColor: "#0a1020",
            borderRight: "1px solid rgba(99,179,237,0.08)",
          }}
        >
          {/* Left accent bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-0.5"
            style={{
              background:
                "linear-gradient(to bottom, #3b82f6, #06b6d4, transparent)",
            }}
          />

          <nav className="p-4 space-y-1 pt-6">
            {menu.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    localStorage.setItem("adminTab", item.id);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative"
                  style={{
                    backgroundColor: isActive
                      ? "rgba(59,130,246,0.12)"
                      : "transparent",
                    color: isActive ? "#60a5fa" : "#64748b",
                    border: isActive
                      ? "1px solid rgba(59,130,246,0.2)"
                      : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.color = "#64748b";
                  }}
                >
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                      style={{
                        background:
                          "linear-gradient(to bottom, #3b82f6, #06b6d4)",
                      }}
                    />
                  )}
                  <item.icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main
          className="flex-1 overflow-y-auto p-6 lg:p-8"
          style={{ maxWidth: "1400px" }}
        >
          {/* ── UPLOAD EVENT ── */}
          {activeTab === "upload" && (
            <div>
              <div className="mb-8">
                <h2
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  Upload Event
                </h2>
                <p className="text-sm" style={{ color: "#64748b" }}>
                  Add a new event to the website
                </p>
              </div>
              <form
                onSubmit={handleEventUpload}
                style={{ ...cardStyle, padding: "28px", maxWidth: "560px" }}
              >
                <div className="space-y-4">
                  <InputField
                    label="Event Title"
                    value={title}
                    onChange={(e: any) => setTitle(e.target.value)}
                    placeholder="e.g. Arduino Days 2026"
                  />
                  <InputField
                    label="Description"
                    as="textarea"
                    value={description}
                    onChange={(e: any) => setDescription(e.target.value)}
                    placeholder="Brief event description..."
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Date"
                      type="date"
                      value={date}
                      onChange={(e: any) => setDate(e.target.value)}
                    />
                    <InputField
                      label="Location"
                      value={location}
                      onChange={(e: any) => setLocation(e.target.value)}
                      placeholder="Venue / Online"
                    />
                  </div>
                  <InputField
                    label="Status"
                    as="select"
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </InputField>
                  <InputField
                    label="Page Type"
                    as="select"
                    value={pageType}
                    onChange={(e: any) => setPageType(e.target.value)}
                  >
                    <option value="regular">Regular Event</option>
                    <option value="custom">Custom Event</option>
                  </InputField>

                  {pageType === "custom" && (
                    <InputField
                      label="Custom Page"
                      as="select"
                      value={customPage}
                      onChange={(e: any) => setCustomPage(e.target.value)}
                    >
                      <option value="">Select Page</option>
                      <option value="arduino-days">Arduino Days</option>
                    </InputField>
                  )}
                  {status === "Completed" && (
                    <div>
                      <label
                        className="block text-xs font-medium mb-2 uppercase tracking-widest"
                        style={{ color: "#64748b" }}
                      >
                        Event Images
                      </label>
                      <div
                        className="rounded-xl p-5 text-center text-sm"
                        style={{
                          border: "2px dashed rgba(99,179,237,0.2)",
                          backgroundColor: "rgba(59,130,246,0.04)",
                          color: "#64748b",
                        }}
                      >
                        <Upload
                          size={20}
                          className="mx-auto mb-2"
                          style={{ color: "#3b82f6" }}
                        />
                        <input
                          type="file"
                          multiple
                          required
                          onChange={(e: any) => setImages(e.target.files)}
                          className="text-sm"
                          style={{ color: "#94a3b8" }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="pt-2">
                    <GradientButton>
                      <span className="flex items-center gap-2">
                        <Upload size={14} /> Upload Event
                      </span>
                    </GradientButton>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ── MANAGE EVENTS ── */}
          {activeTab === "events" && (
            <div>
              <div className="mb-8">
                <h2
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  Manage Events
                </h2>
                <p className="text-sm" style={{ color: "#64748b" }}>
                  {events.length} events total
                </p>
              </div>
              <div className="overflow-x-auto rounded-xl" style={cardStyle}>
                <table className="w-full">
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid rgba(99,179,237,0.08)",
                      }}
                    >
                      <th
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "#64748b" }}
                      >
                        Event Name
                      </th>
                      <th
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "#64748b" }}
                      >
                        Status
                      </th>
                      <th
                        className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "#64748b" }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event, idx) => (
                      <EditableEvent
                        key={event._id}
                        event={event}
                        onUpdate={handleUpdate}
                        onDelete={deleteEvent}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TEAM MANAGEMENT ── */}
          {activeTab === "team" && (
            <div>
              <div className="mb-8">
                <h2
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  Team Management
                </h2>
                <p className="text-sm" style={{ color: "#64748b" }}>
                  Manage IEEE SPS team members
                </p>
              </div>

              {/* Sub-tabs */}
              <div
                className="flex gap-1 p-1 rounded-xl mb-8 w-fit"
                style={{
                  backgroundColor: "#0f1624",
                  border: "1px solid rgba(99,179,237,0.08)",
                }}
              >
                {["add", "manage"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setTeamView(v)}
                    className="px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 capitalize"
                    style={{
                      backgroundColor:
                        teamView === v
                          ? "rgba(59,130,246,0.15)"
                          : "transparent",
                      color: teamView === v ? "#60a5fa" : "#64748b",
                      border:
                        teamView === v
                          ? "1px solid rgba(59,130,246,0.2)"
                          : "1px solid transparent",
                    }}
                  >
                    {v === "add" ? "Add Member" : "Manage Team"}
                  </button>
                ))}
              </div>

              {teamView === "add" && (
                <form
                  onSubmit={handleAddMember}
                  style={{ ...cardStyle, padding: "28px", maxWidth: "600px" }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Full Name"
                      value={name}
                      onChange={(e: any) => setName(e.target.value)}
                      placeholder="Member name"
                    />
                    <InputField
                      label="Role"
                      value={role}
                      onChange={(e: any) => setRole(e.target.value)}
                      placeholder="e.g. Chair"
                    />
                    <InputField
                      label="Department"
                      value={department}
                      onChange={(e: any) => setDepartment(e.target.value)}
                      placeholder="Department"
                    />
                    <InputField
                      label="Roll Number"
                      value={rollNumber}
                      onChange={(e: any) => setRollNumber(e.target.value)}
                      placeholder="Roll no."
                    />
                    <InputField
                      label="Registration Number"
                      value={registrationNumber}
                      onChange={(e: any) =>
                        setRegistrationNumber(e.target.value)
                      }
                      placeholder="Reg. no."
                    />
                    <InputField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e: any) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                    <InputField
                      label="Priority (1 = Chair)"
                      type="number"
                      value={priority}
                      onChange={(e: any) => setPriority(Number(e.target.value))}
                      placeholder="5"
                    />
                    <div>
                      <label
                        className="block text-xs font-medium mb-1.5 uppercase tracking-widest"
                        style={{ color: "#64748b" }}
                      >
                        Photo
                      </label>
                      <input
                        type="file"
                        onChange={(e: any) => setPhoto(e.target.files[0])}
                        className="text-sm"
                        style={{ color: "#94a3b8" }}
                      />
                    </div>
                    <div className="col-span-2 pt-2">
                      <GradientButton color="green">
                        <span className="flex items-center gap-2">
                          <Users size={14} /> Add Member
                        </span>
                      </GradientButton>
                    </div>
                  </div>
                </form>
              )}

              {teamView === "manage" && (
                <div className="overflow-x-auto rounded-xl" style={cardStyle}>
                  <table className="w-full">
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(99,179,237,0.08)",
                        }}
                      >
                        {["Priority", "Name", "Role", "Actions"].map((h) => (
                          <th
                            key={h}
                            className={`px-5 py-4 text-xs font-semibold uppercase tracking-widest ${h === "Actions" ? "text-center" : "text-left"}`}
                            style={{ color: "#64748b" }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <>
                          <tr
                            key={m._id}
                            className="transition-colors"
                            style={{
                              borderBottom: "1px solid rgba(99,179,237,0.06)",
                            }}
                            onMouseEnter={(e) =>
                              ((
                                e.currentTarget as HTMLElement
                              ).style.backgroundColor = "rgba(59,130,246,0.04)")
                            }
                            onMouseLeave={(e) =>
                              ((
                                e.currentTarget as HTMLElement
                              ).style.backgroundColor = "transparent")
                            }
                          >
                            <td
                              className="px-5 py-4 text-sm font-mono"
                              style={{ color: "#60a5fa" }}
                            >
                              {m.priority}
                            </td>
                            <td
                              className="px-5 py-4 text-sm font-medium"
                              style={{ color: "#f0f4ff" }}
                            >
                              {m.name}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className="text-xs px-2.5 py-1 rounded-full"
                                style={{
                                  backgroundColor: "rgba(6,182,212,0.1)",
                                  color: "#22d3ee",
                                }}
                              >
                                {m.role}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 justify-center">
                                <button
                                  onClick={() =>
                                    setEditMember(
                                      editMember?._id === m._id ? null : m,
                                    )
                                  }
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                  style={{
                                    backgroundColor: "rgba(59,130,246,0.12)",
                                    color: "#60a5fa",
                                    border: "1px solid rgba(59,130,246,0.2)",
                                  }}
                                >
                                  {editMember?._id === m._id ? (
                                    <ChevronUp size={12} />
                                  ) : (
                                    <ChevronDown size={12} />
                                  )}
                                  {editMember?._id === m._id
                                    ? "Collapse"
                                    : "Edit"}
                                </button>
                                <button
                                  onClick={() => deleteMember(m._id)}
                                  className="p-1.5 rounded-lg transition-all"
                                  style={{
                                    backgroundColor: "rgba(239,68,68,0.1)",
                                    color: "#f87171",
                                    border: "1px solid rgba(239,68,68,0.2)",
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {editMember?._id === m._id && (
                            <tr
                              style={{ backgroundColor: "rgba(15,22,36,0.8)" }}
                            >
                              <td colSpan={4} className="px-5 py-5">
                                <div className="grid grid-cols-2 gap-4">
                                  <InputField
                                    label="Name"
                                    value={editMember.name}
                                    onChange={(e: any) =>
                                      setEditMember({
                                        ...editMember,
                                        name: e.target.value,
                                      })
                                    }
                                  />
                                  <InputField
                                    label="Role"
                                    value={editMember.role}
                                    onChange={(e: any) =>
                                      setEditMember({
                                        ...editMember,
                                        role: e.target.value,
                                      })
                                    }
                                  />
                                  <InputField
                                    label="Department"
                                    value={editMember.department}
                                    onChange={(e: any) =>
                                      setEditMember({
                                        ...editMember,
                                        department: e.target.value,
                                      })
                                    }
                                  />
                                  <InputField
                                    label="Roll Number"
                                    value={editMember.rollNumber}
                                    onChange={(e: any) =>
                                      setEditMember({
                                        ...editMember,
                                        rollNumber: e.target.value,
                                      })
                                    }
                                  />
                                  <InputField
                                    label="Registration Number"
                                    value={editMember.registrationNumber}
                                    onChange={(e: any) =>
                                      setEditMember({
                                        ...editMember,
                                        registrationNumber: e.target.value,
                                      })
                                    }
                                  />
                                  <InputField
                                    label="Email"
                                    value={editMember.email}
                                    onChange={(e: any) =>
                                      setEditMember({
                                        ...editMember,
                                        email: e.target.value,
                                      })
                                    }
                                  />
                                  <InputField
                                    label="Priority"
                                    type="number"
                                    value={editMember.priority}
                                    onChange={(e: any) =>
                                      setEditMember({
                                        ...editMember,
                                        priority: Number(e.target.value),
                                      })
                                    }
                                  />
                                  <div>
                                    <label
                                      className="block text-xs font-medium mb-1.5 uppercase tracking-widest"
                                      style={{ color: "#64748b" }}
                                    >
                                      New Photo
                                    </label>
                                    <input
                                      type="file"
                                      onChange={(e: any) =>
                                        setEditMember({
                                          ...editMember,
                                          newPhoto: e.target.files[0],
                                        })
                                      }
                                      className="text-sm"
                                      style={{ color: "#94a3b8" }}
                                    />
                                  </div>
                                  <div className="col-span-2 flex gap-3 pt-2">
                                    <GradientButton
                                      color="green"
                                      small
                                      onClick={() =>
                                        handleUpdateMember(editMember)
                                      }
                                    >
                                      <span className="flex items-center gap-1.5">
                                        <Check size={12} /> Save Changes
                                      </span>
                                    </GradientButton>
                                    <GradientButton
                                      color="gray"
                                      small
                                      onClick={() => setEditMember(null)}
                                    >
                                      Cancel
                                    </GradientButton>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── MESSAGES ── */}
          {activeTab === "messages" && (
            <div>
              <div className="mb-8">
                <h2
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  Messages
                </h2>
                <p className="text-sm" style={{ color: "#64748b" }}>
                  {messages.length} contact messages
                </p>
              </div>
              <div className="space-y-3 max-w-2xl">
                {messages.map((m) => (
                  <div
                    key={m._id}
                    className="p-5 rounded-xl relative group"
                    style={cardStyle}
                  >
                    <button
                      onClick={() => deleteMessage(m._id)}
                      className="absolute top-4 right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      style={{
                        backgroundColor: "rgba(239,68,68,0.1)",
                        color: "#f87171",
                        border: "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                    <p
                      className="font-semibold text-sm mb-0.5"
                      style={{ color: "#f0f4ff" }}
                    >
                      {m.name}
                    </p>
                    <p className="text-xs mb-3" style={{ color: "#64748b" }}>
                      {m.email}
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#94a3b8" }}
                    >
                      {m.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── REGISTRATIONS ── */}
          {activeTab === "registrations" && (
            <div>
              <div className="mb-8">
                <h2
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
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
                        backgroundColor: registrationOpen
                          ? "#22c55e"
                          : "#ef4444",
                        animation: registrationOpen
                          ? "pulse 2s infinite"
                          : "none",
                      }}
                    />
                    {registrationOpen
                      ? "Registrations Open"
                      : "Registrations Closed"}
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
                      <p
                        key={i}
                        className="text-xs"
                        style={{ color: "#94a3b8" }}
                      >
                        🚀 {reg.teamName} registered for {reg.eventName}
                      </p>
                    ))}
                  </div>
                  <button
                    onClick={() => setNewRegsBannerDismissed(true)}
                    style={{ color: "#64748b" }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* ANALYTICS CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
                <StatCard
                  label="Total Revenue"
                  value={`₹${totalRevenue}`}
                  color="emerald"
                  icon={DollarSign}
                />
                <StatCard
                  label="Combo Revenue"
                  value={`₹${comboRevenue}`}
                  color="blue"
                  icon={TrendingUp}
                />
                <StatCard
                  label="Buildathon Revenue"
                  value={`₹${buildathonRevenue}`}
                  color="purple"
                  icon={TrendingUp}
                />
                <StatCard
                  label="Confirmed Combo"
                  value={confirmedComboTeams}
                  color="cyan"
                  icon={Check}
                />
                <StatCard
                  label="Confirmed Buildathon"
                  value={confirmedBuildathonTeams}
                  color="blue"
                  icon={Check}
                />
                <StatCard
                  label="Hostel Required"
                  value={hostelCount}
                  color="orange"
                  icon={Home}
                />
                <StatCard
                  label="Total Teams"
                  value={totalCount}
                  color="cyan"
                  icon={Users}
                />
                <StatCard
                  label="Pending"
                  value={pendingCount}
                  color="yellow"
                  icon={BookOpen}
                />
                <StatCard
                  label="Total Members"
                  value={totalMembers}
                  color="cyan"
                  icon={Users}
                />
                <StatCard
                  label="Combo Members"
                  value={comboMembers}
                  color="blue"
                  icon={Users}
                />
                <StatCard
                  label="Buildathon Members"
                  value={buildathonMembers}
                  color="purple"
                  icon={Users}
                />
                <StatCard
                  label="Hostel Students"
                  value={hostelStudents}
                  color="orange"
                  icon={Home}
                />
              </div>

              {/* CHARTS */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="p-5 rounded-xl" style={cardStyle}>
                  <h3
                    className="text-sm font-semibold mb-4 uppercase tracking-wider"
                    style={{ color: "#64748b" }}
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
                          backgroundColor: "#0f1624",
                          border: "1px solid rgba(99,179,237,0.12)",
                          borderRadius: "8px",
                          color: "#f0f4ff",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="p-5 rounded-xl" style={cardStyle}>
                  <h3
                    className="text-sm font-semibold mb-4 uppercase tracking-wider"
                    style={{ color: "#64748b" }}
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
                          backgroundColor: "#0f1624",
                          border: "1px solid rgba(99,179,237,0.12)",
                          borderRadius: "8px",
                          color: "#f0f4ff",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="p-5 rounded-xl" style={cardStyle}>
                  <h3
                    className="text-sm font-semibold mb-4 uppercase tracking-wider"
                    style={{ color: "#64748b" }}
                  >
                    🏫 Top Colleges
                  </h3>
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {collegeAnalytics.map((college, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span
                            className="text-xs font-medium"
                            style={{ color: "#94a3b8" }}
                          >
                            {index + 1}.{" "}
                            {collegeMap[normalizeCollege(college.name)] ||
                              college.name}
                          </span>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: "#22d3ee" }}
                          >
                            {college.value}
                          </span>
                        </div>
                        <div
                          className="h-1 rounded-full"
                          style={{ backgroundColor: "rgba(99,179,237,0.08)" }}
                        >
                          <div
                            className="h-1 rounded-full"
                            style={{
                              width: `${(college.value / maxCollegeCount) * 100}%`,
                              background:
                                "linear-gradient(to right, #3b82f6, #06b6d4)",
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
                  <Search
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "#64748b" }}
                  />
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
                      style={{ color: "#64748b" }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div
                  className="flex gap-1 p-1 rounded-xl"
                  style={{
                    backgroundColor: "#0f1624",
                    border: "1px solid rgba(99,179,237,0.08)",
                  }}
                >
                  {["all", "combo", "buildathon", "hostel", "startup"].map(
                    (f) => (
                      <button
                        key={f}
                        onClick={() => setRegistrationFilter(f)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                        style={{
                          backgroundColor:
                            registrationFilter === f
                              ? "rgba(59,130,246,0.15)"
                              : "transparent",
                          color:
                            registrationFilter === f ? "#60a5fa" : "#64748b",
                          border:
                            registrationFilter === f
                              ? "1px solid rgba(59,130,246,0.2)"
                              : "1px solid transparent",
                        }}
                      >
                        {f === "startup"
                          ? "Startups"
                          : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* PENDING / CONFIRMED SEGMENTED CONTROL */}
              <div
                className="flex gap-1 p-1 rounded-xl w-fit mb-6"
                style={{
                  backgroundColor: "#0f1624",
                  border: "1px solid rgba(99,179,237,0.08)",
                }}
              >
                <button
                  onClick={() => setRegistrationView("pending")}
                  className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor:
                      registrationView === "pending"
                        ? "rgba(234,179,8,0.15)"
                        : "transparent",
                    color:
                      registrationView === "pending" ? "#eab308" : "#64748b",
                    border:
                      registrationView === "pending"
                        ? "1px solid rgba(234,179,8,0.25)"
                        : "1px solid transparent",
                  }}
                >
                  Pending{" "}
                  <span
                    className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                    style={{ backgroundColor: "rgba(234,179,8,0.15)" }}
                  >
                    {pendingCount}
                  </span>
                </button>
                <button
                  onClick={() => setRegistrationView("confirmed")}
                  className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor:
                      registrationView === "confirmed"
                        ? "rgba(34,197,94,0.15)"
                        : "transparent",
                    color:
                      registrationView === "confirmed" ? "#22c55e" : "#64748b",
                    border:
                      registrationView === "confirmed"
                        ? "1px solid rgba(34,197,94,0.25)"
                        : "1px solid transparent",
                  }}
                >
                  Confirmed{" "}
                  <span
                    className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                    style={{ backgroundColor: "rgba(34,197,94,0.15)" }}
                  >
                    {confirmedCount}
                  </span>
                </button>
              </div>

              <p
                className="text-xs mb-4 font-medium"
                style={{ color: "#64748b" }}
              >
                Showing{" "}
                {
                  filteredRegistrations(
                    registrationView === "pending" ? "Pending" : "Confirmed",
                  ).length
                }{" "}
                results
              </p>

              {/* PENDING CARDS */}
              {registrationView === "pending" && (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredRegistrations("Pending").map((reg) => (
                    <div
                      key={reg._id}
                      className="p-5 rounded-xl"
                      style={cardStyle}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3
                          className="font-semibold text-base"
                          style={{ color: "#f0f4ff" }}
                        >
                          {reg.teamName}
                        </h3>
                        <span
                          className="text-xs px-2 py-1 rounded-full font-mono"
                          style={{
                            backgroundColor: "rgba(234,179,8,0.1)",
                            color: "#eab308",
                          }}
                        >
                          {reg.registrationId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{
                            backgroundColor:
                              reg.eventType === "combo"
                                ? "rgba(59,130,246,0.12)"
                                : "rgba(168,85,247,0.12)",
                            color:
                              reg.eventType === "combo" ? "#60a5fa" : "#c084fc",
                          }}
                        >
                          {reg.eventName}
                        </span>
                        {reg.accommodationRequired && (
                          <span
                            className="text-xs px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: "rgba(249,115,22,0.12)",
                              color: "#fb923c",
                            }}
                          >
                            🏠 Hostel
                          </span>
                        )}
                        {(reg.startup?.answer || "").toLowerCase() ===
                          "yes" && (
                          <span
                            className="text-xs px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: "rgba(236,72,153,0.12)",
                              color: "#f472b6",
                            }}
                          >
                            🚀 Startup
                          </span>
                        )}
                        {reg.payment?.amountMismatch && (
                          <span
                            className="text-xs px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: "rgba(239,68,68,0.12)",
                              color: "#f87171",
                            }}
                          >
                            ⚠ Mismatch
                          </span>
                        )}
                      </div>
                      <div className="mb-4">
                        <p
                          className="text-xs font-medium mb-1.5 uppercase tracking-wider"
                          style={{ color: "#64748b" }}
                        >
                          Team Members
                        </p>
                        <div className="space-y-0.5">
                          {reg.teamMembers.map((m: any, i: number) => (
                            <p
                              key={i}
                              className="text-xs"
                              style={{ color: "#94a3b8" }}
                            >
                              {i + 1}. {m.fullName}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div
                        className="flex gap-2 flex-wrap pt-3"
                        style={{ borderTop: "1px solid rgba(99,179,237,0.08)" }}
                      >
                        <button
                          onClick={() => setSelectedFullDetails(reg)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{
                            backgroundColor: "rgba(6,182,212,0.1)",
                            color: "#22d3ee",
                            border: "1px solid rgba(6,182,212,0.2)",
                          }}
                        >
                          <Eye size={12} /> Details
                        </button>
                        <button
                          onClick={() => confirmRegistration(reg._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{
                            backgroundColor: "rgba(34,197,94,0.1)",
                            color: "#22c55e",
                            border: "1px solid rgba(34,197,94,0.2)",
                          }}
                        >
                          <Check size={12} /> Confirm
                        </button>
                        <button
                          onClick={() => deleteRegistration(reg._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{
                            backgroundColor: "rgba(239,68,68,0.1)",
                            color: "#f87171",
                            border: "1px solid rgba(239,68,68,0.2)",
                          }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                        {reg.payment?.screenshotUrl && (
                          <button
                            onClick={() =>
                              setSelectedScreenshot(reg.payment.screenshotUrl)
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{
                              backgroundColor: "rgba(59,130,246,0.1)",
                              color: "#60a5fa",
                              border: "1px solid rgba(59,130,246,0.2)",
                            }}
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
                        <tr
                          style={{
                            borderBottom: "1px solid rgba(99,179,237,0.08)",
                          }}
                        >
                          {[
                            "#",
                            "Date & Time",
                            "Reg ID",
                            "Team",
                            "Members",
                            "Event",
                            "Hostel",
                            "Actions",
                          ].map((h) => (
                            <th
                              key={h}
                              className={`px-4 py-4 text-xs font-semibold uppercase tracking-widest ${h === "Actions" ? "text-center" : "text-left"}`}
                              style={{ color: "#64748b" }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRegistrations("Confirmed").map(
                          (reg, index) => (
                            <tr
                              key={reg._id}
                              className="transition-colors"
                              style={{
                                borderBottom: "1px solid rgba(99,179,237,0.06)",
                              }}
                              onMouseEnter={(e) =>
                                ((
                                  e.currentTarget as HTMLElement
                                ).style.backgroundColor =
                                  "rgba(59,130,246,0.03)")
                              }
                              onMouseLeave={(e) =>
                                ((
                                  e.currentTarget as HTMLElement
                                ).style.backgroundColor = "transparent")
                              }
                            >
                              <td
                                className="px-4 py-3 text-xs font-mono"
                                style={{ color: "#60a5fa" }}
                              >
                                {index + 1}
                              </td>
                              <td
                                className="px-4 py-3 text-xs"
                                style={{ color: "#94a3b8" }}
                              >
                                {reg.createdAt
                                  ? `${formatDate(reg.createdAt)}, ${new Date(reg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                  : "-"}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className="text-xs font-mono font-semibold"
                                  style={{ color: "#22c55e" }}
                                >
                                  {reg.registrationId}
                                </span>
                              </td>
                              <td
                                className="px-4 py-3 text-sm font-medium"
                                style={{ color: "#f0f4ff" }}
                              >
                                {reg.teamName}
                              </td>
                              <td
                                className="px-4 py-3 text-xs space-y-0.5"
                                style={{ color: "#94a3b8" }}
                              >
                                {(registrationFilter === "hostel"
                                  ? reg.hostelMembers
                                  : reg.teamMembers
                                )?.map((m: any, i: number) => (
                                  <div key={i}>
                                    {i + 1}. {m.fullName}
                                  </div>
                                ))}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className="text-xs px-2.5 py-1 rounded-full"
                                  style={{
                                    backgroundColor:
                                      reg.eventType === "combo"
                                        ? "rgba(59,130,246,0.12)"
                                        : "rgba(168,85,247,0.12)",
                                    color:
                                      reg.eventType === "combo"
                                        ? "#60a5fa"
                                        : "#c084fc",
                                  }}
                                >
                                  {reg.eventName}
                                </span>
                              </td>
                              <td
                                className="px-4 py-3 text-xs"
                                style={{
                                  color: reg.accommodationRequired
                                    ? "#fb923c"
                                    : "#64748b",
                                }}
                              >
                                {reg.accommodationRequired ? "Yes" : "No"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5 justify-center">
                                  <button
                                    onClick={() => setSelectedFullDetails(reg)}
                                    className="p-1.5 rounded-lg"
                                    style={{
                                      backgroundColor: "rgba(6,182,212,0.1)",
                                      color: "#22d3ee",
                                      border: "1px solid rgba(6,182,212,0.2)",
                                    }}
                                  >
                                    <Eye size={13} />
                                  </button>
                                  {reg.payment?.screenshotUrl && (
                                    <button
                                      onClick={() =>
                                        setSelectedScreenshot(
                                          reg.payment.screenshotUrl,
                                        )
                                      }
                                      className="p-1.5 rounded-lg"
                                      style={{
                                        backgroundColor: "rgba(59,130,246,0.1)",
                                        color: "#60a5fa",
                                        border:
                                          "1px solid rgba(59,130,246,0.2)",
                                      }}
                                    >
                                      <Eye size={13} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteRegistration(reg._id)}
                                    className="p-1.5 rounded-lg"
                                    style={{
                                      backgroundColor: "rgba(239,68,68,0.1)",
                                      color: "#f87171",
                                      border: "1px solid rgba(239,68,68,0.2)",
                                    }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* SCREENSHOT MODAL */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
          }}
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
              style={{
                backgroundColor: "rgba(239,68,68,0.15)",
                color: "#f87171",
              }}
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
          style={{
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
          }}
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
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  color: "#f0f4ff",
                }}
              >
                Registration Details
              </h3>
              <button
                onClick={() => setSelectedFullDetails(null)}
                className="p-1.5 rounded-lg"
                style={{
                  backgroundColor: "rgba(100,116,139,0.1)",
                  color: "#64748b",
                }}
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
                {
                  label: "Registration ID",
                  value: selectedFullDetails.registrationId,
                },
                { label: "Team Name", value: selectedFullDetails.teamName },
                { label: "Event", value: selectedFullDetails.eventName },
                { label: "Event Type", value: selectedFullDetails.eventType },
                {
                  label: "Accommodation",
                  value: selectedFullDetails.accommodationRequired
                    ? "Required"
                    : "Not Required",
                },
                {
                  label: "Transaction ID",
                  value:
                    selectedFullDetails.payment?.userTransactionId ||
                    "Not Available",
                },
                {
                  label: "Startup Team",
                  value: selectedFullDetails.startup?.answer || "No",
                },
                {
                  label: "Payment Screenshot",
                  value: selectedFullDetails.payment?.screenshotUrl
                    ? "Submitted"
                    : "Not Submitted",
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: "rgba(8,12,20,0.6)",
                    border: "1px solid rgba(99,179,237,0.06)",
                  }}
                >
                  <p
                    className="text-xs uppercase tracking-wider mb-1"
                    style={{ color: "#64748b" }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#f0f4ff" }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {selectedFullDetails.accommodationRequired && (
              <div
                className="mb-4 p-3 rounded-lg"
                style={{
                  backgroundColor: "rgba(249,115,22,0.06)",
                  border: "1px solid rgba(249,115,22,0.12)",
                }}
              >
                <p
                  className="text-xs uppercase tracking-wider mb-2"
                  style={{ color: "#fb923c" }}
                >
                  Accommodation Details
                </p>
                <p className="text-sm" style={{ color: "#94a3b8" }}>
                  Arrival:{" "}
                  {selectedFullDetails.arrivalDate
                    ? `${formatDate(selectedFullDetails.arrivalDate)}, ${selectedFullDetails.arrivalTime || "-"}`
                    : "-"}
                </p>
                <p className="text-sm" style={{ color: "#94a3b8" }}>
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
                style={{
                  backgroundColor: "rgba(236,72,153,0.06)",
                  border: "1px solid rgba(236,72,153,0.12)",
                }}
              >
                <p
                  className="text-xs uppercase tracking-wider mb-1"
                  style={{ color: "#f472b6" }}
                >
                  Startup Idea
                </p>
                <p className="text-sm" style={{ color: "#94a3b8" }}>
                  {selectedFullDetails.startup?.idea || "-"}
                </p>
              </div>
            )}

            {selectedFullDetails.hostelMembers?.length > 0 && (
              <div className="mb-4">
                <p
                  className="text-xs uppercase tracking-wider mb-2 font-semibold"
                  style={{ color: "#64748b" }}
                >
                  Hostel Members
                </p>
                <div className="space-y-1.5">
                  {selectedFullDetails.hostelMembers.map(
                    (m: any, i: number) => (
                      <div
                        key={i}
                        className="px-3 py-2 rounded-lg text-sm"
                        style={{
                          backgroundColor: "rgba(8,12,20,0.6)",
                          color: "#94a3b8",
                        }}
                      >
                        {i + 1}. {m.fullName}
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            <div>
              <p
                className="text-xs uppercase tracking-wider mb-3 font-semibold"
                style={{ color: "#64748b" }}
              >
                Team Members
              </p>
              <div className="space-y-3">
                {selectedFullDetails.teamMembers.map((m: any, i: number) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl"
                    style={{
                      backgroundColor: "rgba(8,12,20,0.6)",
                      border: "1px solid rgba(99,179,237,0.06)",
                    }}
                  >
                    <p
                      className="font-semibold text-sm mb-3"
                      style={{ color: "#60a5fa" }}
                    >
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
                            <span
                              className="text-xs"
                              style={{ color: "#64748b" }}
                            >
                              {k}:{" "}
                            </span>
                            <span
                              className="text-xs"
                              style={{ color: "#94a3b8" }}
                            >
                              {v}
                            </span>
                          </div>
                        ) : null,
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
                  color: "#94a3b8",
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

export default Dashboard;