import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  Send,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import { socket } from "../../../../../lib/socket";
import { forceSubmitAttempt, getLiveStudents } from "../assessmentApi";
import LiveStudentDetailsDrawer from "./LiveStudentDetailsDrawer";
import type { Assessment } from "../AssessmentCard";

export interface LiveStudent {
  studentId: string;
  attemptId: string;
  studentName: string;
  teamId?: string | null;
  teamName?: string | null;
  teamMemberCount?: number;
  members?: Array<{
    id?: string;
    name: string;
    roll_no: string;
    email: string;
    branch?: string | null;
  }>;
  email: string;
  rollNo: string;
  department?: string;
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: number;
  remainingSeconds: number;
  violations: number;
  status: string;
  isExpired?: boolean;
}
const submitted = (s: LiveStudent) =>
  String(s.status).toUpperCase() === "SUBMITTED" || Boolean(s.isExpired);
const live = (s: LiveStudent) =>
  !submitted(s) &&
  ["IN_PROGRESS", "LIVE", "STARTED"].includes(String(s.status).toUpperCase());
const timer = (n: number) => {
  const x = Math.max(0, Math.floor(Number(n) || 0));
  return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
};

export default function LiveMonitor({
  assessment,
}: {
  assessment: Assessment;
}) {
  const mode = assessment.participation_mode || "INDIVIDUAL_STUDENTS",
    teams = mode === "TEAM",
    studentTeams = mode === "STUDENT_TEAMS";
  const [rows, setRows] = useState<LiveStudent[]>([]),
    [loading, setLoading] = useState(false),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("ALL"),
    [selected, setSelected] = useState<LiveStudent | null>(null),
    [open, setOpen] = useState(false),
    [processing, setProcessing] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data: any[] = await getLiveStudents(String(assessment.id));
      setRows(
        (data || []).map((x) => ({
          ...x,
          currentQuestion: Number(x.currentQuestion || 0),
          totalQuestions: Number(x.totalQuestions || 0),
          answeredQuestions: Number(x.answeredQuestions || 0),
          remainingSeconds: Number(x.remainingSeconds || 0),
          violations: Number(x.violations || 0),
        })),
      );
    } catch (e: any) {
      console.error("[LIVE MONITOR]", e);
      toast.error(e?.response?.data?.message || "Unable to load live monitor.");
    } finally {
      setLoading(false);
    }
  }, [assessment.id]);
  useEffect(() => {
    void refresh();
    const i = setInterval(() => void refresh(), 5000);
    return () => clearInterval(i);
  }, [refresh]);
  useEffect(() => {
    const r = () => void refresh();
    socket.on("dashboardRefresh", r);
    socket.on("studentSubmitted", r);
    socket.on("forceSubmitted", r);
    return () => {
      socket.off("dashboardRefresh", r);
      socket.off("studentSubmitted", r);
      socket.off("forceSubmitted", r);
    };
  }, [refresh]);
  useEffect(() => {
    const i = setInterval(
      () =>
        setRows((x) =>
          x.map((s) =>
            live(s)
              ? { ...s, remainingSeconds: Math.max(0, s.remainingSeconds - 1) }
              : s,
          ),
        ),
      1000,
    );
    return () => clearInterval(i);
  }, []);
  const filtered = useMemo(
    () =>
      rows.filter((s) => {
        const q = search.trim().toLowerCase();
        const text =
          `${s.studentName} ${s.teamName || ""} ${s.email} ${s.rollNo} ${(s.members || []).map((m) => `${m.name} ${m.roll_no} ${m.email}`).join(" ")}`.toLowerCase();
        return (
          (!q || text.includes(q)) &&
          (filter === "ALL" ||
            (filter === "LIVE" && live(s)) ||
            (filter === "SUBMITTED" && submitted(s)))
        );
      }),
    [rows, search, filter],
  );
  const doForce = async (s: LiveStudent) => {
    if (submitted(s) || !s.attemptId) return;
    if (
      !confirm(
        `Force submit ${teams ? s.teamName || "this team" : s.studentName}'s assessment?`,
      )
    )
      return;
    try {
      setProcessing(s.attemptId);
      const r = await forceSubmitAttempt(s.attemptId);
      toast.success(r?.message || "Assessment force submitted.");
      await refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Unable to force submit.");
    } finally {
      setProcessing(null);
    }
  };
  const uniqueAttempts = useMemo(
    () =>
      Array.from(
        new Map(
          rows.filter((s) => s.attemptId).map((s) => [s.attemptId, s]),
        ).values(),
      ),
    [rows],
  );
  const answered = uniqueAttempts.reduce((a, s) => a + s.answeredQuestions, 0),
    violations = uniqueAttempts.reduce((a, s) => a + s.violations, 0);
  const liveCount = uniqueAttempts.filter(live).length,
    submittedCount = uniqueAttempts.filter(submitted).length;
  const cols = teams ? 10 : studentTeams ? 13 : 9;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Live Monitor</h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitor{" "}
            {teams
              ? "teams"
              : studentTeams
                ? "Student Teams and their members"
                : "students"}{" "}
            in real time.
          </p>
        </div>
        <button
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-semibold"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Summary l={`Live ${teams ? "Teams" : "Students"}`} v={liveCount} />
        <Summary l="Submitted" v={submittedCount} />
        <Summary l="Answered" v={answered} />
        <Summary l="Violations" v={violations} />
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={teams ? "Search Team..." : "Search Student..."}
            className="w-full rounded-xl border bg-white py-3 pl-10 pr-4 outline-none focus:border-slate-900"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border bg-white px-4 py-3 outline-none"
        >
          <option value="ALL">All Status</option>
          <option value="LIVE">Live</option>
          <option value="SUBMITTED">Submitted</option>
        </select>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm text-slate-600">
                {teams ? (
                  <>
                    <th className="px-4 py-4">Team</th>
                    <th className="px-4 py-4">Email</th>
                    <th className="px-4 py-4">Branch</th>
                  </>
                ) : studentTeams ? (
                  <>
                    <th className="px-4 py-4">Team</th>
                    <th className="px-4 py-4">Members</th>
                    <th className="px-4 py-4">Roll No</th>
                    <th className="px-4 py-4">Name</th>
                    <th className="px-4 py-4">Email</th>
                    <th className="px-4 py-4">Branch</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-4">Student</th>
                    <th className="px-4 py-4">Roll No</th>
                  </>
                )}
                <th className="px-4 py-4">Current</th>
                <th className="px-4 py-4">Answered</th>
                <th className="px-4 py-4">Timer</th>
                <th className="px-4 py-4">Violations</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={cols}
                    className="px-6 py-16 text-center text-slate-500"
                  >
                    {loading
                      ? "Loading..."
                      : `No ${teams ? "teams" : "students"} found.`}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const done = submitted(s);
                  return (
                    <tr
                      key={`${s.attemptId || "none"}-${s.studentId || s.teamId}`}
                      className="text-sm"
                    >
                      {teams ? (
                        <>
                          <td className="px-4 py-4 font-semibold">
                            {s.teamName || s.studentName || "—"}
                          </td>
                          <td className="px-4 py-4">{s.email || "—"}</td>
                          <td className="px-4 py-4">{s.department || "—"}</td>
                        </>
                      ) : studentTeams ? (
                        <>
                          <td className="px-4 py-4 font-semibold">
                            {s.teamName || "—"}
                          </td>
                          <td className="px-4 py-4">
                            {s.teamMemberCount || s.members?.length || 0}
                          </td>
                          <td className="px-4 py-4">{s.rollNo || "—"}</td>
                          <td className="px-4 py-4 font-semibold">
                            {s.studentName || "—"}
                          </td>
                          <td className="px-4 py-4">{s.email || "—"}</td>
                          <td className="px-4 py-4">{s.department || "—"}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                                <UserRound size={18} />
                              </div>
                              <div>
                                <p className="font-semibold">{s.studentName}</p>
                                <p className="text-xs text-slate-500">
                                  {s.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">{s.rollNo || "—"}</td>
                        </>
                      )}
                      <td className="px-4 py-4">
                        {done
                          ? "—"
                          : `${s.currentQuestion} / ${s.totalQuestions}`}
                      </td>
                      <td className="px-4 py-4 font-semibold">
                        {s.answeredQuestions} / {s.totalQuestions}
                      </td>
                      <td className="px-4 py-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock3 size={15} />
                          {done ? "00:00" : timer(s.remainingSeconds)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5">
                          <Activity size={15} />
                          {s.violations}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${done ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}
                        >
                          {done ? "Submitted" : "Live"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelected(s);
                              setOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2"
                          >
                            <CheckCircle2 size={15} />
                            View
                          </button>
                          {!done && (
                            <button
                              disabled={processing === s.attemptId}
                              onClick={() => void doForce(s)}
                              className="inline-flex items-center gap-1 rounded-lg border px-3 py-2"
                            >
                              <Send size={15} />
                              {processing === s.attemptId
                                ? "Submitting"
                                : "Force Submit"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Answered reflects durable server answers. The student exam still uses
        one final submission snapshot; no per-answer API calls were added.
      </p>
      <LiveStudentDetailsDrawer
        open={open}
        student={selected}
        assessmentId={String(assessment.id)}
        onRefresh={refresh}
        onClose={() => {
          setOpen(false);
          setSelected(null);
        }}
      />
    </div>
  );
}
function Summary({ l, v }: { l: string; v: number }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-sm text-slate-500">{l}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{v}</p>
    </div>
  );
}
