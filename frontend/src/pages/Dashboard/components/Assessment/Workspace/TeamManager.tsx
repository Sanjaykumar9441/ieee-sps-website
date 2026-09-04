import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";
import type { Assessment } from "../AssessmentCard";
import {
  createAssessmentTeam,
  deleteAssessmentTeam,
  getAssessmentTeams,
} from "../assessmentApi";
import ImportStudentsModal from "./ImportStudentsModal";

type Member = {
  id?: string;
  name: string;
  rollNo: string;
  email: string;
  branch: string;
  status?: string;
  attempt_started?: boolean;
  submitted?: boolean;
  first_login_at?: string | null;
};
type Team = {
  id: string;
  team_name: string;
  contact_email: string;
  branch: string | null;
  mode: string;
  members: Member[];
};

export default function TeamManager({
  assessment,
}: {
  assessment: Assessment;
}) {
  const mode = assessment.participation_mode as "STUDENT_TEAMS" | "TEAM";
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [busy, setBusy] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [branch, setBranch] = useState("");
  const [members, setMembers] = useState<Member[]>([
    { name: "", rollNo: "", email: "", branch: "" },
    { name: "", rollNo: "", email: "", branch: "" },
  ]);
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await getAssessmentTeams(assessment.id);
      setTeams(
        (rows || []).map((t: any) => ({
          ...t,
          members: (t.members || []).map((m: any) => ({
            ...m,
            rollNo: m.rollNo ?? m.roll_no ?? "",
            email: m.email ?? "",
            branch: m.branch ?? "",
          })),
        })),
      );
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Unable to load teams.");
    } finally {
      setLoading(false);
    }
  }, [assessment.id]);
  useEffect(() => {
    void load();
  }, [load]);
  const add = async () => {
    if (!teamName.trim()) return toast.error("Team name is required.");
    if (mode === "TEAM" && !contactEmail.trim())
      return toast.error("Member email is required.");
    if (mode === "TEAM" && !branch.trim())
      return toast.error("Branch is required.");
    if (
      mode === "STUDENT_TEAMS" &&
      members.some(
        (m) =>
          !m.name.trim() ||
          !m.rollNo.trim() ||
          !m.email.trim() ||
          !m.branch.trim(),
      )
    )
      return toast.error("Complete every team member, including branch.");
    try {
      setBusy(true);
      await createAssessmentTeam(assessment.id, {
        mode,
        teamName,
        contactEmail,
        branch,
        members,
      });
      toast.success("Team added.");
      setTeamName("");
      setContactEmail("");
      setBranch("");
      setMembers([
        { name: "", rollNo: "", email: "", branch: "" },
        { name: "", rollNo: "", email: "", branch: "" },
      ]);
      setShowAdd(false);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Unable to add team.");
    } finally {
      setBusy(false);
    }
  };
  if (loading) return <div className="py-16 text-center">Loading teams...</div>;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {mode === "TEAM" ? "Teams" : "Student Teams"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "TEAM"
              ? "One test attempt per team. Register team name, one member email and branch."
              : "One test attempt per team. Add all member details below."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00629B] px-4 py-3 font-semibold text-white"
          >
            <Plus size={17} />
            Add Team
          </button>
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-3 font-semibold"
          >
            Import Students
          </button>
        </div>
      </div>
      <div className="rounded-2xl border bg-white p-5">
        <p className="text-sm text-slate-500">Teams</p>
        <p className="mt-2 text-3xl font-bold">{teams.length}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          {mode === "STUDENT_TEAMS" ? (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-left">Team</th>
                  <th className="p-4 text-left">Roll No</th>
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">Branch</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Attempt</th>
                  <th className="p-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {teams.flatMap((t) =>
                  t.members.map((m, i) => (
                    <tr key={`${t.id}-${m.id || i}`} className="border-t">
                      <td className="p-4 font-semibold">{t.team_name}</td>
                      <td className="p-4">{m.rollNo}</td>
                      <td className="p-4">{m.name}</td>
                      <td className="p-4">{m.email}</td>
                      <td className="p-4">{m.branch || t.branch || "-"}</td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${m.status === "blocked" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                        >
                          {m.status || "allowed"}
                        </span>
                      </td>
                      <td className="p-4">
                        {m.submitted
                          ? "Submitted"
                          : m.attempt_started
                            ? "In Progress"
                            : "Not Started"}
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            if (!confirm(`Delete ${t.team_name}?`)) return;
                            try {
                              setBusy(true);
                              await deleteAssessmentTeam(assessment.id, t.id);
                              await load();
                              toast.success("Team deleted.");
                            } catch (e: any) {
                              toast.error(
                                e?.response?.data?.message ||
                                  "Unable to delete team.",
                              );
                            } finally {
                              setBusy(false);
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-red-600"
                        >
                          <Trash2 size={15} />
                          Delete Team
                        </button>
                      </td>
                    </tr>
                  )),
                )}
                {!teams.some((t) => t.members.length > 0) && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500">
                      No team members added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-left">Team</th>
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">Branch</th>
                  <th className="p-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {teams.length ? (
                  teams.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="p-4 font-semibold">{t.team_name}</td>
                      <td className="p-4">{t.contact_email}</td>
                      <td className="p-4">{t.branch || "-"}</td>
                      <td className="p-4">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            if (!confirm(`Delete ${t.team_name}?`)) return;
                            try {
                              setBusy(true);
                              await deleteAssessmentTeam(assessment.id, t.id);
                              await load();
                              toast.success("Team deleted.");
                            } catch (e: any) {
                              toast.error(
                                e?.response?.data?.message ||
                                  "Unable to delete team.",
                              );
                            } finally {
                              setBusy(false);
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-red-600"
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-500">
                      No teams added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6">
            <div className="flex justify-between">
              <h3 className="text-xl font-bold">
                Add {mode === "TEAM" ? "Team" : "Student Team"}
              </h3>
              <button type="button" onClick={() => setShowAdd(false)}>
                ✕
              </button>
            </div>
            <div className="mt-5">
              <Field label="Team Name">
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </Field>
            </div>
            {mode === "STUDENT_TEAMS" && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-bold">Members</h4>
                  <button
                    type="button"
                    onClick={() =>
                      setMembers((m) => [
                        ...m,
                        { name: "", rollNo: "", email: "", branch: branch },
                      ])
                    }
                    className="rounded-lg border px-3 py-2"
                  >
                    + Member
                  </button>
                </div>
                <div className="space-y-3">
                  {members.map((m, i) => (
                    <div
                      key={i}
                      className="grid gap-3 rounded-xl border p-4 md:grid-cols-4"
                    >
                      <input
                        placeholder="Name"
                        value={m.name}
                        onChange={(e) =>
                          setMembers((ms) =>
                            ms.map((x, j) =>
                              j === i ? { ...x, name: e.target.value } : x,
                            ),
                          )
                        }
                      />
                      <input
                        placeholder="Roll No"
                        value={m.rollNo}
                        onChange={(e) =>
                          setMembers((ms) =>
                            ms.map((x, j) =>
                              j === i ? { ...x, rollNo: e.target.value } : x,
                            ),
                          )
                        }
                      />
                      <input
                        placeholder="Email"
                        value={m.email}
                        onChange={(e) =>
                          setMembers((ms) =>
                            ms.map((x, j) =>
                              j === i ? { ...x, email: e.target.value } : x,
                            ),
                          )
                        }
                      />
                      <input
                        placeholder="Branch"
                        value={m.branch}
                        onChange={(e) =>
                          setMembers((ms) =>
                            ms.map((x, j) =>
                              j === i ? { ...x, branch: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {mode === "TEAM" && (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Email of one team member">
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </Field>
                <Field label="Branch">
                  <input
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  />
                </Field>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-xl border px-5 py-3"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void add()}
                className="rounded-xl bg-[#00629B] px-5 py-3 font-semibold text-white"
              >
                {busy ? "Saving..." : "Add Team"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showImport && (
        <ImportStudentsModal
          open={showImport}
          assessmentId={assessment.id}
          participationMode={mode}
          onClose={() => setShowImport(false)}
          onSuccess={async () => {
            await load();
          }}
        />
      )}
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <span className="mt-1 block">{children}</span>
    </label>
  );
}
