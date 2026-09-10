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
  lastActivity?: string;
}

const normalizeStatus = (value: string) =>
  String(value || "NOT_STARTED").toUpperCase();
const isSubmitted = (student: LiveStudent) =>
  normalizeStatus(student.status) === "SUBMITTED";
const isLive = (student: LiveStudent) =>
  !isSubmitted(student) &&
  ["IN_PROGRESS", "LIVE", "STARTED"].includes(normalizeStatus(student.status));
const formatTimer = (seconds: number) => {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
};

export default function LiveMonitor({
  assessment,
}: {
  assessment: Assessment;
}) {
  const mode = assessment.participation_mode || "INDIVIDUAL_STUDENTS";
  const isStudentTeams = mode === "STUDENT_TEAMS";
  const isTeam = mode === "TEAM";
  const participantLabel = isTeam ? "Teams" : "Students";
  const [students, setStudents] = useState<LiveStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<LiveStudent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const rows: any[] = await getLiveStudents(String(assessment.id));
      setStudents(
        (rows || []).map((row: any) => ({
          ...row,
          status: normalizeStatus(row.status),
          remainingSeconds: Math.max(0, Number(row.remainingSeconds || 0)),
          answeredQuestions: Number(row.answeredQuestions || 0),
          totalQuestions: Number(row.totalQuestions || 0),
          currentQuestion: Number(row.currentQuestion || 0),
          violations: Number(row.violations || 0),
          teamMemberCount: Number(
            row.teamMemberCount || row.members?.length || 0,
          ),
        })),
      );
    } catch (error: any) {
      console.error("[LIVE MONITOR]", error);
      toast.error(
        error?.response?.data?.message || "Unable to load live monitor.",
      );
    } finally {
      setLoading(false);
    }
  }, [assessment.id]);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const onRefresh = () => void refresh();
    socket.on("dashboardRefresh", onRefresh);
    socket.on("studentSubmitted", onRefresh);
    socket.on("forceSubmitted", onRefresh);
    return () => {
      socket.off("dashboardRefresh", onRefresh);
      socket.off("studentSubmitted", onRefresh);
      socket.off("forceSubmitted", onRefresh);
    };
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStudents((rows) =>
        rows.map((student) =>
          isLive(student)
            ? {
                ...student,
                remainingSeconds: Math.max(0, student.remainingSeconds - 1),
              }
            : student,
        ),
      );
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const filtered = useMemo(
    () =>
      students.filter((student) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          String(student.studentName || "")
            .toLowerCase()
            .includes(q) ||
          String(student.teamName || "")
            .toLowerCase()
            .includes(q) ||
          String(student.email || "")
            .toLowerCase()
            .includes(q) ||
          String(student.rollNo || "")
            .toLowerCase()
            .includes(q) ||
          (student.members || []).some((member) =>
            `${member.name} ${member.roll_no} ${member.email}`
              .toLowerCase()
              .includes(q),
          );
        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "LIVE" && isLive(student)) ||
          (statusFilter === "SUBMITTED" && isSubmitted(student));
        return matchesSearch && matchesStatus;
      }),
    [students, search, statusFilter],
  );

  const liveCount = students.filter(isLive).length;
  const submittedCount = students.filter(isSubmitted).length;
  const averageProgress = students.length
    ? Math.round(
        students.reduce(
          (sum, student) =>
            sum +
            (student.totalQuestions
              ? Math.min(
                  100,
                  (student.answeredQuestions / student.totalQuestions) * 100,
                )
              : 0),
          0,
        ) / students.length,
      )
    : 0;

  const forceSubmit = async (student: LiveStudent) => {
    if (isSubmitted(student) || !student.attemptId) return;
    const target = isTeam
      ? student.teamName || "this team"
      : student.studentName || "this student";
    if (!window.confirm(`Force submit ${target}'s assessment?`)) return;
    try {
      setProcessing(student.attemptId);
      const result = await forceSubmitAttempt(student.attemptId);
      toast.success(result?.message || "Assessment force submitted.");
      await refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Unable to force submit.");
    } finally {
      setProcessing(null);
    }
  };

  const openDetails = (student: LiveStudent) => {
    setSelected(student);
    setDrawerOpen(true);
  };

  const noDataColSpan = isTeam ? 8 : isStudentTeams ? 12 : 9;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Live Monitor</h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitor{" "}
            {isTeam
              ? "teams"
              : isStudentTeams
                ? "Student Teams and their members"
                : "students"}{" "}
            in real time during the assessment.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Live {participantLabel}</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{liveCount}</p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Submitted</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {submittedCount}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Violations</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {students.reduce((sum, student) => sum + student.violations, 0)}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Average Progress</p>
          <p className="mt-2 text-3xl font-bold text-[#00629B]">
            {averageProgress}%
          </p>
        </div>
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
            placeholder={isTeam ? "Search Team..." : "Search Student..."}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 outline-none focus:border-[#00629B]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none"
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
                {isTeam ? (
                  <>
                    <th className="px-4 py-4">Team</th>
                    <th className="px-4 py-4">Email</th>
                    <th className="px-4 py-4">Branch</th>
                  </>
                ) : isStudentTeams ? (
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
                    colSpan={noDataColSpan}
                    className="px-6 py-16 text-center text-slate-500"
                  >
                    {loading
                      ? "Loading..."
                      : `No ${isTeam ? "teams" : "students"} found.`}
                  </td>
                </tr>
              ) : (
                filtered.map((student) => {
                  const submitted = isSubmitted(student);
                  const progress = student.totalQuestions
                    ? Math.round(
                        (student.answeredQuestions / student.totalQuestions) *
                          100,
                      )
                    : 0;
                  return (
                    <tr key={student.attemptId} className="text-sm">
                      {isTeam ? (
                        <>
                          <td className="px-4 py-4 font-semibold">
                            {student.teamName || student.studentName}
                          </td>
                          <td className="px-4 py-4">{student.email || "—"}</td>
                          <td className="px-4 py-4">
                            {student.department || "—"}
                          </td>
                        </>
                      ) : isStudentTeams ? (
                        <>
                          <td className="px-4 py-4 font-semibold">
                            {student.teamName || "—"}
                          </td>
                          <td className="px-4 py-4 font-semibold">
                            {student.teamMemberCount ||
                              student.members?.length ||
                              0}
                          </td>
                          <td className="px-4 py-4">{student.rollNo || "—"}</td>
                          <td className="px-4 py-4 font-semibold">
                            {student.studentName || "—"}
                          </td>
                          <td className="px-4 py-4">{student.email || "—"}</td>
                          <td className="px-4 py-4">
                            {student.department || "—"}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                                <UserRound size={18} />
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {student.studentName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {student.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">{student.rollNo || "—"}</td>
                        </>
                      )}
                      <td className="px-4 py-4">
                        {student.currentQuestion} / {student.totalQuestions}
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-32">
                          <div className="flex justify-between text-xs">
                            <span>{student.answeredQuestions}</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="mt-1 h-2 rounded-full bg-slate-200">
                            <div
                              className="h-2 rounded-full bg-[#00629B]"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock3 size={15} />
                          {submitted
                            ? "00:00"
                            : formatTimer(student.remainingSeconds)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5">
                          <Activity size={15} />
                          {student.violations}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${submitted ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                        >
                          {submitted ? "Submitted" : "Live"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openDetails(student)}
                            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2"
                          >
                            <CheckCircle2 size={15} />
                            View
                          </button>
                          {!submitted && (
                            <button
                              type="button"
                              disabled={processing === student.attemptId}
                              onClick={() => void forceSubmit(student)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-red-600 disabled:opacity-50"
                            >
                              <Send size={15} />
                              {processing === student.attemptId
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
        Status updates automatically every 5 seconds.
      </p>
      <LiveStudentDetailsDrawer
        open={drawerOpen}
        student={selected}
        onClose={() => {
          setDrawerOpen(false);
          setSelected(null);
        } } assessmentId={""} onRefresh={function (): Promise<void> {
          throw new Error("Function not implemented.");
        } }      />
    </div>
  );
}
