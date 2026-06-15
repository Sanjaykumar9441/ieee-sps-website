import { useEffect, useState } from "react";
import axios from "axios";
const token = localStorage.getItem("token");

const AdminsTab = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [editingAdminId, setEditingAdminId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [externalName, setExternalName] = useState("");
  const [externalRole, setExternalRole] = useState("");

  const [permissions, setPermissions] = useState({
    events: false,
    team: false,
    registrations: false,
    messages: false,
  });

  useEffect(() => {
    fetchMembers();
    fetchAdmins();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await axios.get("https://ieee-sps-website.onrender.com/team");

      setMembers(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "https://ieee-sps-website.onrender.com/api/admin-access",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setAdmins(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const deleteAdmin = async (id: string) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `https://ieee-sps-website.onrender.com/api/admin-access/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchAdmins();

      alert("Admin access removed");
    } catch (err) {
      console.log(err);
      alert("Failed to remove access");
    }
  };

  const editAdmin = (admin: any) => {
    setEditingAdminId(admin._id);

    setSelectedMember(admin.memberId);

    setUsername(admin.username);

    setPermissions({
      events: admin.permissions.events,
      team: admin.permissions.team,
      registrations: admin.permissions.registrations,
      messages: admin.permissions.messages,
    });
  };

  const saveAccess = async () => {
    try {
      await axios.post(
        "https://ieee-sps-website.onrender.com/api/admin-access",
        {
          memberId: selectedMember._id,
          username,
          password,
          permissions,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      alert("Admin access granted successfully");
      fetchAdmins();
    } catch (err) {
      console.error(err);
      alert("Failed to save access");
    }
  };

  const saveExternalAdmin = async () => {
    try {
      await axios.post(
        "https://ieee-sps-website.onrender.com/api/admin-access",
        {
          name: externalName,
          role: externalRole,
          isExternal: true,

          username,
          password,

          permissions,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      alert("External Admin Created");

      fetchAdmins();
    } catch (err) {
      console.error(err);
      alert("Failed to create external admin");
    }
  };

  const updateAccess = async () => {
    try {
      await axios.put(
        `https://ieee-sps-website.onrender.com/api/admin-access/${editingAdminId}`,
        {
          username,
          permissions,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      alert("Admin access updated successfully");

      setEditingAdminId("");

      fetchAdmins();
    } catch (err) {
      console.error(err);
      alert("Failed to update access");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          Admin Management
        </h2>

        <p className="text-sm" style={{ color: "#64748b" }}>
          Manage dashboard access for team members
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT */}
        <div
          className="rounded-xl p-5"
          style={{
            backgroundColor: "#0f1624",
            border: "1px solid rgba(99,179,237,0.08)",
          }}
        >
          <h3 className="font-semibold mb-4">Team Members</h3>

          <div className="space-y-2">
            {members.map((member) => (
              <button
                key={member._id}
                onClick={() => setSelectedMember(member)}
                className="w-full text-left p-3 rounded-lg transition-all"
                style={{
                  backgroundColor:
                    selectedMember?._id === member._id
                      ? "rgba(59,130,246,0.15)"
                      : "rgba(255,255,255,0.02)",
                }}
              >
                <div>{member.name}</div>

                <div className="text-xs" style={{ color: "#64748b" }}>
                  {member.role}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div
          className="rounded-xl p-5 mt-6"
          style={{
            backgroundColor: "#0f1624",
            border: "1px solid rgba(99,179,237,0.08)",
          }}
        >
          <h3 className="font-semibold mb-4">External Admin</h3>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Full Name"
              value={externalName}
              onChange={(e) => setExternalName(e.target.value)}
              className="w-full p-3 rounded-lg"
            />

            <input
              type="text"
              placeholder="Role"
              value={externalRole}
              onChange={(e) => setExternalRole(e.target.value)}
              className="w-full p-3 rounded-lg"
            />

            <button
              onClick={saveExternalAdmin}
              className="px-4 py-2 rounded-lg bg-green-600"
            >
              Create External Admin
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div
          className="rounded-xl p-5"
          style={{
            backgroundColor: "#0f1624",
            border: "1px solid rgba(99,179,237,0.08)",
          }}
        >
          {!selectedMember ? (
            <p style={{ color: "#64748b" }}>Select a team member</p>
          ) : (
            <>
              <h3 className="font-semibold mb-2">{selectedMember.name}</h3>

              <p className="text-sm mb-5" style={{ color: "#64748b" }}>
                {selectedMember.role}
              </p>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 rounded-lg"
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded-lg"
                />

                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={permissions.events}
                      onChange={(e) =>
                        setPermissions({
                          ...permissions,
                          events: e.target.checked,
                        })
                      }
                    />
                    Events Access
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={permissions.team}
                      onChange={(e) =>
                        setPermissions({
                          ...permissions,
                          team: e.target.checked,
                        })
                      }
                    />
                    Team Access
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={permissions.registrations}
                      onChange={(e) =>
                        setPermissions({
                          ...permissions,
                          registrations: e.target.checked,
                        })
                      }
                    />
                    Registration Access
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={permissions.messages}
                      onChange={(e) =>
                        setPermissions({
                          ...permissions,
                          messages: e.target.checked,
                        })
                      }
                    />
                    Messages Access
                  </label>
                </div>

                <button
                  onClick={editingAdminId ? updateAccess : saveAccess}
                  className="px-5 py-3 rounded-lg bg-blue-600"
                >
                  {editingAdminId ? "Update Access" : "Save Access"}
                </button>
              </div>
            </>
          )}
          <div className="mt-8">
            <h3 className="font-semibold mb-4">Existing Admins</h3>

            <div className="space-y-3">
              {admins.map((admin: any) => (
                <div
                  key={admin._id}
                  className="p-4 rounded-xl"
                  style={{
                    backgroundColor: "#0f1624",
                    border: "1px solid rgba(99,179,237,0.08)",
                  }}
                >
                  <div className="font-medium">{admin.memberId?.name}</div>

                  <div className="text-sm" style={{ color: "#64748b" }}>
                    Username: {admin.username}
                  </div>

                  <button
                    onClick={() => editAdmin(admin)}
                    className="mt-3 mr-2 px-3 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: "rgba(59,130,246,0.1)",
                      color: "#60a5fa",
                      border: "1px solid rgba(59,130,246,0.2)",
                    }}
                  >
                    Edit Access
                  </button>

                  <button
                    onClick={() => deleteAdmin(admin._id)}
                    className="mt-3 px-3 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: "rgba(239,68,68,0.1)",
                      color: "#f87171",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    Remove Access
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminsTab;
