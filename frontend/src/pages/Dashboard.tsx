import { useEffect, useState } from "react";
import axios from "axios";
import DashboardOverviewTab from "./Dashboard/components/DashboardOverviewTab";
import UploadEventTab from "./Dashboard/components/UploadEventTab";
import ManageEventsTab from "./Dashboard/components/ManageEventsTab";
import TeamTab from "./Dashboard/components/TeamTab";
import MessagesTab from "./Dashboard/components/MessagesTab";
import AdminsTab from "./Dashboard/components/AdminsTab";
import ActivityLogsTab from "./Dashboard/components/ActivityLogsTab";
import Profile from "./Profile";
import SPSApplicationsTab from "./Dashboard/components/SPSApplicationsTab";
import LoginHistoryTab from "./Dashboard/components/LoginHistoryTab";
import ArduinoRegistrationsTab from "./Dashboard/components/ArduinoRegistrationsTab";
import MembershipRegistrationsTab from "./Dashboard/components/MembershipRegistrationsTab";
import SpaceDayRegistrationsTab from "./Dashboard/components/SpaceDayRegistrationsTab";
import {
  Calendar,
  Mail,
  Upload,
  User,
  LogOut,
  Users,
  Menu,
  X,
  Zap,
  BookOpen,
  Shield,
  History,
  LayoutDashboard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#0f1624",
  border: "1px solid rgba(99,179,237,0.10)",
  borderRadius: "14px",
};

