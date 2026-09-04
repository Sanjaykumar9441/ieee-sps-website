import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";
import type { Assessment } from "../AssessmentCard";
import {
  createAssessmentTeam,
  deleteAssessmentTeam,
  getAssessmentTeams,
} from "../assessmentApi";
import ImportStudentsModal from "./ImportStudentsModal";

type Mode = "STUDENT_TEAMS" | "TEAM";
type Member = {
  id?: string;
  name: string;
  rollNo: string;
  email: string;
  branch: string;
  status?: string;
  attempt_started?: boolean;
  submitted?: boolean;
};
type Team = {
  id: string;
  team_name: string;
  contact_email: string;
  branch: string | null;
  mode: Mode;
  member_count?: number;
  members: Member[];
};

const emptyMember = (): Member => ({
  name: "",
  rollNo: "",
  email: "",
  branch: "",
});

export default function TeamManager({
  assessment,
}: {
  assessment: Assessment;
}) {
  const mode = (assessment.participation_mode || "STUDENT_TEAMS") as Mode;
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [busy, setBusy] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [branch, setBranch] = useState("");
  const [members, setMembers] = useState<Member[]>([
    emptyMember(),
    emptyMember(),
  ]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await getAssessmentTeams(assessment.id);
      setTeams(
        (rows || []).map((team: any) => ({
          ...team,
          member_count: Number(team.member_count ?? team.members?.length ?? 0),
          members: (team.members || []).map((member: any) => ({
            ...member,
            rollNo: member.rollNo ?? member.roll_no ?? "",
            email: member.email ?? "",
            branch: member.branch ?? "",
          })),
        })),
      );
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Unable to load teams.");
    } finally {
      setLoading(false);
    }
  }, [assessment.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setTeamName("");
    setContactEmail("");
    setBranch("");
    setMembers([emptyMember(), emptyMember()]);
  };

  const add = async () => {
    if (!teamName.trim()) return toast.error("Team name is required.");

    if (mode === "STUDENT_TEAMS") {
      const validMembers = members.filter(
        (member) =>
          member.name.trim() ||
          member.rollNo.trim() ||
          member.email.trim() ||
          member.branch.trim(),
      );
      if (validMembers.length < 2)
        return toast.error("Student Teams require at least two members.");
      if (
        validMembers.some(
          (member) =>
            !member.name.trim() ||
            !member.rollNo.trim() ||
            !member.email.trim() ||
            !member.branch.trim(),
        )
      ) {
        return toast.error(
          "Complete every team member: name, roll number, email and branch.",
        );
      }
      const payload = {
        mode: "STUDENT_TEAMS",
        teamName: teamName.trim(),
        // Compatibility field: the first member is the team contact.
        contactEmail: validMembers[0].email.trim(),
        branch: validMembers[0].branch.trim(),
        members: validMembers.map((member) => ({
          name: member.name.trim(),
          rollNo: member.rollNo.trim(),
          email: member.email.trim(),
          branch: member.branch.trim(),
        })),
      };
      try {
        setBusy(true);
        await createAssessmentTeam(assessment.id, payload);
        toast.success("Student Team added successfully.");
        resetForm();
        setShowAdd(false);
        await load();
      } catch (error: any) {
        console.error(error);
        toast.error(
          error?.response?.data?.message || "Unable to add Student Team.",
        );
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!contactEmail.trim())
      return toast.error("Email of one team member is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim()))
      return toast.error("Enter a valid team member email.");
    if (!branch.trim()) return toast.error("Branch is required.");

    try {
      setBusy(true);
      await createAssessmentTeam(assessment.id, {
        mode: "TEAM",
        teamName: teamName.trim(),
        contactEmail: contactEmail.trim(),
        // Also send the common alias so older backend deployments remain compatible.
        email: contactEmail.trim(),
        branch: branch.trim(),
        members: [],
      });
      toast.success("Team added successfully.");
      resetForm();
      setShowAdd(false);
      await load();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Unable to add Team.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (team: Team) => {
    if (!window.confirm(`Delete ${team.team_name}?`)) return;
    try {
      setBusy(true);
      await deleteAssessmentTeam(assessment.id, team.id);
      toast.success("Team deleted.");
      await load();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Unable to delete team.");
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
              ? "One test for each team. Only team name, one member email and branch are required."
              : "One test for each Student Team. Every member keeps their own name, roll number, email and branch."}
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
            {mode === "TEAM" ? "Import Teams" : "Import Student Teams"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <p className="text-sm text-slate-500">
          {mode === "TEAM" ? "Teams" : "Student Teams"}
        </p>
        <p className="mt-2 text-3xl font-bold">{teams.length}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          {mode === "STUDENT_TEAMS" ? (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-left">Team</th>
                  <th className="p-4 text-left">Members</th>
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
                {teams.flatMap((team) =>
                  team.members.map((member, index) => (
                    <tr
                      key={`${team.id}-${member.id || index}`}
                      className="border-t"
                    >
                      <td className="p-4 font-semibold">{team.team_name}</td>
                      <td className="p-4 font-semibold">
                        {team.member_count ?? team.members.length}
                      </td>
                      <td className="p-4">{member.rollNo}</td>
                      <td className="p-4">{member.name}</td>
                      <td className="p-4">{member.email}</td>
                      <td className="p-4">
                        {member.branch || team.branch || "-"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${member.status === "blocked" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                        >
                          {member.status || "allowed"}
                        </span>
                      </td>
                      <td className="p-4">
                        {member.submitted
                          ? "Submitted"
                          : member.attempt_started
                            ? "In Progress"
                            : "Not Started"}
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void remove(team)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                          Delete Team
                        </button>
                      </td>
                    </tr>
                  )),
                )}
                {!teams.some((team) => team.members.length) && (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-500">
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
                  teams.map((team) => (
                    <tr key={team.id} className="border-t">
                      <td className="p-4 font-semibold">{team.team_name}</td>
                      <td className="p-4">{team.contact_email}</td>
                      <td className="p-4">{team.branch || "-"}</td>
                      <td className="p-4">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void remove(team)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-red-600 disabled:opacity-50"
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

            {mode === "STUDENT_TEAMS" ? (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-bold">Members</h4>
                  <button
                    type="button"
                    onClick={() =>
                      setMembers((current) => [...current, emptyMember()])
                    }
                    disabled={members.length >= 10}
                    className="rounded-lg border px-3 py-2 disabled:opacity-50"
                  >
                    + Member
                  </button>
                </div>
                <div className="space-y-3">
                  {members.map((member, index) => (
                    <div
                      key={index}
                      className="grid gap-3 rounded-xl border p-4 md:grid-cols-4"
                    >
                      <input
                        placeholder="Name"
                        value={member.name}
                        onChange={(e) =>
                          setMembers((current) =>
                            current.map((item, i) =>
                              i === index
                                ? { ...item, name: e.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                      <input
                        placeholder="Roll No"
                        value={member.rollNo}
                        onChange={(e) =>
                          setMembers((current) =>
                            current.map((item, i) =>
                              i === index
                                ? { ...item, rollNo: e.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                      <input
                        placeholder="Email"
                        type="email"
                        value={member.email}
                        onChange={(e) =>
                          setMembers((current) =>
                            current.map((item, i) =>
                              i === index
                                ? { ...item, email: e.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                      <input
                        placeholder="Branch"
                        value={member.branch}
                        onChange={(e) =>
                          setMembers((current) =>
                            current.map((item, i) =>
                              i === index
                                ? { ...item, branch: e.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
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
                className="rounded-xl bg-[#00629B] px-5 py-3 font-semibold text-white disabled:opacity-50"
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <span className="mt-1 block">{children}</span>
    </label>
  );
}
