import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  MinusCircle,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { socket } from "../../../../../lib/socket";
import type { LiveStudent } from "./LiveMonitor";
import {
  getLiveStudentDetails,
  blockStudents,
  unblockStudents,
  deleteStudents,
  forceSubmitAttempt,
} from "../assessmentApi";

type Review = {
  id: string;
  questionNumber: number;
  questionText: string;
  questionType: string;
  selectedDisplay: string[];
  correctDisplay: string[];
  answered: boolean;
  result: "CORRECT" | "WRONG" | "UNANSWERED";
  marksAwarded: number;
  answeredAt: string | null;
  markedForReview: boolean;
};

export default function LiveStudentDetailsDrawer({
  open,
  student,
  assessmentId,
  onClose,
  onRefresh,
}: {
  open: boolean;
  student: LiveStudent | null;
  assessmentId: string;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false),
    [processing, setProcessing] = useState(false),
    [details, setDetails] = useState<any>(null);

  const fetchDetails = useCallback(async () => {
    if (!student?.attemptId) {
      setDetails(null);
      return;
    }
    try {
      setLoading(true);
      setDetails(await getLiveStudentDetails(student.attemptId));
    } catch (e: any) {
      console.error("[LIVE DETAILS]", e);
      toast.error(e?.response?.data?.message || "Unable to load details.");
    } finally {
      setLoading(false);
    }
  }, [student?.attemptId]);

  useEffect(() => {
    if (open) void fetchDetails();
  }, [open, fetchDetails]);

  useEffect(() => {
    if (!open) return;
    socket.on("dashboardRefresh", fetchDetails);
    socket.on("studentSubmitted", fetchDetails);
    socket.on("forceSubmitted", fetchDetails);
    return () => {
      socket.off("dashboardRefresh", fetchDetails);
      socket.off("studentSubmitted", fetchDetails);
      socket.off("forceSubmitted", fetchDetails);
    };
  }, [open, fetchDetails]);

  const questions: Review[] = details?.questions || [];
  const attempt = details?.attempt;
  const team = details?.team;
  const stats = details?.statistics || {};
  const correct = useMemo(
    () => questions.filter((q) => q.result === "CORRECT").length,
    [questions],
  );
  const wrong = useMemo(
    () => questions.filter((q) => q.result === "WRONG").length,
    [questions],
  );
  const unanswered = useMemo(
    () => questions.filter((q) => q.result === "UNANSWERED").length,
    [questions],
  );
  const finished = attempt?.status === "SUBMITTED";
  const blocked = details?.student?.status === "blocked";

  const force = async () => {
    if (!attempt?.id || finished) return;
    if (
      !confirm(
        `Force submit ${team?.team_name || student?.studentName}'s assessment?`,
      )
    )
      return;
    try {
      setProcessing(true);
      const r = await forceSubmitAttempt(attempt.id);
      toast.success(r?.message || "Assessment force submitted.");
      await fetchDetails();
      await onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Unable to force submit.");
    } finally {
      setProcessing(false);
    }
  };

  const toggleBlock = async () => {
    if (!assessmentId || !student?.studentId || team) return;
    try {
      setProcessing(true);
      if (blocked) await unblockStudents(assessmentId, [student.studentId]);
      else await blockStudents(assessmentId, [student.studentId]);
      toast.success(blocked ? "Student unblocked." : "Student blocked.");
      await fetchDetails();
      await onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Unable to update access.");
    } finally {
      setProcessing(false);
    }
  };

  const remove = async () => {
    if (!assessmentId || !student?.studentId || team) return;
    if (!confirm(`Delete ${student.studentName} from this assessment?`)) return;
    try {
      setProcessing(true);
      await deleteStudents(assessmentId, [student.studentId]);
      toast.success("Student deleted.");
      await onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Unable to delete student.");
    } finally {
      setProcessing(false);
    }
  };

  if (!open || !student) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/45" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 h-screen w-full max-w-4xl overflow-y-auto bg-slate-50 shadow-2xl">
        <header className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b bg-white px-6 py-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              {team ? <Users size={14} /> : <User size={14} />}
              {team ? "Team Attempt" : "Student Attempt"}
            </div>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              {team?.team_name || student.studentName}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {team
                ? `${team.member_count || team.members?.length || 0} member(s) · ${team.contact_email || student.email || "—"}`
                : `${student.email || "—"} · ${student.rollNo || "—"}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border bg-white p-2.5"
          >
            <X size={20} />
          </button>
        </header>

        {loading ? (
          <div className="flex min-h-[500px] items-center justify-center text-sm text-slate-500">
            Loading participant details...
          </div>
        ) : (
          <div className="space-y-5 p-5 md:p-7">
            {team && (
              <section className="rounded-2xl border bg-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <Users size={19} />
                  <h3 className="font-bold">Team Members</h3>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {(team.members || []).map((m: any) => (
                    <div
                      key={m.id || m.email}
                      className="rounded-xl border bg-slate-50 p-4"
                    >
                      <p className="font-semibold">{m.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {m.roll_no || "—"} · {m.branch || team.branch || "—"}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-600">
                        {m.email}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!team && (
              <section className="rounded-2xl border bg-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <User size={19} />
                  <h3 className="font-bold">Participant</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Info l="Name" v={student.studentName} />
                  <Info l="Roll Number" v={student.rollNo || "—"} />
                  <Info l="Branch" v={student.department || "—"} />
                  <Info l="Email" v={student.email || "—"} />
                </div>
              </section>
            )}

            <section className="rounded-2xl border bg-white p-5">
              <div className="mb-4 flex items-center gap-3">
                <Activity size={19} />
                <h3 className="font-bold">Assessment Status</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                <Stat l="Status" v={attempt?.status || "NOT STARTED"} />
                <Stat
                  l="Current"
                  v={
                    attempt?.status === "SUBMITTED"
                      ? "—"
                      : `${student.currentQuestion} / ${student.totalQuestions}`
                  }
                />
                <Stat
                  l="Answered"
                  v={`${stats.questionsAnswered ?? student.answeredQuestions} / ${student.totalQuestions}`}
                />
                <Stat l="Correct" v={String(stats.correct ?? correct)} />
                <Stat l="Wrong" v={String(stats.wrong ?? wrong)} />
                <Stat l="Score" v={String(stats.score ?? "—")} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                <Stat
                  l="Unanswered"
                  v={String(stats.unanswered ?? unanswered)}
                />
                <Stat
                  l="Violations"
                  v={String(stats.violations ?? student.violations)}
                />
                <Stat l="Resume Count" v={String(attempt?.resumedCount || 0)} />
              </div>
            </section>

            <section className="rounded-2xl border bg-white p-5">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <h3 className="font-bold">Question-wise Review</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {finished
                      ? "Every question is evaluated against the frozen attempt paper."
                      : "Answers stay local during the live test. Question-wise results appear after the final snapshot is processed."}
                  </p>
                </div>
                {questions.length > 0 && (
                  <span className="text-xs font-semibold text-slate-500">
                    {correct} correct · {wrong} wrong · {unanswered} unanswered
                  </span>
                )}
              </div>

              {!questions.length ? (
                <div className="rounded-xl border border-dashed bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                  {finished
                    ? "No question data is available."
                    : "No durable answer snapshot is available yet."}
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q) => (
                    <Question key={q.id} q={q} />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border bg-white p-5">
              <h3 className="mb-4 font-bold">Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  disabled={processing || finished}
                  onClick={() => void force()}
                  className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Force Submit
                </button>
                {!team && (
                  <>
                    <button
                      disabled={processing}
                      onClick={() => void toggleBlock()}
                      className="rounded-xl border bg-white px-4 py-3 text-sm font-semibold"
                    >
                      {blocked ? "Unblock Student" : "Block Student"}
                    </button>
                    <button
                      disabled={processing}
                      onClick={() => void remove()}
                      className="rounded-xl border bg-white px-4 py-3 text-sm font-semibold"
                    >
                      Delete Student
                    </button>
                  </>
                )}
              </div>
            </section>
          </div>
        )}
      </aside>
    </>
  );
}

function Info({ l, v }: { l: string; v: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{l}</p>
      <p className="mt-1 break-words text-sm font-semibold">{v}</p>
    </div>
  );
}

function Stat({ l, v }: { l: string; v: string }) {
  return (
    <div className="rounded-xl border bg-slate-50 p-3">
      <p className="text-[11px] text-slate-500">{l}</p>
      <p className="mt-1 truncate text-sm font-bold">{v}</p>
    </div>
  );
}

/*
 * IMPORTANT:
 * selectedDisplay and correctDisplay are actual option text.
 * The backend deliberately strips option keys (A/B/C/D) before sending them.
 * This component must never reconstruct or prepend option labels.
 */
function Question({ q }: { q: Review }) {
  const icon =
    q.result === "CORRECT" ? (
      <CheckCircle2 size={14} />
    ) : q.result === "WRONG" ? (
      <XCircle size={14} />
    ) : (
      <MinusCircle size={14} />
    );

  return (
    <article className="overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-3 border-b bg-slate-50 px-4 py-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">
            {q.questionNumber}
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {q.questionType}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6">
              {q.questionText}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs font-bold">
          {icon}
          {q.result}
        </span>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-2">
        <Answer
          l="Student Answer"
          values={q.selectedDisplay}
          empty="Not answered"
        />
        <Answer
          l="Correct Answer"
          values={q.correctDisplay}
          empty="No correct answer configured"
        />
      </div>

      <div className="flex flex-wrap gap-2 border-t px-4 py-3 text-xs font-semibold text-slate-500">
        <span className="rounded-full bg-slate-100 px-3 py-1">
          {q.answered ? "Answered" : "Unanswered"}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1">
          Marks: {q.marksAwarded}
        </span>
        {q.markedForReview && (
          <span className="rounded-full bg-slate-100 px-3 py-1">
            Marked for review
          </span>
        )}
        {q.answeredAt && (
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {new Date(q.answeredAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </article>
  );
}

function Answer({
  l,
  values,
  empty,
}: {
  l: string;
  values: string[];
  empty: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {l}
      </p>
      {values.length ? (
        <div className="mt-2 space-y-1">
          {values.map((v, i) => (
            <p key={`${v}-${i}`} className="text-sm font-semibold">
              {v}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm font-semibold text-slate-500">{empty}</p>
      )}
    </div>
  );
}
