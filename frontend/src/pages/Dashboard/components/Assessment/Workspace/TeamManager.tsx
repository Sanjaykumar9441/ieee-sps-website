import { useCallback, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { Download, FileUp, Plus, Trash2, Users } from "lucide-react";
import type { Assessment } from "../AssessmentCard";
import {
  createAssessmentTeam,
  deleteAssessmentTeam,
  getAssessmentTeams,
  importAssessmentTeams,
} from "../assessmentApi";

type Member = {
  id?: string;
  name: string;
  rollNo: string;
  email: string;
  branch: string;
};
type Team = {
  id: string;
  team_name: string;
  contact_email: string;
  branch: string | null;
  member_count: number;
  mode: string;
  members: Member[];
};

const clean = (v: any) => String(v ?? "").trim();
const header = (v: any) =>
  clean(v)
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
const get = (r: any, keys: string[]) => {
  for (const k of keys) {
    const v = r[header(k)];
    if (v !== undefined) return clean(v);
  }
  return "";
};
const csv = (rows: any[]) =>
  rows
    .map((r) =>
      r.map((v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

export default function TeamManager({
  assessment,
}: {
  assessment: Assessment;
}) {
  const mode = assessment.participation_mode as "STUDENT_TEAMS" | "TEAM";
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
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
      setTeams(await getAssessmentTeams(assessment.id));
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
    if (!teamName.trim() || !contactEmail.trim())
      return toast.error("Team name and member email are required.");
    if (
      mode === "STUDENT_TEAMS" &&
      members.some((m) => !m.name.trim() || !m.rollNo.trim() || !m.email.trim())
    )
      return toast.error("Complete every team member.");
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
  const importFile = async (file: File) => {
    try {
      setBusy(true);
      const wb = XLSX.read(await file.arrayBuffer(), {
        type: "array",
        raw: false,
      });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) throw new Error("No worksheet found.");
      const rows = XLSX.utils.sheet_to_json<any>(ws, {
        defval: "",
        raw: false,
      });
      if (!rows.length) throw new Error("The file is empty.");
      let payload: any[] = [];
      if (mode === "TEAM") {
        payload = rows.map((r) => ({
          teamName: get(r, ["team_name", "team name"]),
          contactEmail: get(r, ["contact_email", "email", "member_email"]),
          branch: get(r, ["branch", "department"]),
        }));
      } else {
        const grouped = new Map<string, any>();
        for (const r of rows) {
          const name = get(r, ["team_name", "team name"]);
          if (!name) continue;
          const item = grouped.get(name) || {
            teamName: name,
            contactEmail: "",
            branch: get(r, ["branch", "department"]),
            members: [],
          };
          const m = {
            name: get(r, ["member_name", "name"]),
            rollNo: get(r, ["roll_number", "roll_no", "roll no"]),
            email: get(r, ["member_email", "email"]),
            branch: get(r, ["member_branch", "branch", "department"]),
          };
          if (!item.contactEmail && m.email) item.contactEmail = m.email;
          if (m.name || m.rollNo || m.email) item.members.push(m);
          grouped.set(name, item);
        }
        payload = [...grouped.values()];
      }
      if (!payload.length) throw new Error("No valid team rows found.");
      const result = await importAssessmentTeams(assessment.id, {
        mode,
        teams: payload,
      });
      toast.success(`${result.imported || 0} team(s) imported.`);
      if (result.errorRows?.length)
        toast.error(`${result.errorRows.length} team row(s) failed.`);
      await load();
    } catch (e: any) {
      toast.error(
        e?.message || e?.response?.data?.message || "Unable to import teams.",
      );
    } finally {
      setBusy(false);
    }
  };
  const downloadTemplate = () => {
    const rows =
      mode === "TEAM"
        ? [
            ["team_name", "email", "branch"],
            ["Team Alpha", "member@example.com", "ECE"],
          ]
        : [
            ["team_name", "member_name", "roll_number", "email", "branch"],
            ["Team Alpha", "Student One", "23ECE001", "one@example.com", "ECE"],
            ["Team Alpha", "Student Two", "23ECE002", "two@example.com", "ECE"],
          ];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([csv(rows)], { type: "text/csv;charset=utf-8" }),
    );
    a.download =
      mode === "TEAM"
        ? "team-assessment-template.csv"
        : "student-team-template.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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
              : "One test attempt per team with all member details."}
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
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-4 py-3 font-semibold">
            <FileUp size={17} />
            Import CSV
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importFile(f);
              }}
            />
          </label>
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-3 font-semibold"
          >
            <Download size={17} />
            Template
          </button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Teams" value={teams.length} />
        <Stat
          label="Members"
          value={teams.reduce((n, t) => n + (t.members?.length || 0), 0)}
        />
      </div>
      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left">Team</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Branch</th>
                <th className="p-4 text-left">Members</th>
                <th className="p-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {teams.length ? (
                teams.map((t) => (
                  <tr key={t.id} className="border-t align-top">
                    <td className="p-4 font-semibold">{t.team_name}</td>
                    <td className="p-4">{t.contact_email}</td>
                    <td className="p-4">{t.branch || "-"}</td>
                    <td className="p-4">
                      {mode === "TEAM" ? (
                        "Team participant"
                      ) : (
                        <div className="space-y-1">
                          {t.members.map((m, i) => (
                            <div key={m.id || i}>
                              {m.name} · {m.rollNo} · {m.email}
                            </div>
                          ))}
                        </div>
                      )}
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
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    No teams added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Team Name">
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </Field>
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
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
