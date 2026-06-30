import React, { useState } from "react";
import { Users, Trash2, ChevronDown, ChevronUp, Check } from "lucide-react";

import InputField from "../components/InputField";
import GradientButton from "../components/GradientButton";
import CropImageModal from "../components/CropImageModal";

const TeamTab = ({
  teamView,
  setTeamView,

  handleAddMember,

  name,
  setName,

  role,
  setRole,

  department,
  setDepartment,

  rollNumber,
  setRollNumber,

  registrationNumber,
  setRegistrationNumber,

  email,
  setEmail,

  priority,
  setPriority,

  linkedIn,
  setLinkedIn,

  photo,
  setPhoto,

  showCrop,
  setShowCrop,

  imageSrc,
  setImageSrc,

  members,

  editMember,
  setEditMember,

  handleUpdateMember,
  deleteMember,

  cardStyle,
}: any) => {
  const [search, setSearch] = useState("");
  const filteredMembers = members.filter(
    (member: any) =>
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.role.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div>
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Team Management
            </h2>

            <p className="text-sm text-slate-500">
              {members.length} team members
            </p>
          </div>

          {teamView === "manage" && (
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
        w-full md:w-72
        px-4 py-3
        rounded-xl
        bg-[#0F172A]
        border border-slate-700
        text-white
        placeholder:text-slate-500
        outline-none
        focus:border-[#00629B]
        transition
      "
            />
          )}
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
                  teamView === v ? "rgba(59,130,246,0.15)" : "transparent",
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
                onChange={(e: any) => setRegistrationNumber(e.target.value)}
                placeholder="Reg. no."
              />
              <InputField
                label="Email"
                type="email"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                placeholder="roll@adityauniversity.in"
              />
              <InputField
                label="LinkedIn Profile"
                type="url"
                value={linkedIn}
                onChange={(e: any) => setLinkedIn(e.target.value)}
                placeholder="https://linkedin.com/in/username"
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
                  accept="image/*"
                  onChange={(e: any) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setImageSrc(URL.createObjectURL(file));
                    setShowCrop(true);
                  }}
                />
                {photo && (
                  <img
                    src={URL.createObjectURL(photo)}
                    alt="preview"
                    className="mt-3 w-28 h-28 rounded-full object-cover border-2 border-blue-500"
                  />
                )}
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
                <tr style={{ borderBottom: "1px solid rgba(99,179,237,0.08)" }}>
                  {["Priority", "Name", "Role", "Actions"].map((h: any) => (
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
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-10 text-slate-500"
                    >
                      No members found.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m: any) => (
                    <React.Fragment key={m._id}>
                      <tr
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
                              {editMember?._id === m._id ? "Collapse" : "Edit"}
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
                        <tr style={{ backgroundColor: "rgba(15,22,36,0.8)" }}>
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
                                label="LinkedIn Profile"
                                value={editMember.linkedIn || ""}
                                onChange={(e: any) =>
                                  setEditMember({
                                    ...editMember,
                                    linkedIn: e.target.value,
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
                                  onChange={(e: any) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setImageSrc(URL.createObjectURL(file));
                                    setShowCrop(true);
                                  }}
                                  className="text-sm"
                                  style={{ color: "#94a3b8" }}
                                />
                                {editMember?.newPhoto && (
                                  <img
                                    src={URL.createObjectURL(
                                      editMember.newPhoto,
                                    )}
                                    alt="preview"
                                    className="mt-3 w-28 h-28 rounded-full object-cover border-2 border-blue-500"
                                  />
                                )}
                              </div>
                              <div className="col-span-2 flex gap-3 pt-2">
                                <GradientButton
                                  color="green"
                                  small
                                  onClick={() => handleUpdateMember(editMember)}
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
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Crop Modal */}
        {showCrop && (
          <CropImageModal
            image={imageSrc}
            onClose={() => setShowCrop(false)}
            onSave={(croppedFile) => {
              if (editMember) {
                setEditMember({ ...editMember, newPhoto: croppedFile });
              } else {
                setPhoto(croppedFile);
              }
              setShowCrop(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TeamTab;
