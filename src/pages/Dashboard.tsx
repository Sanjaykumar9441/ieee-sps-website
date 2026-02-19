import { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Mail, Upload, LogOut, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("upload");

  /* ================= EVENTS ================= */
  const [events, setEvents] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("Upcoming");
  const [images, setImages] = useState<FileList | null>(null);

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

  /* ================= MESSAGES ================= */
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    fetchEvents();
    fetchMembers();
    fetchMessages();
  }, []);

  /* ================= FETCH ================= */

  const fetchEvents = async () => {
    const res = await axios.get("http://localhost:5000/events");
    setEvents(res.data);
  };

  const fetchMembers = async () => {
    const res = await axios.get("http://localhost:5000/team");
    setMembers(res.data);
  };

  const fetchMessages = async () => {
    const res = await axios.get("http://localhost:5000/messages", {
      headers: { Authorization: token }
    });
    setMessages(res.data);
  };

  /* ================= LOGOUT ================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  /* ================= UPLOAD EVENT ================= */

  const handleEventUpload = async (e: any) => {
    e.preventDefault();

    if (status === "Completed" && !images) {
      alert("Completed events must include gallery images.");
      return;
    }

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

    await axios.post("http://localhost:5000/events", formData, {
      headers: { Authorization: token }
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

    if (newData.status === "Completed" && !newData.images) {
      alert("Completed events require gallery images.");
      return;
    }

    const formData = new FormData();
    formData.append("title", newData.title);
    formData.append("description", newData.description);
    formData.append("date", newData.date);
    formData.append("location", newData.location);
    formData.append("status", newData.status);

    if (newData.images) {
      for (let i = 0; i < newData.images.length; i++) {
        formData.append("images", newData.images[i]);
      }
    }

    await axios.put(
      `http://localhost:5000/events/${event._id}`,
      formData,
      { headers: { Authorization: token } }
    );

    alert("Event Updated Successfully");
    fetchEvents();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;

    await axios.delete(`http://localhost:5000/events/${id}`, {
      headers: { Authorization: token }
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
    formData.append("phone", phone);
    formData.append("priority", priority.toString());
    if (photo) formData.append("photo", photo);

    await axios.post("http://localhost:5000/team", formData, {
      headers: { Authorization: token }
    });

    alert("Member Added Successfully");

    setName("");
    setRole("");
    setDepartment("");
    setRollNumber("");
    setRegistrationNumber("");
    setEmail("");
    setPhone("");
    setPriority(5);
    setPhoto(null);

    fetchMembers();
  };

  const deleteMember = async (id: string) => {
    if (!confirm("Delete this member?")) return;

    await axios.delete(`http://localhost:5000/team/${id}`, {
      headers: { Authorization: token }
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
  formData.append("phone", member.phone);
  formData.append("priority", member.priority);

  if (member.newPhoto) {
    formData.append("photo", member.newPhoto);
  }

  await axios.put(
    `http://localhost:5000/team/${member._id}`,
    formData,
    { headers: { Authorization: token } }
  );

  alert("Member Updated Successfully");
  setEditMember(null);
  fetchMembers();
};

  /* ================= MENU ================= */

  const menu = [
    { id: "upload", label: "Upload Event", icon: Upload },
    { id: "events", label: "Manage Events", icon: Calendar },
    { id: "team", label: "Team Management", icon: Users },
    { id: "messages", label: "Messages", icon: Mail }
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
                onClick={() => setActiveTab(item.id)}
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
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="w-full p-2 bg-zinc-800 rounded"/>
              <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className="w-full p-2 bg-zinc-800 rounded"/>
              <input value={date} onChange={e=>setDate(e.target.value)} placeholder="Date" className="w-full p-2 bg-zinc-800 rounded"/>
              <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Location" className="w-full p-2 bg-zinc-800 rounded"/>
              <select value={status} onChange={e=>setStatus(e.target.value)} className="w-full p-2 bg-zinc-800 rounded">
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
              </select>
              {status === "Completed" && (
                <input type="file" multiple required onChange={(e:any)=>setImages(e.target.files)} />
              )}
              <button className="bg-cyan-500 px-6 py-2 rounded">Upload</button>
            </form>
          )}

          {/* MANAGE EVENTS */}
          {activeTab === "events" && (
            <div>
              <h2 className="text-2xl text-cyan-400 mb-6">Manage Events</h2>
              {events.map((event)=>(
                <EditableEvent
                  key={event._id}
                  event={event}
                  onUpdate={handleUpdate}
                  onDelete={deleteEvent}
                />
              ))}
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
      <form onSubmit={handleAddMember} className="space-y-3 max-w-xl mb-10">
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} className="w-full p-2 bg-zinc-800 rounded"/>
        <input placeholder="Role" value={role} onChange={e=>setRole(e.target.value)} className="w-full p-2 bg-zinc-800 rounded"/>
        <input placeholder="Department" value={department} onChange={e=>setDepartment(e.target.value)} className="w-full p-2 bg-zinc-800 rounded"/>
        <input placeholder="Roll Number" value={rollNumber} onChange={e=>setRollNumber(e.target.value)} className="w-full p-2 bg-zinc-800 rounded"/>
        <input placeholder="Registration Number" value={registrationNumber} onChange={e=>setRegistrationNumber(e.target.value)} className="w-full p-2 bg-zinc-800 rounded"/>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-2 bg-zinc-800 rounded"/>
        <input placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full p-2 bg-zinc-800 rounded"/>
        <input type="number" placeholder="Priority (1 = Chair)" onChange={e=>setPriority(Number(e.target.value))} className="w-full p-2 bg-zinc-800 rounded"/>
        <input type="file" onChange={(e:any)=>setPhoto(e.target.files[0])}/>
        <button className="bg-green-500 px-6 py-2 rounded">Add Member</button>
      </form>
    )}

    {/* ===== MANAGE TEAM ===== */}
    {teamView === "manage" && (
      <div className="grid md:grid-cols-3 gap-6">
        {members.map((m)=>(
          <div key={m._id} className="bg-zinc-800 p-6 rounded text-center">
            <img src={`http://localhost:5000/uploads/${m.photo}`} className="w-28 h-28 rounded-full mx-auto mb-4 object-cover"/>
            <h3>{m.name}</h3>
            <p className="text-cyan-400">{m.role}</p>

            <div className="flex gap-2 justify-center mt-3">
              <button
                onClick={()=>setEditMember(m)}
                className="bg-cyan-500 px-3 py-1 rounded"
              >
                Edit
              </button>

              <button
                onClick={()=>deleteMember(m._id)}
                className="bg-red-500 px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* ===== EDIT MEMBER MODAL ===== */}
    {editMember && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
        <div className="bg-zinc-900 p-8 rounded w-[400px] space-y-3">
          <h3 className="text-xl text-cyan-400">Edit Member</h3>

          <input value={editMember.name} onChange={e=>setEditMember({...editMember,name:e.target.value})} className="w-full p-2 bg-zinc-800 rounded"/>
          <input value={editMember.role} onChange={e=>setEditMember({...editMember,role:e.target.value})} className="w-full p-2 bg-zinc-800 rounded"/>
          <input value={editMember.department} onChange={e=>setEditMember({...editMember,department:e.target.value})} className="w-full p-2 bg-zinc-800 rounded"/>
          <input value={editMember.email} onChange={e=>setEditMember({...editMember,email:e.target.value})} className="w-full p-2 bg-zinc-800 rounded"/>
          <input type="file" onChange={(e:any)=>setEditMember({...editMember,newPhoto:e.target.files[0]})}/>

          <div className="flex gap-3">
            <button onClick={()=>handleUpdateMember(editMember)} className="bg-green-500 px-4 py-1 rounded">
              Save
            </button>
            <button onClick={()=>setEditMember(null)} className="bg-gray-500 px-4 py-1 rounded">
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
              {messages.map((m,i)=>(
                <div key={i} className="bg-zinc-800 p-4 rounded mb-3">
                  <p><b>{m.name}</b> ({m.email})</p>
                  <p className="text-gray-400">{m.message}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

/* ================= EDITABLE EVENT ================= */

const EditableEvent = ({ event, onUpdate, onDelete }: any) => {
  const [edit, setEdit] = useState(false);
  const [data, setData] = useState({
    title: event.title,
    description: event.description,
    date: event.date,
    location: event.location,
    status: event.status,
    images: null
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
            <button onClick={()=>setEdit(true)} className="bg-cyan-500 px-4 py-1 rounded">Edit</button>
            <button onClick={()=>onDelete(event._id)} className="bg-red-500 px-4 py-1 rounded">Delete</button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <input value={data.title} onChange={e=>setData({...data,title:e.target.value})} className="w-full p-2 bg-zinc-700 rounded"/>
          <textarea value={data.description} onChange={e=>setData({...data,description:e.target.value})} className="w-full p-2 bg-zinc-700 rounded"/>
          <input value={data.date} onChange={e=>setData({...data,date:e.target.value})} className="w-full p-2 bg-zinc-700 rounded"/>
          <input value={data.location} onChange={e=>setData({...data,location:e.target.value})} className="w-full p-2 bg-zinc-700 rounded"/>
          <select value={data.status} onChange={e=>setData({...data,status:e.target.value})} className="w-full p-2 bg-zinc-700 rounded">
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
          </select>

          {data.status === "Completed" && (
            <input type="file" multiple required onChange={(e:any)=>setData({...data,images:e.target.files})}/>
          )}

          <div className="flex gap-3">
            <button onClick={()=>{onUpdate(event,data); setEdit(false);}} className="bg-green-500 px-4 py-1 rounded">Save</button>
            <button onClick={()=>setEdit(false)} className="bg-gray-500 px-4 py-1 rounded">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
