import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Calendar, Mail, Upload, LogOut, Users } from "lucide-react";
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
const STATUS_COLORS = ["#facc15", "#22c55e"]; // Pending, Confirmed
const EVENT_COLORS = ["#3b82f6", "#a855f7"]; // Combo, Buildathon
/* ================= EDITABLE EVENT ================= */

const EditableEvent = ({ event, onUpdate, onDelete }: any) => {
  const [edit, setEdit] = useState(false);
  const [data, setData] = useState({
    title: event.title,
    description: event.description,
    date: event.date,
    location: event.location,
    status: event.status,
    images: null,
  });

  return (
    <div className="bg-zinc-800 p-6 rounded mb-6">
      {!edit ? (
        <>
          <h3 className="text-xl">{event.title}</h3>
          <p>{event.description}</p>
          <p>{event.date}</p>
          <p>{event.location}</p>
          <p>Status: {event.status}</p>
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => setEdit(true)}
              className="bg-cyan-500 px-4 py-1 rounded"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(event._id)}
              className="bg-red-500 px-4 py-1 rounded"
            >
              Delete
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <input
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            className="w-full p-2 bg-zinc-700 rounded"
          />
          <textarea
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            className="w-full p-2 bg-zinc-700 rounded"
          />
          <input
            value={data.date}
            onChange={(e) => setData({ ...data, date: e.target.value })}
            className="w-full p-2 bg-zinc-700 rounded"
          />
          <input
            value={data.location}
            onChange={(e) => setData({ ...data, location: e.target.value })}
            className="w-full p-2 bg-zinc-700 rounded"
          />
          <select
            value={data.status}
            onChange={(e) => setData({ ...data, status: e.target.value })}
            className="w-full p-2 bg-zinc-700 rounded"
          >
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
          </select>

          {data.status === "Completed" && (
            <input
              type="file"
              multiple
              onChange={(e: any) =>
                setData({ ...data, images: e.target.files })
              }
            />
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                onUpdate(event, data);
                setEdit(false);
              }}
              className="bg-green-500 px-4 py-1 rounded"
            >
              Save
            </button>
            <button
              onClick={() => setEdit(false)}
              className="bg-gray-500 px-4 py-1 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  useEffect(() => {
    if (!token) {
      navigate("/");
    }
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
  const toggleRegistration = async () => {
    if (toggleLoading) return;

    setToggleLoading(true);

    try {
      const res = await axios.put(
        "https://ieee-sps-website.onrender.com/events/toggle-registration",
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setRegistrationOpen(res.data.registrationOpen);
    } catch (error) {
      console.error("Toggle Error:", error);
    } finally {
      setToggleLoading(false);
    }
  };
  const [activeTab, setActiveTab] = useState(
    localStorage.getItem("adminTab") || "upload",
  );

  /* ================= EVENTS ================= */
  const [events, setEvents] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("Upcoming");
  const [images, setImages] = useState<FileList | null>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  /* ================= TEAM ================= */
  const [members, setMembers] = useState<any[]>([]);
  const [teamView, setTeamView] = useState("add");
  const [editMember, setEditMember] = useState<any>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [priority, setPriority] = useState(5);
  const [photo, setPhoto] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(
    null,
  );
  const [selectedFullDetails, setSelectedFullDetails] = useState<any>(null);
  /* ================= REGISTRATIONS ================= */
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [latestRegistrations, setLatestRegistrations] = useState<any[]>([]);
  // 2. Verified Analytics Logic
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

  // 3. Safe College Analytics Logic
  const collegeAnalytics = useMemo(() => {
    const collegeCounts: Record<string, number> = {};

    registrations.forEach((reg) => {
      reg.teamMembers?.forEach((member: any) => {
        const college = member.college || "Unknown";
        collegeCounts[college] = (collegeCounts[college] || 0) + 1;
      });
    });

    return Object.entries(collegeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // sort highest first
  }, [registrations]);
  const [registrationView, setRegistrationView] = useState("pending");
  const [registrationFilter, setRegistrationFilter] = useState("all");

  /* ================= MESSAGES ================= */
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;

    fetchEvents();
    fetchMembers();
    fetchRegistrations();

    // 🔁 Auto refresh every 10 seconds
    const interval = setInterval(() => {
      fetchRegistrations();
    }, 10000);

    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (activeTab === "messages") {
      fetchMessages();
    }
  }, [activeTab]);

  /* ================= FETCH ================= */

  const fetchEvents = async () => {
    const res = await axios.get("https://ieee-sps-website.onrender.com/events");
    setEvents(res.data);
  };

  const fetchMembers = async () => {
    const res = await axios.get("https://ieee-sps-website.onrender.com/team");

    const sortedMembers = res.data.sort(
      (a: any, b: any) => Number(a.priority) - Number(b.priority),
    );
    setMembers(sortedMembers);
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

      // detect new registrations
      if (registrations.length > 0) {
        const newOnes = newData.filter(
          (r: any) => !registrations.some((old) => old._id === r._id),
        );

        if (newOnes.length > 0) {
          setLatestRegistrations(newOnes);
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
      // confirm registration first
      const res = await axios.put(
        `https://ieee-sps-website.onrender.com/api/confirm/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      await axios.put(
  `https://ieee-sps-website.onrender.com/api/confirm/${id}`,
  {},
  { headers: { Authorization: `Bearer ${token}` } }
);

fetchRegistrations();

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
        {
          headers: { Authorization: `Bearer ${token}` },
        },
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
  /* ================= LOGOUT ================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  /* ================= UPLOAD EVENT ================= */

  const handleEventUpload = async (e: any) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("date", date);
    formData.append("location", location);
    formData.append("status", status);

    if (images) {
      for (let i = 0; i < images.length; i++) {
        formData.append("images", images[i]);
      }
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
    setImages(null);

    fetchEvents();
  };

  /* ================= UPDATE EVENT ================= */

  const handleUpdate = async (event: any, newData: any) => {
    try {
      const formData = new FormData();

      formData.append("title", newData.title);
      formData.append("description", newData.description);
      formData.append("date", newData.date);
      formData.append("location", newData.location);
      formData.append("status", newData.status);

      // Append images only if new images are selected
      if (newData.newImages && newData.newImages.length > 0) {
        for (let i = 0; i < newData.newImages.length; i++) {
          formData.append("images", newData.newImages[i]);
        }
      }

      await axios.put(
        `https://ieee-sps-website.onrender.com/events/${event._id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
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

  /* ================= ADD MEMBER ================= */

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

    if (member.newPhoto) {
      formData.append("photo", member.newPhoto);
    }

    await axios.put(
      `https://ieee-sps-website.onrender.com/team/${member._id}`,
      formData,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    alert("Member Updated Successfully");
    setEditMember(null);
    fetchMembers();
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
        "Registration ID",
        "Team Name",
        "Event",
        "Accommodation",
        "Member Name",
        "Roll No",
        "Email",
        "Phone",
        "College",
      ]);

      data.forEach((reg) => {
        reg.teamMembers.forEach((member: any) => {
          rows.push([
            reg.registrationId,
            reg.teamName,
            reg.eventName,
            reg.hostelMembers?.some((h: any) => h.fullName === member.fullName)
  ? "Yes"
  : "No",
            member.fullName || "",
            member.rollNo || "",
            member.email || "",
            member.phone || "",
            member.college || "",
          ]);
        });
      });

      return rows;
    };

    const workbook = XLSX.utils.book_new();

    const comboSheet = XLSX.utils.aoa_to_sheet(createRows(combo));
    const buildathonSheet = XLSX.utils.aoa_to_sheet(createRows(buildathon));
    const hostelSheet = XLSX.utils.aoa_to_sheet(createRows(hostel));

    XLSX.utils.book_append_sheet(workbook, comboSheet, "Combo");
    XLSX.utils.book_append_sheet(workbook, buildathonSheet, "Buildathon");
    XLSX.utils.book_append_sheet(workbook, hostelSheet, "Hostel");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "arduino-days-2026-registrations.xlsx");
  };

  /* ================= MENU ================= */

  const menu = [
    { id: "upload", label: "Upload Event", icon: Upload },
    { id: "events", label: "Manage Events", icon: Calendar },
    { id: "team", label: "Team Management", icon: Users },
    { id: "messages", label: "Messages", icon: Mail },
    { id: "registrations", label: "Registrations", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* HEADER */}
      <div className="flex justify-end items-center px-8 py-4 border-b border-cyan-500/20 bg-zinc-900">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-2 text-sm rounded-full 
                     border border-cyan-400 text-cyan-400
                     hover:bg-cyan-400 hover:text-black transition"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      <div className="flex flex-1">
        {/* SIDEBAR */}
        <div className="w-64 bg-zinc-900 border-r border-cyan-500/20 p-6">
          <h2 className="text-xl text-cyan-400 mb-8">Admin Panel</h2>
          <div className="space-y-3">
            {menu.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  localStorage.setItem("adminTab", item.id);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                  activeTab === item.id
                    ? "bg-cyan-500 text-black"
                    : "hover:bg-white/10 text-white/70"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-10 overflow-y-auto">
          {/* UPLOAD TAB */}
          {activeTab === "upload" && (
            <form onSubmit={handleEventUpload} className="space-y-4 max-w-xl">
              <h2 className="text-2xl text-cyan-400">Upload Event</h2>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full p-2 bg-zinc-800 rounded"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="w-full p-2 bg-zinc-800 rounded"
              />
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="Date"
                className="w-full p-2 bg-zinc-800 rounded"
              />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="w-full p-2 bg-zinc-800 rounded"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2 bg-zinc-800 rounded"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
              </select>
              {status === "Completed" && (
                <input
                  type="file"
                  multiple
                  required
                  onChange={(e: any) => setImages(e.target.files)}
                />
              )}
              <button className="bg-cyan-500 px-6 py-2 rounded">Upload</button>
            </form>
          )}

          {/* MANAGE EVENTS */}
          {activeTab === "events" && (
            <div>
              <h2 className="text-2xl text-cyan-400 mb-6">Manage Events</h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-zinc-900 rounded-lg overflow-hidden">
                  {/* Table Header */}
                  <thead className="bg-zinc-800 text-cyan-400 text-left">
                    <tr>
                      <th className="p-4 border-b border-cyan-500/20">
                        Event Name
                      </th>
                      <th className="p-4 border-b border-cyan-500/20">
                        Status
                      </th>
                      <th className="p-4 border-b border-cyan-500/20 text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody>
                    {events.map((event) => (
                      <tr
                        key={event._id}
                        className="hover:bg-zinc-800 transition border-b border-zinc-700"
                      >
                        <td className="p-4">{event.title}</td>

                        <td className="p-4">
                          <span
                            className={`px-3 py-1 text-sm rounded-full ${
                              event.status === "Upcoming"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {event.status}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={() => setEditingEvent(event)}
                              className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-1 rounded"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => deleteEvent(event._id)}
                              className="bg-red-500 hover:bg-red-600 px-4 py-1 rounded"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {editingEvent && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-zinc-900 p-8 rounded w-[500px] space-y-3">
                <h3 className="text-xl text-cyan-400">Edit Event</h3>

                <input
                  value={editingEvent.title}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, title: e.target.value })
                  }
                  className="w-full p-2 bg-zinc-800 rounded"
                />

                <textarea
                  value={editingEvent.description}
                  onChange={(e) =>
                    setEditingEvent({
                      ...editingEvent,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-2 bg-zinc-800 rounded"
                />

                <input
                  value={editingEvent.date}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, date: e.target.value })
                  }
                  className="w-full p-2 bg-zinc-800 rounded"
                />

                <input
                  value={editingEvent.location}
                  onChange={(e) =>
                    setEditingEvent({
                      ...editingEvent,
                      location: e.target.value,
                    })
                  }
                  className="w-full p-2 bg-zinc-800 rounded"
                />

                <select
                  value={editingEvent.status}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, status: e.target.value })
                  }
                  className="w-full p-2 bg-zinc-800 rounded"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                </select>

                {editingEvent.status === "Completed" && (
                  <input
                    type="file"
                    multiple
                    onChange={(e: any) =>
                      setEditingEvent({
                        ...editingEvent,
                        newImages: e.target.files,
                      })
                    }
                    className="w-full p-2 bg-zinc-800 rounded"
                  />
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleUpdate(editingEvent, editingEvent);
                      setEditingEvent(null);
                    }}
                    className="bg-green-500 px-4 py-1 rounded"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => setEditingEvent(null)}
                    className="bg-gray-500 px-4 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TEAM */}
          {activeTab === "team" && (
            <div>
              <h2 className="text-2xl text-cyan-400 mb-6">Team Management</h2>

              {/* ===== TABS ===== */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setTeamView("add")}
                  className={`px-4 py-2 rounded ${
                    teamView === "add"
                      ? "bg-cyan-500 text-black"
                      : "bg-zinc-800"
                  }`}
                >
                  Add Member
                </button>

                <button
                  onClick={() => setTeamView("manage")}
                  className={`px-4 py-2 rounded ${
                    teamView === "manage"
                      ? "bg-cyan-500 text-black"
                      : "bg-zinc-800"
                  }`}
                >
                  Manage Team
                </button>
              </div>

              {/* ===== ADD MEMBER ===== */}
              {teamView === "add" && (
                <form
                  onSubmit={handleAddMember}
                  className="space-y-3 max-w-xl mb-10"
                >
                  <input
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 bg-zinc-800 rounded"
                  />
                  <input
                    placeholder="Role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2 bg-zinc-800 rounded"
                  />
                  <input
                    placeholder="Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-2 bg-zinc-800 rounded"
                  />
                  <input
                    placeholder="Roll Number"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full p-2 bg-zinc-800 rounded"
                  />
                  <input
                    placeholder="Registration Number"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="w-full p-2 bg-zinc-800 rounded"
                  />
                  <input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 bg-zinc-800 rounded"
                  />
                  <input
                    type="number"
                    placeholder="Priority (1 = Chair)"
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full p-2 bg-zinc-800 rounded"
                  />
                  <input
                    type="file"
                    onChange={(e: any) => setPhoto(e.target.files[0])}
                  />
                  <button className="bg-green-500 px-6 py-2 rounded">
                    Add Member
                  </button>
                </form>
              )}

              {/* ===== MANAGE TEAM ===== */}
              {teamView === "manage" && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse bg-zinc-900 rounded-lg overflow-hidden">
                    <thead className="bg-zinc-800 text-cyan-400 text-left">
                      <tr>
                        <th className="p-4 border-b border-cyan-500/20">
                          Priority
                        </th>
                        <th className="p-4 border-b border-cyan-500/20">
                          Name
                        </th>
                        <th className="p-4 border-b border-cyan-500/20">
                          Role
                        </th>
                        <th className="p-4 border-b border-cyan-500/20 text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {members.map((m) => (
                        <tr
                          key={m._id}
                          className="hover:bg-zinc-800 transition border-b border-zinc-700"
                        >
                          <td className="p-4">{m.priority}</td>
                          <td className="p-4">{m.name}</td>
                          <td className="p-4 text-cyan-400">{m.role}</td>

                          <td className="p-4">
                            <div className="flex justify-center gap-3">
                              <button
                                onClick={() => setEditMember(m)}
                                className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-1 rounded"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => deleteMember(m._id)}
                                className="bg-red-500 hover:bg-red-600 px-4 py-1 rounded"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ===== EDIT MEMBER MODAL ===== */}
              {editMember && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
                  <div className="bg-zinc-900 p-8 rounded w-[400px] space-y-3">
                    <h3 className="text-xl text-cyan-400">Edit Member</h3>

                    <input
                      value={editMember.name}
                      onChange={(e) =>
                        setEditMember({ ...editMember, name: e.target.value })
                      }
                      className="w-full p-2 bg-zinc-800 rounded"
                    />
                    <input
                      value={editMember.role}
                      onChange={(e) =>
                        setEditMember({ ...editMember, role: e.target.value })
                      }
                      className="w-full p-2 bg-zinc-800 rounded"
                    />
                    <input
                      value={editMember.department}
                      onChange={(e) =>
                        setEditMember({
                          ...editMember,
                          department: e.target.value,
                        })
                      }
                      className="w-full p-2 bg-zinc-800 rounded"
                    />
                    <input
                      value={editMember.rollNumber}
                      onChange={(e) =>
                        setEditMember({
                          ...editMember,
                          rollNumber: e.target.value,
                        })
                      }
                      className="w-full p-2 bg-zinc-800 rounded"
                    />
                    <input
                      value={editMember.registrationNumber}
                      onChange={(e) =>
                        setEditMember({
                          ...editMember,
                          registrationNumber: e.target.value,
                        })
                      }
                      className="w-full p-2 bg-zinc-800 rounded"
                    />
                    <input
                      value={editMember.email}
                      onChange={(e) =>
                        setEditMember({ ...editMember, email: e.target.value })
                      }
                      className="w-full p-2 bg-zinc-800 rounded"
                    />
                    <input
                      type="number"
                      value={editMember.priority}
                      onChange={(e) =>
                        setEditMember({
                          ...editMember,
                          priority: Number(e.target.value),
                        })
                      }
                      placeholder="Priority"
                      className="w-full p-2 bg-zinc-800 rounded"
                    />

                    <input
                      type="file"
                      onChange={(e: any) =>
                        setEditMember({
                          ...editMember,
                          newPhoto: e.target.files[0],
                        })
                      }
                    />

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleUpdateMember(editMember)}
                        className="bg-green-500 px-4 py-1 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditMember(null)}
                        className="bg-gray-500 px-4 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MESSAGES */}
          {activeTab === "messages" && (
            <div>
              <h2 className="text-2xl text-cyan-400 mb-6">Messages</h2>

              {messages.map((m) => (
                <div key={m._id} className="bg-zinc-800 p-4 rounded mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p>
                        <b>{m.name}</b> ({m.email})
                      </p>
                      <p className="text-gray-400">{m.message}</p>
                    </div>

                    <button
                      onClick={() => deleteMessage(m._id)}
                      className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* REGISTRATIONS */}
          {activeTab === "registrations" && (
            <>
              <div className="mb-6 space-y-3">
                {/* Registration Status Indicator */}
                <div
                  className={`inline-block px-4 py-2 rounded-full text-sm font-semibold
  ${registrationOpen ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                >
                  {registrationOpen
                    ? "🟢 Registrations Open"
                    : "🔴 Registrations Closed"}
                </div>

                {/* Toggle Button */}
                {registrationOpen ? (
                  <button
                    onClick={toggleRegistration}
                    disabled={toggleLoading}
                    className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded font-semibold transition disabled:opacity-50"
                  >
                    {toggleLoading ? "Stopping..." : "Stop Registration"}
                  </button>
                ) : (
                  <button
                    onClick={toggleRegistration}
                    disabled={toggleLoading}
                    className="bg-green-500 hover:bg-green-600 px-5 py-2 rounded font-semibold transition disabled:opacity-50"
                  >
                    {toggleLoading ? "Starting..." : "Start Registration"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mb-4 text-green-400 text-sm">
                {latestRegistrations.length > 0 && (
                  <div className="bg-zinc-900 border border-cyan-500/30 p-3 rounded mb-6">
                    <p className="text-cyan-400 font-semibold mb-2">
                      🔔 New Registrations
                    </p>

                    {latestRegistrations.map((reg, i) => (
                      <p key={i} className="text-sm text-gray-300">
                        🚀 {reg.teamName} registered for {reg.eventName}
                      </p>
                    ))}
                  </div>
                )}
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Live Updates Enabled
              </div>
              {/* ANALYTICS CARDS */}
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
                  <div className="bg-zinc-900 p-4 rounded border border-emerald-500/20">
                    <p className="text-gray-400 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      ₹{totalRevenue}
                    </p>
                  </div>

                  <div className="bg-zinc-900 p-4 rounded border border-blue-500/20">
                    <p className="text-gray-400 text-sm">Combo Revenue</p>
                    <p className="text-2xl font-bold text-blue-400">
                      ₹{comboRevenue}
                    </p>
                  </div>

                  <div className="bg-zinc-900 p-4 rounded border border-purple-500/20">
                    <p className="text-gray-400 text-sm">Buildathon Revenue</p>
                    <p className="text-2xl font-bold text-purple-400">
                      ₹{buildathonRevenue}
                    </p>
                  </div>
                  <div className="bg-zinc-900 p-4 rounded border border-green-500/20">
                    <p className="text-gray-400 text-sm">
                      Confirmed Combo Teams
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                      {confirmedComboTeams}
                    </p>
                  </div>

                  <div className="bg-zinc-900 p-4 rounded border border-blue-500/20">
                    <p className="text-gray-400 text-sm">
                      Confirmed Buildathon Teams
                    </p>
                    <p className="text-2xl font-bold text-blue-400">
                      {confirmedBuildathonTeams}
                    </p>
                  </div>

                  <div className="bg-zinc-900 p-4 rounded border border-orange-500/20">
                    <p className="text-gray-400 text-sm">Hostel Students</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {hostelStudents}
                    </p>
                  </div>

                  <div className="bg-zinc-900 p-4 rounded border border-cyan-500/20">
                    <p className="text-gray-400 text-sm">Total</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      {totalCount}
                    </p>
                  </div>

                  <div className="bg-zinc-900 p-4 rounded border border-yellow-500/20">
                    <p className="text-gray-400 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {pendingCount}
                    </p>
                  </div>

                  <div className="bg-zinc-900 p-4 rounded border border-green-500/20">
                    <p className="text-gray-400 text-sm">Confirmed</p>
                    <p className="text-2xl font-bold text-green-400">
                      {confirmedCount}
                    </p>
                  </div>

                  <div className="bg-zinc-900 p-4 rounded border border-blue-500/20">
                    <p className="text-gray-400 text-sm">Combo</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {comboCount}
                    </p>
                  </div>

                  <div className="bg-zinc-900 p-4 rounded border border-purple-500/20">
                    <p className="text-gray-400 text-sm">Buildathon</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {buildathonCount}
                    </p>
                  </div>

                  <div className="bg-zinc-900 p-4 rounded border border-orange-500/20">
                    <p className="text-gray-400 text-sm">Hostel</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {hostelCount}
                    </p>
                  </div>
                </div>
              </div>
              {/* CHARTS */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {/* Registration Status Chart */}
                <div className="bg-zinc-900 p-5 rounded-xl border border-cyan-500/20 shadow-lg">
                  <h3 className="text-lg text-cyan-400 mb-4">
                    Registration Status
                  </h3>

                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={90}
                        label
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Event Type Chart */}
                <div className="bg-zinc-900 p-5 rounded-xl border border-cyan-500/20 shadow-lg">
                  <h3 className="text-lg text-cyan-400 mb-4">Event Type</h3>

                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={eventData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={90}
                        label
                      >
                        {eventData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={EVENT_COLORS[index % EVENT_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-zinc-900 p-5 rounded-xl border border-cyan-500/20 shadow-lg">
                  <h3 className="text-lg text-cyan-400 mb-4">
                    🏫 Top Colleges
                  </h3>

                  <div className="space-y-2">
                    {collegeAnalytics.slice(0, 10).map((college, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-zinc-800 px-4 py-2 rounded"
                      >
                        <span>
                          {index + 1}. {college.name}
                        </span>

                        <span className="text-cyan-400 font-semibold">
                          {college.value} students
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* ✅ CLOSE GRID PROPERLY */}
              {/* SEARCH + FILTER SECTION */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                {/* SEARCH BAR */}
                <div className="relative w-full md:w-1/3">
                  <input
                    type="text"
                    placeholder="Search Team Name or Roll No..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 pr-10 bg-zinc-900 border border-cyan-500/30 rounded focus:outline-none focus:border-cyan-400"
                  />

                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* FILTER BUTTONS */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setRegistrationFilter("all")}
                    className={`px-4 py-2 rounded ${
                      registrationFilter === "all"
                        ? "bg-cyan-500 text-black"
                        : "bg-zinc-800"
                    }`}
                  >
                    All
                  </button>

                  <button
                    onClick={() => setRegistrationFilter("combo")}
                    className={`px-4 py-2 rounded ${
                      registrationFilter === "combo"
                        ? "bg-cyan-500 text-black"
                        : "bg-zinc-800"
                    }`}
                  >
                    Combo
                  </button>

                  <button
                    onClick={() => setRegistrationFilter("buildathon")}
                    className={`px-4 py-2 rounded ${
                      registrationFilter === "buildathon"
                        ? "bg-cyan-500 text-black"
                        : "bg-zinc-800"
                    }`}
                  >
                    Buildathon
                  </button>

                  <button
                    onClick={() => setRegistrationFilter("hostel")}
                    className={`px-4 py-2 rounded ${
                      registrationFilter === "hostel"
                        ? "bg-cyan-500 text-black"
                        : "bg-zinc-800"
                    }`}
                  >
                    Hostel
                  </button>
                </div>
              </div>

              {/* VIEW BUTTONS */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setRegistrationView("pending")}
                  className={`px-4 py-2 rounded ${
                    registrationView === "pending"
                      ? "bg-yellow-500 text-black"
                      : "bg-zinc-800"
                  }`}
                >
                  Pending
                </button>

                <button
                  onClick={() => setRegistrationView("confirmed")}
                  className={`px-4 py-2 rounded ${
                    registrationView === "confirmed"
                      ? "bg-green-500 text-black"
                      : "bg-zinc-800"
                  }`}
                >
                  Confirmed
                </button>
              </div>
              {/* TOTAL COUNTER */}
              <p className="mb-4 text-yellow-400 font-semibold">
                Total:{" "}
                {
                  registrations.filter((reg) =>
                    registrationFilter === "all"
                      ? true
                      : reg.eventType === registrationFilter,
                  ).length
                }
              </p>
              <h2 className="text-2xl text-cyan-400 mb-6">Registrations</h2>
              {/* ================= PENDING CARDS ================= */}
              {registrationView === "pending" ? (
                <>
                  {registrations
                    .filter((reg) => {
                      if (registrationFilter === "all") return true;

                      if (registrationFilter === "hostel") {
                        return (
                          reg.accommodationRequired === true &&
                          reg.hostelMembers &&
                          reg.hostelMembers.length > 0
                        );
                      }

                      return reg.eventType === registrationFilter;
                    })
                    .filter((reg) => reg.registrationStatus === "Pending")
                    .filter((reg) => {
                      const term = searchTerm.toLowerCase();

                      const teamMatch = reg.teamName
                        .toLowerCase()
                        .includes(term);

                      const rollMatch = reg.teamMembers.some((m: any) =>
                        m.rollNo?.toLowerCase().includes(term),
                      );

                      return teamMatch || rollMatch;
                    })
                    .map((reg) => (
                      <div
                        key={reg._id}
                        className="bg-zinc-900 border border-cyan-500/20 p-6 rounded-xl shadow-lg hover:border-cyan-400 transition mb-6"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-xl text-cyan-400">
                            {reg.teamName}
                          </h3>
                          <span className="text-yellow-400 font-semibold">
                            {reg.registrationId}
                          </span>
                        </div>

                        <p>
                          <b>Event:</b> {reg.eventName}
                        </p>
                        {reg.payment?.amountMismatch && (
                          <p className="text-red-400 text-sm">
                            ⚠ Amount mismatch detected
                          </p>
                        )}

                        <div className="mt-3">
                          <b>Members:</b>
                          {reg.teamMembers.map((m: any, i: number) => (
                            <div key={i}>{m.fullName}</div>
                          ))}
                        </div>

                        <div className="mt-4 flex gap-3 flex-wrap">
                          <button
                            onClick={() => setSelectedFullDetails(reg)}
                            className="bg-cyan-500 px-3 py-1 rounded"
                          >
                            Full Details
                          </button>
                          <button
                            onClick={() => confirmRegistration(reg._id)}
                            className="bg-green-500 px-3 py-1 rounded"
                          >
                            Confirm
                          </button>

                          <button
                            onClick={() => deleteRegistration(reg._id)}
                            className="bg-red-500 px-3 py-1 rounded"
                          >
                            Delete
                          </button>

                          {reg.payment?.screenshotUrl && (
                            <button
                              onClick={() =>
                                setSelectedScreenshot(reg.payment.screenshotUrl)
                              }
                              className="bg-blue-500 px-3 py-1 rounded"
                            >
                              View Payment
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </>
              ) : (
                <>
                  {/* ================= CONFIRMED TABLE ================= */}

                  <div className="flex gap-4 mb-4">
                    <div className="flex gap-4 mb-4">
                      <button
                        onClick={exportRegistrations}
                        className="bg-green-500 px-4 py-2 rounded"
                      >
                        Export Excel
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full bg-zinc-900 rounded-lg overflow-hidden">
                      <thead className="bg-zinc-800 text-cyan-400">
                        <tr>
                          <th className="p-3 text-left">Reg ID</th>
                          <th className="p-3 text-left">Team</th>
                          <th className="p-3 text-left">Members</th>
                          <th className="p-3 text-left">Event</th>
                          <th className="p-3 text-left">Hostel</th>
                          <th className="p-3 text-left">Payment</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations
                          .filter((reg) => {
                            if (registrationFilter === "all") return true;

                            if (registrationFilter === "hostel") {
                              return (
                                reg.accommodationRequired === true &&
                                reg.hostelMembers &&
                                reg.hostelMembers.length > 0
                              );
                            }

                            return reg.eventType === registrationFilter;
                          })
                          .filter(
                            (reg) => reg.registrationStatus === "Confirmed",
                          )
                          .filter((reg) => {
                            const term = searchTerm.toLowerCase();

                            const teamMatch = reg.teamName
                              .toLowerCase()
                              .includes(term);

                            const rollMatch = reg.teamMembers.some((m: any) =>
                              m.rollNo?.toLowerCase().includes(term),
                            );

                            return teamMatch || rollMatch;
                          })
                          .map((reg) => (
                            <tr
                              key={reg._id}
                              className="border-t border-zinc-700"
                            >
                              <td className="p-3 text-green-400 font-semibold">
                                {reg.registrationId}
                              </td>

                              <td className="p-3">{reg.teamName}</td>

                              <td className="p-3 text-sm">
                                {registrationFilter === "hostel"
                                  ? reg.hostelMembers?.map(
                                      (m: any, i: number) => (
                                        <div key={i}>{m.fullName}</div>
                                      ),
                                    )
                                  : reg.teamMembers.map((m: any, i: number) => (
                                      <div key={i}>{m.fullName}</div>
                                    ))}
                              </td>

                              <td className="p-3">{reg.eventName}</td>

                              <td className="p-3">
                                {reg.accommodationRequired ? "Yes" : "No"}
                              </td>

                              <td className="p-3 flex gap-2 justify-center">
                                <button
                                  onClick={() => setSelectedFullDetails(reg)}
                                  className="bg-cyan-500 px-3 py-1 rounded"
                                >
                                  Full Details
                                </button>

                                {reg.payment?.screenshotUrl && (
                                  <button
                                    onClick={() =>
                                      setSelectedScreenshot(
                                        reg.payment.screenshotUrl,
                                      )
                                    }
                                    className="bg-blue-500 px-3 py-1 rounded"
                                  >
                                    View
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteRegistration(reg._id)}
                                  className="bg-red-500 px-3 py-1 rounded"
                                >
                                  Delete
                                </button>

                                <a
                                  href={`https://ieee-sps-website.onrender.com/api/pdf/${reg.registrationId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-purple-500 px-3 py-1 rounded"
                                >
                                  PDF
                                </a>
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
                  className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                  onClick={() => setSelectedScreenshot(null)}
                >
                  <div
                    className="bg-zinc-900 p-6 rounded max-w-3xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={selectedScreenshot}
                      alt="Screenshot"
                      className="max-h-[80vh] rounded"
                    />
                  </div>
                </div>
              )}
              {selectedFullDetails && (
                <div
                  className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                  onClick={() => setSelectedFullDetails(null)}
                >
                  <div
                    className="bg-zinc-900 p-8 rounded w-[700px] max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="text-2xl font-semibold text-cyan-400 mb-4">
                      Full Registration Details
                    </h3>

                    <div className="space-y-1 mb-4">
                      <p>
                        <b>Registration ID:</b>{" "}
                        {selectedFullDetails.registrationId}
                      </p>
                      <p>
                        <b>Team Name:</b> {selectedFullDetails.teamName}
                      </p>
                      <p>
                        <b>Event:</b> {selectedFullDetails.eventName}
                      </p>
                      <p>
                        <b>Event Type:</b> {selectedFullDetails.eventType}
                      </p>
                      <p>
                        <b>Accommodation Required:</b>{" "}
                        {selectedFullDetails.accommodationRequired
                          ? "Yes"
                          : "No"}
                      </p>

                      <p>
                        <b>Payment Screenshot Submitted</b>
                      </p>
                    </div>
                    {selectedFullDetails.hostelMembers &&
                      selectedFullDetails.hostelMembers.length > 0 && (
                        <div className="mt-3">
                          <b>Hostel Members:</b>
                          {selectedFullDetails.hostelMembers.map(
                            (m: any, i: number) => (
                              <div
                                key={i}
                                className="mt-2 p-2 bg-zinc-800 rounded"
                              >
                                {m.fullName}
                              </div>
                            ),
                          )}
                        </div>
                      )}

                    <div className="mt-4">
                      <b>Team Members:</b>
                      {selectedFullDetails.teamMembers.map(
                        (m: any, i: number) => (
                          <div key={i} className="mt-2 p-2 bg-zinc-800 rounded">
                            <p>
                              <b>Name:</b> {m.fullName}
                            </p>
                            <p>
                              <b>Roll No:</b> {m.rollNo || "N/A"}
                            </p>
                            <p>
                              <b>Email:</b> {m.email || "N/A"}
                            </p>
                            <p>
                              <b>Phone:</b> {m.phone || "N/A"}
                            </p>
                            <p>
                              <b>Department:</b> {m.department}
                            </p>
                            <p>
                              <b>Year:</b> {m.year}
                            </p>
                            <p>
                              <b>College:</b> {m.college}
                            </p>
                            <p>
                              <b>City:</b> {m.collegeCity || "N/A"}
                            </p>
                            <p>
                              <b>Pincode:</b> {m.collegePincode || "N/A"}
                            </p>
                            <p>
                              <b>District:</b> {m.collegeDistrict || "N/A"}
                            </p>
                            <p>
                              <b>State:</b> {m.collegeState || "N/A"}
                            </p>
                          </div>
                        ),
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedFullDetails(null)}
                      className="mt-4 bg-red-500 px-4 py-2 rounded"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
