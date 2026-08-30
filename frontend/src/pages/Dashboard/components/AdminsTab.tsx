import { useEffect, useState } from "react";
import axios from "axios";

const AdminsTab = () => {
  const token = localStorage.getItem("token");
  const [members, setMembers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [viewAdmin, setViewAdmin] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showExternalAdmin, setShowExternalAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [externalName, setExternalName] = useState("");
  const [externalRole, setExternalRole] = useState("");
  const [search, setSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [showPermissionForm, setShowPermissionForm] = useState(false);

  const [permissions, setPermissions] = useState({
    dashboardOverview: false,
    events: false,
    team: false,
    arduinoRegistrations: false,
    spaceDayRegistrations: false,
    spaceDayAttendance: false,
    messages: false,
    spsApplications: false,
    membershipRegistrations: false,
    assessmentPlatform: false,
    certificates: false,
  });

  useEffect(() => {
    fetchMembers();
    fetchAdmins();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await axios.get("VITE_API_URL/team");
      setMembers(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "VITE_API_URL/api/admin-access",
        { headers: { Authorization: `Bearer ${token}` } },
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
        `VITE_API_URL/api/admin-access/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
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
        `VITE_API_URL/api/admin-access/reset-password/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchAdmins();
      alert(
        "Password reset successfully. User must change password on next login.",
      );
    } catch (err) {
      console.error(err);
      alert("Failed to reset password");
    }
  };

  const toggleAdminStatus = async (id: string, currentlyPaused: boolean) => {
    try {
      const token = localStorage.getItem("token");

      let reason = "";

      if (!currentlyPaused) {
        reason =
          prompt("Pause Reason:", "Temporary Committee Restriction") ||
          "Temporary Committee Restriction";
      }

      await axios.put(
        `VITE_API_URL/api/admin-access/toggle-status/${id}`,
        {
          reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchAdmins();
    } catch (err) {
      console.error(err);
      alert("Failed to update admin status");
    }
  };

  const editAdmin = (admin: any) => {
    setEditingAdminId(admin._id);
    if (admin.isExternal) {
      setExternalName(admin.name);
      setExternalRole(admin.role);
      setSelectedMember(null);
      setShowExternalAdmin(true);
    } else {
      setSelectedMember(admin.memberId);
      setShowExternalAdmin(false);
    }
    setUsername(admin.username);
    setPermissions({
      dashboardOverview: admin.permissions.dashboardOverview,
      events: admin.permissions.events,
      team: admin.permissions.team,
      arduinoRegistrations: admin.permissions.arduinoRegistrations,
      spaceDayRegistrations: admin.permissions.spaceDayRegistrations,
      spaceDayAttendance: admin.permissions.spaceDayAttendance,
      messages: admin.permissions.messages,
      spsApplications: admin.permissions.spsApplications,
      membershipRegistrations: admin.permissions.membershipRegistrations,
      assessmentPlatform: admin.permissions.assessmentPlatform,
      certificates: admin.permissions.certificates,
    });
    setShowPermissionForm(true);
  };

  const openViewModal = (admin: any) => {
    setViewAdmin(admin);
    setShowViewModal(true);
  };

  const saveAccess = async () => {
    try {
      if (editingAdminId) {
        await axios.put(
          `VITE_API_URL/api/admin-access/${editingAdminId}`,
          {
            permissions,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        alert("Admin access updated successfully");
        setShowExternalAdmin(false);
        setExternalName("");
        setExternalRole("");
        setUsername("");
        fetchAdmins();
      } else {
        await axios.post(
          "VITE_API_URL/api/admin-access",
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
      }

      fetchAdmins();

      setSelectedMember(null);
      setEditingAdminId(null);

      setPermissions({
        dashboardOverview: false,
        events: false,
        team: false,
        arduinoRegistrations: false,
        spaceDayRegistrations: false,
        spaceDayAttendance: false,
        messages: false,
        spsApplications: false,
        membershipRegistrations: false,
        assessmentPlatform: false,
        certificates: false,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to save access");
    }
  };

  const saveExternalAdmin = async () => {
    try {
      await axios.post(
        "VITE_API_URL/api/admin-access",
        {
          name: externalName,
          role: externalRole,
          isExternal: true,
          username,
          password,
          permissions,
        },
        { headers: { Authorization: `Bearer ${token}` } },
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
        `VITE_API_URL/api/admin-access/${editingAdminId}`,
        { username, permissions, name: externalName, role: externalRole },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Admin access updated successfully");
      setEditingAdminId(null);
      fetchAdmins();
      setEditingAdminId(null);

      setSelectedMember(null);

      setShowExternalAdmin(false);

      setExternalName("");
      setExternalRole("");

      setUsername("");
      setPassword("");
    } catch (err) {
      console.error(err);
      alert("Failed to update access");
    }
  };

  const filteredAdmins = admins.filter((admin: any) => {
    const name = admin.isExternal ? admin.name : admin.memberId?.name;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  const cardStyle = {
    backgroundColor: "#FFFFFF",
    border: "1px solid #EBE8E2",
    boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)",
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: "#FAF9F7",
    border: "1px solid #EBE8E2",
    color: "#1C1B22",
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
  };

  const permissionKeys = [
    { key: "dashboardOverview", label: "Dashboard Overview" },
    { key: "events", label: "Events" },
    { key: "team", label: "Team" },
    { key: "arduinoRegistrations", label: "Arduino Days Registrations" },
    { key: "spaceDayRegistrations", label: "Space Day Registrations" },
    { key: "spaceDayAttendance", label: "Space day Attendance" },
    { key: "messages", label: "Messages" },
    { key: "spsApplications", label: "SPS Applications" },
    { key: "membershipRegistrations", label: "Membership Registrations" },
    { key: "assessmentPlatform", label: "Assessment Dashboard" },
  ] as const;

  const isExternalMode =
    showExternalAdmin || (editingAdminId && !selectedMember);
  const hasSelection = selectedMember || isExternalMode;

  const isMemberAdmin = (memberId: string) => {
    return admins.some((admin) => admin.memberId?._id === memberId);
  };

  const filteredMembers = members.filter(
    (member) =>
      member.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      member.rollNumber?.toLowerCase().includes(memberSearch.toLowerCase()),
  );

  return (
    <div style={{ color: "#1C1B22" }}>
      {/* ── Page Header ── */}
      <div className="mb-8">
        <h2
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Admin Management
        </h2>
        <p className="text-sm" style={{ color: "#8A8578" }}>
          Manage dashboard access for team members
        </p>
      </div>

      {/* ── Top Section: Select + Configure (side by side) ── */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* LEFT — Member Selection */}
        <div className="rounded-xl p-5 flex flex-col gap-4" style={cardStyle}>
          {/* Team Members List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3
                className="font-semibold text-sm uppercase tracking-widest"
                style={{ color: "#8A8578" }}
              >
                Team Members
              </h3>
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search by name or roll number..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#FAF9F7] border border-[#EBE8E2] text-[#1C1B22]"
                />

                {memberSearch && (
                  <button
                    onClick={() => setMemberSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8578] hover:text-[#1C1B22]"
                  >
                    ✖
                  </button>
                )}
              </div>
              {selectedMember && showPermissionForm && (
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: "rgba(59,130,246,0.15)",
                    color: "#60a5fa",
                  }}
                >
                  Selected
                </span>
              )}
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {filteredMembers.map((member) => (
                <button
                  key={member._id}
                  onClick={() => {
                    if (selectedMember?._id === member._id) {
                      setSelectedMember(null);
                      setEditingAdminId(null);
                      return;
                    }

                    const existingAdmin = admins.find(
                      (admin) => admin.memberId?._id === member._id,
                    );
                    if (existingAdmin) {
                      setSelectedMember(existingAdmin.memberId);
                      setEditingAdminId(existingAdmin._id);
                      setShowPermissionForm(false);
                      setPermissions({
                        dashboardOverview:
                          existingAdmin.permissions.dashboardOverview,
                        events: existingAdmin.permissions.events,
                        team: existingAdmin.permissions.team,
                        arduinoRegistrations:
                          existingAdmin.permissions.arduinoRegistrations,

                        spaceDayRegistrations:
                          existingAdmin.permissions.spaceDayRegistrations,
                        spaceDayAttendance:
                          existingAdmin.permissions.spaceDayAttendance,
                        messages: existingAdmin.permissions.messages,
                        spsApplications:
                          existingAdmin.permissions.spsApplications,
                        membershipRegistrations:
                          existingAdmin.permissions.membershipRegistrations,
                        assessmentPlatform:
                          existingAdmin.permissions.assessmentPlatform,
                        certificates: existingAdmin.permissions.certificates,
                      });
                      return;
                    }

                    setEditingAdminId(null);
                    setSelectedMember(member);
                    setShowExternalAdmin(false);
                    setShowPermissionForm(false);
                    setUsername(member.rollNumber || "");
                    setPassword(member.rollNumber || "");
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg transition-all"
                  style={{
                    backgroundColor:
                      selectedMember?._id === member._id
                        ? "rgba(59,130,246,0.18)"
                        : "rgba(28,27,34,0.035)",
                    border:
                      selectedMember?._id === member._id
                        ? "1px solid rgba(59,130,246,0.35)"
                        : "1px solid transparent",
                  }}
                >
                  <div className="font-medium text-sm">{member.name}</div>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs" style={{ color: "#8A8578" }}>
                      {member.role}
                    </span>

                    {isMemberAdmin(member._id) && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: "rgba(34,197,94,0.12)",
                          border: "1px solid rgba(34,197,94,0.25)",
                          color: "#22c55e",
                        }}
                      >
                        🛡 Team Admin
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #EBE8E2" }} />

          {/* External Admin Toggle */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3
                className="font-semibold text-sm uppercase tracking-widest"
                style={{ color: "#8A8578" }}
              >
                External Admin
              </h3>
            </div>
            <button
              onClick={() => {
                setShowExternalAdmin(!showExternalAdmin);
                setSelectedMember(null);

                if (editingAdminId) {
                  setEditingAdminId(null);
                  setUsername("");
                  setPassword("");
                  setPermissions({
                    dashboardOverview: false,
                    events: false,
                    team: false,
                    arduinoRegistrations: false,
                    spaceDayRegistrations: false,
                    spaceDayAttendance: false,
                    messages: false,
                    spsApplications: false,
                    membershipRegistrations: false,
                    assessmentPlatform: false,
                    certificates: false,
                  });
                }
              }}
              className="w-full py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: showExternalAdmin
                  ? "rgba(34,197,94,0.15)"
                  : "rgba(34,197,94,0.08)",
                color: "#22c55e",
                border: "1px solid rgba(34,197,94,0.25)",
              }}
            >
              {showExternalAdmin
                ? "✕ Close External Admin"
                : "+ Create External Admin"}
            </button>

            {showExternalAdmin && (
              <div className="mt-3 space-y-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={externalName}
                  onChange={(e) => setExternalName(e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Role"
                  value={externalRole}
                  onChange={(e) => setExternalRole(e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Permissions & Credentials */}
        <div className="rounded-xl p-5" style={cardStyle}>
          {!hasSelection ? (
            <div
              className="h-full flex flex-col items-center justify-center text-center gap-2"
              style={{ color: "#8A8578" }}
            >
              <div className="text-3xl mb-1">👤</div>
              <p className="font-medium">No member selected</p>
              <p className="text-sm">
                Select a team member or create an external admin to configure
                access.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {editingAdminId && !showPermissionForm ? (
                <div
                  className="p-4 rounded-lg"
                  style={{
                    background: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    color: "#22c55e",
                  }}
                >
                  <p className="font-medium">
                    This member is already a Team Admin.
                  </p>
                  <p className="text-sm mt-2">
                    Click below to edit their permissions.
                  </p>
                  <button
                    onClick={() => setShowPermissionForm(true)}
                    className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-[#1C1B22]"
                  >
                    Edit Permissions
                  </button>
                </div>
              ) : (
                <>
                  {/* Selected member header */}
                  <div>
                    <h3 className="font-semibold text-base">
                      {selectedMember?.name || externalName || "External Admin"}
                    </h3>
                    <p className="text-sm mt-0.5" style={{ color: "#8A8578" }}>
                      {selectedMember?.role || externalRole || "No role set"}
                    </p>
                  </div>

                  <div style={{ borderTop: "1px solid #EBE8E2" }} />

                  {/* Credentials */}
                  <div className="space-y-3">
                    <p
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "#8A8578" }}
                    >
                      Credentials
                    </p>
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      readOnly={selectedMember !== null}
                      onChange={(e) => setUsername(e.target.value)}
                      style={{
                        ...inputStyle,
                        opacity: selectedMember !== null ? 0.6 : 1,
                        cursor:
                          selectedMember !== null ? "not-allowed" : "text",
                      }}
                    />
                    {!editingAdminId && (
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 rounded-lg"
                        style={inputStyle}
                      />
                    )}
                  </div>

                  <div style={{ borderTop: "1px solid #EBE8E2" }} />

                  {/* Permissions */}
                  <div className="space-y-3">
                    <p
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "#8A8578" }}
                    >
                      Permissions
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {permissionKeys.map(({ key, label }) => (
                        <label
                          key={key}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
                          style={{
                            backgroundColor: permissions[key]
                              ? "rgba(59,130,246,0.12)"
                              : "rgba(28,27,34,0.045)",
                            border: permissions[key]
                              ? "1px solid rgba(59,130,246,0.3)"
                              : "1px solid #EBE8E2",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={permissions[key]}
                            onChange={(e) =>
                              setPermissions({
                                ...permissions,
                                [key]: e.target.checked,
                              })
                            }
                            style={{ accentColor: "#3b82f6" }}
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {editingAdminId && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                      This member already has admin access. You are editing
                      existing permissions.
                    </div>
                  )}

                  {/* Save Button */}
                  <button
                    onClick={() => {
                      if (showExternalAdmin && editingAdminId) {
                        updateAccess();
                      } else if (showExternalAdmin) {
                        saveExternalAdmin();
                      } else {
                        saveAccess();
                      }
                    }}
                    className="w-full py-3 rounded-lg font-semibold text-sm transition-all"
                    style={{
                      backgroundColor: editingAdminId ? "#2563eb" : "#1d4ed8",
                      color: "#fff",
                    }}
                  >
                    {editingAdminId
                      ? isExternalMode
                        ? "Update External Admin"
                        : "Update Access"
                      : isExternalMode
                        ? "Create External Admin"
                        : "Save Access"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Section: Existing Admins (full width) ── */}
      <div className="rounded-xl p-5" style={cardStyle}>
        {/* Section Header + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h3
            className="font-semibold text-sm uppercase tracking-widest"
            style={{ color: "#8A8578" }}
          >
            Existing Admins
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded-full font-normal normal-case"
              style={{
                backgroundColor: "#EBE8E2",
                color: "#60a5fa",
              }}
            >
              {filteredAdmins.length}
            </span>
          </h3>
          <input
            type="text"
            placeholder="Search admins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, width: "220px" }}
          />
        </div>

        {/* Admin Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAdmins.map((admin: any) => {
            const name = admin.isExternal ? admin.name : admin.memberId?.name;
            const role = admin.isExternal ? admin.role : admin.memberId?.role;
            const activePerms = Object.entries(admin.permissions)
              .filter(([, v]) => v)
              .map(([k]) => k);

            return (
              <div
                key={admin._id}
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{
                  backgroundColor: "#FAF9F7",
                  border: "1px solid #EBE8E2",
                }}
              >
                {/* Admin Info */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">{name}</div>
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: "#8A8578" }}
                    >
                      {role}
                    </div>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: admin.isExternal
                        ? "rgba(168,85,247,0.15)"
                        : "rgba(59,130,246,0.15)",
                      color: admin.isExternal ? "#a855f7" : "#60a5fa",
                    }}
                  >
                    {admin.isExternal ? "External" : "Member"}
                  </span>
                </div>

                <div className="mt-2">
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: admin.isPaused
                        ? "rgba(239,68,68,0.15)"
                        : "rgba(34,197,94,0.15)",
                      color: admin.isPaused ? "#ef4444" : "#22c55e",
                    }}
                  >
                    {admin.isPaused ? "Paused" : "Active"}
                  </span>
                </div>

                {/* Username */}
                <div
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: "rgba(28,27,34,0.045)",
                    color: "#8A8578",
                  }}
                >
                  @{admin.username}
                </div>

                {/* Permission Badges */}
                {activePerms.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {activePerms.map((p) => (
                      <span
                        key={p}
                        className="text-xs px-2 py-0.5 rounded capitalize"
                        style={{
                          backgroundColor: "rgba(59,130,246,0.15)",
                          color: "#93c5fd",
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs" style={{ color: "#8A8578" }}>
                    No permissions set
                  </span>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-1">
                  <button
                    onClick={() => openViewModal(admin)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
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
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: "rgba(59,130,246,0.1)",
                      color: "#60a5fa",
                      border: "1px solid rgba(59,130,246,0.2)",
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => resetPassword(admin._id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: "rgba(245,158,11,0.1)",
                      color: "#f59e0b",
                      border: "1px solid rgba(245,158,11,0.2)",
                    }}
                  >
                    🔑 Reset
                  </button>
                  <button
                    onClick={() => toggleAdminStatus(admin._id, admin.isPaused)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: admin.isPaused
                        ? "rgba(34,197,94,0.1)"
                        : "rgba(245,158,11,0.1)",
                      color: admin.isPaused ? "#22c55e" : "#f59e0b",
                      border: admin.isPaused
                        ? "1px solid rgba(34,197,94,0.2)"
                        : "1px solid rgba(245,158,11,0.2)",
                    }}
                  >
                    {admin.isPaused ? "▶ Resume" : "⏸ Pause"}
                  </button>
                  <button
                    onClick={() => deleteAdmin(admin._id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: "rgba(239,68,68,0.1)",
                      color: "#f87171",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    🗑 Remove
                  </button>
                </div>
              </div>
            );
          })}

          {filteredAdmins.length === 0 && (
            <div
              className="col-span-full text-center py-12"
              style={{ color: "#8A8578" }}
            >
              {search
                ? `No admins found for "${search}"`
                : "No admins yet. Add one above."}
            </div>
          )}
        </div>
      </div>

      {/* ── View Modal ── */}
      {showViewModal && viewAdmin && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
          onClick={() => setShowViewModal(false)}
        >
          <div
            className="p-6 rounded-xl w-full max-w-md"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #EBE8E2",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Admin Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-lg leading-none"
                style={{ color: "#8A8578" }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {[
                [
                  "Name",
                  viewAdmin.isExternal
                    ? viewAdmin.name
                    : viewAdmin.memberId?.name,
                ],
                [
                  "Role",
                  viewAdmin.isExternal
                    ? viewAdmin.role
                    : viewAdmin.memberId?.role,
                ],
                ["Username", `@${viewAdmin.username}`],
                ["Status", viewAdmin.isPaused ? "Paused" : "Active"],
                [
                  "Reason",
                  viewAdmin.isPaused
                    ? viewAdmin.pauseReason || "Temporary Committee Restriction"
                    : "-",
                ],
                [
                  "Admin Type",
                  viewAdmin.isExternal ? "External Admin" : "Team Member Admin",
                ],
                ["Created On", new Date(viewAdmin.createdAt).toLocaleString()],
                [
                  "Password Status",
                  viewAdmin.mustChangePassword
                    ? "Using Default Password"
                    : "Changed",
                ],
                [
                  "Last Password Change",
                  viewAdmin.lastPasswordChange
                    ? new Date(viewAdmin.lastPasswordChange).toLocaleString()
                    : "Never",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-3 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "rgba(28,27,34,0.045)" }}
                >
                  <span style={{ color: "#8A8578" }}>{label}</span>
                  <span className="text-right font-medium">{value}</span>
                </div>
              ))}

              <div
                className="px-3 py-2 rounded-lg"
                style={{ backgroundColor: "rgba(28,27,34,0.045)" }}
              >
                <div className="mb-2" style={{ color: "#8A8578" }}>
                  Permissions
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(viewAdmin.permissions)
                    .filter(([, v]) => v)
                    .map(([k]) => (
                      <span
                        key={k}
                        className="px-2 py-0.5 rounded text-xs capitalize"
                        style={{
                          backgroundColor: "rgba(59,130,246,0.2)",
                          color: "#93c5fd",
                        }}
                      >
                        {k}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowViewModal(false)}
              className="mt-5 w-full py-2 rounded-lg font-medium text-sm"
              style={{ backgroundColor: "#1d4ed8", color: "#fff" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminsTab;
