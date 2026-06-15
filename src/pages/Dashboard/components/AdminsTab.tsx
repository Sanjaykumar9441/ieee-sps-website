import { useEffect, useState } from "react";
import axios from "axios";

const AdminsTab = () => {
  const token = localStorage.getItem("token");
  const [members, setMembers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [editingAdminId, setEditingAdminId] = useState("");
  const [viewAdmin, setViewAdmin] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [externalName, setExternalName] = useState("");
  const [externalRole, setExternalRole] = useState("");
  const [search, setSearch] = useState("");

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

  const resetPassword = async (id: string) => {
    try {
      await axios.post(
        `https://ieee-sps-website.onrender.com/api/admin-access/reset-password/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      alert(
        "Password reset successfully. User must change password on next login.",
      );
    } catch (err) {
      console.error(err);

      alert("Failed to reset password");
    }
  };

  const editAdmin = (admin: any) => {
    setEditingAdminId(admin._id);

    if (admin.isExternal) {
      setExternalName(admin.name);
      setExternalRole(admin.role);
      setSelectedMember(null);
    } else {
      setSelectedMember(admin.memberId);
    }

    setUsername(admin.username);

    setPermissions({
      events: admin.permissions.events,
      team: admin.permissions.team,
      registrations: admin.permissions.registrations,
      messages: admin.permissions.messages,
    });
  };

  const openViewModal = (admin: any) => {
    setViewAdmin(admin);
    setShowViewModal(true);
  };

  const saveAccess = async () => {
    try {
      await axios.post(
        "https://ieee-sps-website.onrender.com/api/admin-access",
        {
          memberId: selectedMember._id,

          username: selectedMember.rollNumber,
          password: selectedMember.rollNumber,

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
          name: externalName,
          role: externalRole,
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

  const filteredAdmins = admins.filter((admin: any) => {
    const name = admin.isExternal ? admin.name : admin.memberId?.name;

    return name?.toLowerCase().includes(search.toLowerCase());
  });

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
                onClick={() => {
                  setSelectedMember(member);

                  setUsername(member.rollNumber || "");
                  setPassword(member.rollNumber || "");
                }}
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
              onClick={editingAdminId ? updateAccess : saveExternalAdmin}
              className="px-4 py-2 rounded-lg bg-green-600"
            >
              {editingAdminId
                ? "Update External Admin"
                : "Create External Admin"}
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
          {!selectedMember && !editingAdminId ? (
            <p style={{ color: "#64748b" }}>Select a team member</p>
          ) : (
            <>
              <h3 className="font-semibold mb-2">
                {selectedMember?.name || externalName}
              </h3>

              <p className="text-sm mb-5" style={{ color: "#64748b" }}>
                {selectedMember?.role || externalRole}
              </p>

              <div className="space-y-4">
                <input
                  type="text"
                  value={username}
                  readOnly={selectedMember !== null}
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
            <input
              type="text"
              placeholder="Search Admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 rounded-lg mb-4"
              style={{
                backgroundColor: "#0f1624",
                border: "1px solid rgba(99,179,237,0.08)",
              }}
            />
            <h3 className="font-semibold mb-4">Existing Admins</h3>

            <div className="space-y-3">
              {filteredAdmins.map((admin: any) => (
                <div
                  key={admin._id}
                  className="p-4 rounded-xl"
                  style={{
                    backgroundColor: "#0f1624",
                    border: "1px solid rgba(99,179,237,0.08)",
                  }}
                >
                  <div className="font-medium">
                    {admin.isExternal ? admin.name : admin.memberId?.name}
                  </div>

                  <div className="text-sm" style={{ color: "#64748b" }}>
                    {admin.isExternal ? admin.role : admin.memberId?.role}
                  </div>

                  <div className="text-xs mt-1" style={{ color: "#60a5fa" }}>
                    {admin.isExternal ? "External Admin" : "Team Member Admin"}
                  </div>

                  <div className="text-sm mt-2" style={{ color: "#64748b" }}>
                    Username: {admin.username}
                  </div>
                  <div className="mt-3 text-sm">Permissions:</div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {admin.permissions.events && (
                      <span className="px-2 py-1 rounded bg-blue-500/20 text-xs">
                        Events
                      </span>
                    )}

                    {admin.permissions.team && (
                      <span className="px-2 py-1 rounded bg-blue-500/20 text-xs">
                        Team
                      </span>
                    )}

                    {admin.permissions.messages && (
                      <span className="px-2 py-1 rounded bg-blue-500/20 text-xs">
                        Messages
                      </span>
                    )}

                    {admin.permissions.registrations && (
                      <span className="px-2 py-1 rounded bg-blue-500/20 text-xs">
                        Registrations
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => openViewModal(admin)}
                    className="mt-3 mr-2 px-3 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: "rgba(34,197,94,0.1)",
                      color: "#22c55e",
                      border: "1px solid rgba(34,197,94,0.2)",
                    }}
                  >
                    👁 View
                  </button>

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
                    onClick={() => resetPassword(admin._id)}
                    className="mt-3 mr-2 px-3 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: "rgba(245,158,11,0.1)",
                      color: "#f59e0b",
                      border: "1px solid rgba(245,158,11,0.2)",
                    }}
                  >
                    🔑 Reset Password
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
            {showViewModal && viewAdmin && (
              <div
                className="fixed inset-0 flex items-center justify-center z-50"
                style={{
                  backgroundColor: "rgba(0,0,0,0.7)",
                }}
              >
                <div
                  className="p-6 rounded-xl w-full max-w-md"
                  style={{
                    backgroundColor: "#0f1624",
                  }}
                >
                  <h2 className="text-xl font-bold mb-4">Admin Details</h2>

                  <p>
                    <strong>Name:</strong>{" "}
                    {viewAdmin.isExternal
                      ? viewAdmin.name
                      : viewAdmin.memberId?.name}
                  </p>

                  <p>
                    <strong>Role:</strong>{" "}
                    {viewAdmin.isExternal
                      ? viewAdmin.role
                      : viewAdmin.memberId?.role}
                  </p>

                  <p>
                    <strong>Username:</strong> {viewAdmin.username}
                  </p>

                  <p className="mt-3">
                    <strong>Password Status:</strong>{" "}
                    {viewAdmin.mustChangePassword
                      ? "Using Default Password"
                      : "Changed"}
                  </p>

                  <p>
                    <strong>Last Password Change:</strong>{" "}
                    {viewAdmin.lastPasswordChange
                      ? new Date(viewAdmin.lastPasswordChange).toLocaleString()
                      : "Never"}
                  </p>

                  <button
                    onClick={() => setShowViewModal(false)}
                    className="mt-5 px-4 py-2 rounded-lg bg-blue-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminsTab;