/* ══════════════════════════════════════════
  DASHBOARD
══════════════════════════════════════════ */
const Dashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [permissions, setPermissions] = useState(
    JSON.parse(localStorage.getItem("permissions") || "{}"),
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [spsApplications, setSpsApplications] = useState<any[]>([]);
  const [membershipRegistrations, setMembershipRegistrations] = useState<any[]>(
    [],
  );

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
    localStorage.getItem("adminTab") || "profile",
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
  const [linkedIn, setLinkedIn] = useState("");
  const [priority, setPriority] = useState(5);
  const [photo, setPhoto] = useState<File | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState("");

  /* MESSAGES */
  const [messages, setMessages] = useState<any[]>([]);

  const [isPaused, setIsPaused] = useState(
    JSON.parse(localStorage.getItem("isPaused") || "false"),
  );

  const refreshPauseStatus = async () => {
    const token = localStorage.getItem("token");

    if (!token) return;
    const userRole = localStorage.getItem("role");

    if (userRole === "superadmin") return;
    try {
      const res = await axios.get(
        "https://ieee-sps-website.onrender.com/api/admin-access/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setIsPaused(res.data.isPaused);
      localStorage.setItem("isPaused", JSON.stringify(res.data.isPaused));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) return;

    const userRole = localStorage.getItem("role");

    if (userRole === "admin") {
      refreshPermissions();
      refreshPauseStatus();
    }

    fetchEvents();
    fetchMembers();
    fetchSPSApplications();
    fetchMembershipRegistrations();
  }, [token]);

  useEffect(() => {
    if (isPaused) {
      setActiveTab("profile");
    }
  }, [isPaused]);

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

  const fetchSPSApplications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "https://ieee-sps-website.onrender.com/api/sps-applications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setSpsApplications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMembershipRegistrations = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "https://ieee-sps-website.onrender.com/api/membership",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setMembershipRegistrations(res.data);
    } catch (err) {
      console.error(err);
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
    localStorage.removeItem("role");
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
    formData.append("linkedIn", linkedIn);
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
    setLinkedIn("");
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
    formData.append("linkedIn", member.linkedIn || "");
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

  /* MENU */
  const userRole = localStorage.getItem("role");

  const isSuperAdmin = userRole === "superadmin";

  const menu = isPaused
    ? [{ id: "profile", label: "My Profile", icon: User }]
    : [
        { id: "profile", label: "My Profile", icon: User },

        ...(permissions.dashboardOverview
          ? [
              {
                id: "dashboardOverview",
                label: "Overview",
                icon: LayoutDashboard,
              },
            ]
          : []),

        ...(permissions.events
          ? [
              { id: "upload", label: "Upload Event", icon: Upload },
              { id: "events", label: "Manage Events", icon: Calendar },
            ]
          : []),

        ...(permissions.team
          ? [{ id: "team", label: "Team Management", icon: Users }]
          : []),

        ...(permissions.messages
          ? [{ id: "messages", label: "Messages", icon: Mail }]
          : []),

        ...(permissions.registrations
          ? [
              { id: "registrations", label: "Registrations", icon: BookOpen },
              {
                id: "spaceDayRegistrations",
                label: "Space Day",
                icon: BookOpen,
              },
            ]
          : []),

        ...(permissions.membershipRegistrations
          ? [
              {
                id: "membershipRegistrations",
                label: "Registrations Drive",
                icon: Users,
              },
            ]
          : []),

        ...(permissions.spsApplications
          ? [{ id: "spsApplications", label: "SPS Applications", icon: Users }]
          : []),

        ...(isSuperAdmin
          ? [{ id: "admins", label: "Admins", icon: Shield }]
          : []),

        ...(isSuperAdmin
          ? [{ id: "activity", label: "Activity Logs", icon: BookOpen }]
          : []),

        ...(isSuperAdmin
          ? [{ id: "loginHistory", label: "Login History", icon: History }]
          : []),
      ];

  const refreshPermissions = async () => {
    const token = localStorage.getItem("token");

    if (!token) return;
    const userRole = localStorage.getItem("role");

    if (userRole === "superadmin") return;
    try {
      const res = await axios.get(
        "https://ieee-sps-website.onrender.com/api/admin-access/permissions",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setPermissions(res.data);
      localStorage.setItem("permissions", JSON.stringify(res.data));
    } catch (err) {
      console.error(err);
    }
  };

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
          {activeTab === "dashboardOverview" && (
            <DashboardOverviewTab
              cardStyle={cardStyle}
              events={events}
              members={members}
              membershipRegistrations={membershipRegistrations}
              spsApplications={spsApplications}
              messages={messages}
              admins={[]} // Temporary
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "profile" && <Profile />}

          {!isPaused && activeTab === "upload" && (
            <UploadEventTab
              handleEventUpload={handleEventUpload}
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              date={date}
              setDate={setDate}
              location={location}
              setLocation={setLocation}
              status={status}
              setStatus={setStatus}
              pageType={pageType}
              setPageType={setPageType}
              customPage={customPage}
              setCustomPage={setCustomPage}
              setImages={setImages}
              cardStyle={cardStyle}
            />
          )}

          {!isPaused && activeTab === "events" && (
            <ManageEventsTab
              events={events}
              handleUpdate={handleUpdate}
              deleteEvent={deleteEvent}
              cardStyle={cardStyle}
            />
          )}

          {!isPaused &&
            activeTab === "team" &&
            (permissions.team || isSuperAdmin) && (
              <TeamTab
                teamView={teamView}
                setTeamView={setTeamView}
                handleAddMember={handleAddMember}
                name={name}
                setName={setName}
                role={role}
                setRole={setRole}
                department={department}
                setDepartment={setDepartment}
                rollNumber={rollNumber}
                setRollNumber={setRollNumber}
                registrationNumber={registrationNumber}
                setRegistrationNumber={setRegistrationNumber}
                email={email}
                setEmail={setEmail}
                linkedIn={linkedIn}
                setLinkedIn={setLinkedIn}
                priority={priority}
                setPriority={setPriority}
                photo={photo}
                setPhoto={setPhoto}
                showCrop={showCrop}
                setShowCrop={setShowCrop}
                imageSrc={imageSrc}
                setImageSrc={setImageSrc}
                members={members}
                editMember={editMember}
                setEditMember={setEditMember}
                handleUpdateMember={handleUpdateMember}
                deleteMember={deleteMember}
                cardStyle={cardStyle}
              />
            )}

          {!isPaused &&
            activeTab === "messages" &&
            (permissions.messages || isSuperAdmin) && (
              <MessagesTab
                messages={messages}
                deleteMessage={deleteMessage}
                cardStyle={cardStyle}
              />
            )}

          {!isPaused &&
            activeTab === "spsApplications" &&
            (isSuperAdmin || permissions.spsApplications) && (
              <SPSApplicationsTab />
            )}

          {!isPaused &&
            activeTab === "membershipRegistrations" &&
            (isSuperAdmin || permissions.membershipRegistrations) && (
              <MembershipRegistrationsTab
                registrations={membershipRegistrations}
                fetchRegistrations={fetchMembershipRegistrations}
                setRegistrations={setMembershipRegistrations}
                cardStyle={cardStyle}
              />
            )}

          {/* ── REGISTRATIONS ── */}
          {!isPaused &&
            activeTab === "registrations" &&
            (permissions.registrations || isSuperAdmin) && (
              <ArduinoRegistrationsTab
                token={token}
                navigate={navigate}
                registrationOpen={registrationOpen}
              />
            )}

          {!isPaused &&
            activeTab === "spaceDayRegistrations" &&
            (permissions.registrations || isSuperAdmin) && (
              <SpaceDayRegistrationsTab />
            )}

          {!isPaused && activeTab === "admins" && isSuperAdmin && <AdminsTab />}
          {!isPaused && activeTab === "activity" && isSuperAdmin && (
            <ActivityLogsTab />
          )}
          {!isPaused && activeTab === "loginHistory" && isSuperAdmin && (
            <LoginHistoryTab />
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
