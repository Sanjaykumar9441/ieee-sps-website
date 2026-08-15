import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { X, User, Clock, Activity, BarChart3 } from "lucide-react";
import { socket } from "../../../../../lib/socket";
import { LiveStudent } from "./LiveMonitor";
import {
  getLiveStudentDetails,
  sendBulkOtp,
  blockStudents,
  unblockStudents,
  deleteStudents,
  forceSubmitAttempt,
  disqualifyAttempt,
} from "../../Assessment/assessmentApi";

interface StudentTimeline {
  assessmentStartedAt?: string;
  submittedAt?: string;
}

interface StudentStatistics {
  questionsAnswered: number;
  score: number;
  violations: number;
}

interface StudentAttempt {
  id: string;
  status: string;
  startedAt?: string;
  submittedAt?: string;
  score?: number;
  resumedCount?: number;
  disqualifiedReason?: string | null;
}

interface StudentInfo {
  status: "allowed" | "blocked";
}

interface StudentQuestion {
  id: string;
  question_order: number;
  questions?: {
    question_text?: string;
  };
  assessment_answers?:
    | {
        selected_answers?: string[];
        subjective_answer?: string | null;
        coding_answer?: string | null;
        answered_at?: string;
      }
    | {
        selected_answers?: string[];
        subjective_answer?: string | null;
        coding_answer?: string | null;
        answered_at?: string;
      }[];

  assessment_question_flags?:
    | {
        marked_for_review?: boolean;
      }
    | {
        marked_for_review?: boolean;
      }[];
}

interface StudentDetails {
  student: StudentInfo;
  attempt: StudentAttempt | null;
  timeline: StudentTimeline;
  statistics: StudentStatistics;
  questions: StudentQuestion[];
}

interface Props {
  open: boolean;
  student: LiveStudent | null;
  assessmentId: string;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

export default function LiveStudentDetailsDrawer({
  open,
  student,
  assessmentId,
  onClose,
  onRefresh,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [processing, setProcessing] = useState(false);

  const [details, setDetails] = useState<StudentDetails | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!student) return;

    try {
      setLoading(true);

      const data = await getLiveStudentDetails(student.attemptId);

      setDetails(data);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load student details");
    } finally {
      setLoading(false);
    }
  }, [student]);

  const handleSendOtp = async () => {
    if (!student) return;

    try {
      setProcessing(true);

      const data = await sendBulkOtp(assessmentId, [student.studentId]);

      toast.success(data.message || "OTP sent successfully.");

      await onRefresh();
      await fetchDetails();
    } catch (err) {
      console.error(err);
      toast.error("Unable to send OTP.");
    } finally {
      setProcessing(false);
    }
  };

  const handleBlock = async () => {
    if (!student) return;

    try {
      setProcessing(true);

      const data =
        details?.student.status === "blocked"
          ? await unblockStudents(assessmentId, [student.studentId])
          : await blockStudents(assessmentId, [student.studentId]);

      toast.success(data.message || "Student status updated.");

      await onRefresh();
      await fetchDetails();
    } catch (err) {
      console.error(err);

      toast.error(
        details?.student.status === "blocked"
          ? "Unable to unblock student."
          : "Unable to block student.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!student) return;

    if (!window.confirm("Delete this student?")) {
      return;
    }

    try {
      setProcessing(true);

      const data = await deleteStudents(assessmentId, [student.studentId]);

      toast.success(data.message);

      await onRefresh();

      onClose();
    } catch (err) {
      console.error(err);

      toast.error("Unable to delete student.");
    } finally {
      setProcessing(false);
    }
  };

  const handleForceSubmit = async () => {
    if (!student) return;

    try {
      setProcessing(true);

      if (!details?.attempt?.id) {
        toast.error("No assessment attempt found.");
        return;
      }

      const data = await forceSubmitAttempt(details.attempt.id);

      toast.success(data.message);

      await onRefresh();

      await fetchDetails();
    } catch (err) {
      console.error(err);

      toast.error("Unable to force submit.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDisqualify = async () => {
    if (!student) return;

    try {
      setProcessing(true);

      const reason =
        window.prompt("Reason for disqualification?") ||
        "Disqualified by admin";

      if (!details?.attempt?.id) {
        toast.error("No assessment attempt found.");
        return;
      }

      const data = await disqualifyAttempt(details.attempt.id, reason);

      toast.success(data.message);

      await onRefresh();

      await fetchDetails();
    } catch (err) {
      console.error(err);

      toast.error("Unable to disqualify student.");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (!open || !student) return;

    void fetchDetails();
  }, [open, student, fetchDetails]);

  useEffect(() => {
    if (!open) return;

    socket.on("dashboardRefresh", fetchDetails);

    return () => {
      socket.off("dashboardRefresh", fetchDetails);
    };
  }, [open, fetchDetails]);

  if (!open || !student) return null;

  const attemptFinished =
    details?.attempt?.status === "SUBMITTED" ||
    details?.attempt?.status === "DISQUALIFIED";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
        {/* Header */}

        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold">Student Details</h2>

            <p className="mt-1 text-gray-500">Live assessment information</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border p-2 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center">Loading Student Details...</div>
        ) : (
          <div className="space-y-8 p-8">
            {/* =======================================
                PERSONAL INFORMATION
            ======================================== */}

            <div className="rounded-2xl border p-6">
              <div className="mb-6 flex items-center gap-3">
                <User className="text-[#00629B]" />

                <h3 className="text-xl font-bold">Personal Information</h3>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <p className="text-sm text-gray-500">Name</p>

                  <p className="font-semibold">{student.studentName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Roll Number</p>

                  <p className="font-semibold">{student.rollNo}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Email</p>

                  <p className="font-semibold break-all">{student.email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Department</p>

                  <p className="font-semibold">{student.department}</p>
                </div>
              </div>
            </div>

            {/* =======================================
                LIVE STATUS
            ======================================== */}

            <div className="rounded-2xl border p-6">
              <div className="mb-6 flex items-center gap-3">
                <Activity className="text-green-600" />

                <h3 className="text-xl font-bold">Live Assessment Status</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="rounded-xl border p-4">
                  <p className="text-gray-500">Status</p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold
                    ${
                      details?.attempt?.status === "IN_PROGRESS"
                        ? "bg-green-100 text-green-700"
                        : details?.attempt?.status === "SUBMITTED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {details?.attempt?.status || "NOT STARTED"}
                  </span>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-gray-500">Remaining Time</p>

                  <p className="mt-2 text-xl font-bold">
                    {student.isExpired ? (
                      <span className="text-red-600">Expired</span>
                    ) : (
                      `${String(
                        Math.floor(student.remainingSeconds / 60),
                      ).padStart(
                        2,
                        "0",
                      )}:${String(student.remainingSeconds % 60).padStart(2, "0")}`
                    )}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-gray-500">Current Question</p>

                  <p className="mt-2 text-xl font-bold">
                    {student
                      ? student.currentQuestion > 0
                        ? `${student.currentQuestion} / ${student.totalQuestions}`
                        : `— / ${student.totalQuestions}`
                      : "-"}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-gray-500">Answered</p>

                  <p className="mt-2 text-xl font-bold">
                    {details?.statistics?.questionsAnswered ?? 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-gray-500">Resume Count</p>

              <p className="mt-2 text-xl font-bold">
                {details?.attempt?.resumedCount ?? 0}
              </p>
            </div>

            {details?.attempt?.status === "DISQUALIFIED" &&
              details.attempt.disqualifiedReason && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                  <h3 className="text-lg font-bold text-red-700">
                    Disqualification Reason
                  </h3>

                  <p className="mt-2 text-red-800">
                    {details.attempt.disqualifiedReason}
                  </p>
                </div>
              )}
            {/* =======================================
                TIMELINE
            ======================================== */}

            <div className="rounded-2xl border p-6">
              <div className="mb-6 flex items-center gap-3">
                <Clock className="text-[#00629B]" />

                <h3 className="text-xl font-bold">Timeline</h3>
              </div>

              <div className="space-y-5">
                <div className="flex justify-between border-b pb-3">
                  <span className="text-gray-600">Assessment Started</span>

                  <span className="font-medium">
                    {details?.timeline?.assessmentStartedAt
                      ? new Date(
                          details?.timeline?.assessmentStartedAt,
                        ).toLocaleString()
                      : "-"}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-3">
                  <span className="text-gray-600">Submitted</span>

                  <span className="font-medium">
                    {details?.timeline?.submittedAt
                      ? new Date(details.timeline.submittedAt).toLocaleString()
                      : "Not Submitted"}
                  </span>
                </div>
              </div>
            </div>

            {/* =======================================
                STATISTICS
            ======================================== */}

            <div className="rounded-2xl border p-6">
              <div className="mb-6 flex items-center gap-3">
                <BarChart3 className="text-green-600" />

                <h3 className="text-xl font-bold">Statistics</h3>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="rounded-xl border p-5">
                  <p className="text-gray-500">Questions Answered</p>

                  <h3 className="mt-2 text-3xl font-bold">
                    {details?.statistics?.questionsAnswered ?? 0}
                  </h3>
                </div>

                <div className="rounded-xl border p-5">
                  <p className="text-gray-500">Total Questions</p>

                  <h3 className="mt-2 text-3xl font-bold">
                    {student.totalQuestions}
                  </h3>
                </div>

                <div className="rounded-xl border p-5">
                  <p className="text-gray-500">Violations</p>

                  <h3 className="mt-2 text-3xl font-bold text-red-600">
                    {details?.statistics?.violations ?? 0}
                  </h3>
                </div>

                <div className="rounded-xl border p-5">
                  <p className="text-gray-500">Score</p>

                  <h3 className="mt-2 text-3xl font-bold text-green-600">
                    {details?.statistics?.score ?? "-"}
                  </h3>
                </div>
              </div>
            </div>

            {/* =======================================
                PROGRESS
            ======================================== */}

            <div className="rounded-2xl border p-6">
              <div className="mb-6 flex items-center gap-3">
                <Activity className="text-blue-600" />

                <h3 className="text-xl font-bold">Progress</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Completion</span>

                  <span className="font-semibold">
                    {student.answeredQuestions} / {student.totalQuestions}{" "}
                    answered
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-[#00629B]"
                    style={{
                      width: `${
                        student.totalQuestions
                          ? (student.answeredQuestions /
                              student.totalQuestions) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* =======================================
    QUESTION ACTIVITY
======================================== */}

            <div className="rounded-2xl border p-6">
              <div className="mb-6 flex items-center gap-3">
                <BarChart3 className="text-[#00629B]" />

                <h3 className="text-xl font-bold">Question Activity</h3>
              </div>

              <div className="space-y-3">
                {(details?.questions ?? []).map((question) => {
                  const rawAnswer = question.assessment_answers;

                  const answer = Array.isArray(rawAnswer)
                    ? rawAnswer[0]
                    : rawAnswer;

                  const rawFlag = question.assessment_question_flags;

                  const flag = Array.isArray(rawFlag) ? rawFlag[0] : rawFlag;

                  const answered = Boolean(
                    answer &&
                    ((Array.isArray(answer.selected_answers) &&
                      answer.selected_answers.length > 0) ||
                      answer.subjective_answer ||
                      answer.coding_answer ||
                      answer.answered_at),
                  );

                  const markedForReview = Boolean(flag?.marked_for_review);

                  // Debug AFTER answered has been calculated
                  console.log("========== LIVE QUESTION ANSWER ==========");
                  console.log("Question:", question.question_order);
                  console.log(
                    "Raw assessment_answers:",
                    question.assessment_answers,
                  );
                  console.log("Normalized answer:", answer);
                  console.log("Selected answers:", answer?.selected_answers);
                  console.log("Answered:", answered);

                  return (
                    <div key={question.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold">
                            Question {question.question_order}
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            {question.questions?.question_text ||
                              "Question text unavailable"}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          {answered ? (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              Answered
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                              Unanswered
                            </span>
                          )}

                          {markedForReview && (
                            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                              Marked for Review
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {(!details?.questions || details.questions.length === 0) && (
                  <p className="py-6 text-center text-gray-500">
                    No question activity available.
                  </p>
                )}
              </div>
            </div>

            {/* =======================================
                ACTIONS
            ======================================== */}

            <div className="rounded-2xl border p-6">
              <h3 className="mb-6 text-xl font-bold">Actions</h3>

              <div className="flex flex-wrap gap-4">
                <button
                  disabled={processing}
                  onClick={handleSendOtp}
                  className="rounded-xl bg-green-600 px-5 py-3 text-white disabled:opacity-50"
                >
                  Send OTP
                </button>

                <button
                  disabled={processing}
                  onClick={handleBlock}
                  className="rounded-xl bg-yellow-500 px-5 py-3 text-white disabled:opacity-50"
                >
                  {details?.student.status === "blocked" ? "Unblock" : "Block"}
                </button>

                <button
                  disabled={processing}
                  onClick={handleDelete}
                  className="rounded-xl bg-red-600 px-5 py-3 text-white disabled:opacity-50"
                >
                  Delete
                </button>

                <button
                  disabled={
                    processing || !details?.attempt?.id || attemptFinished
                  }
                  onClick={handleForceSubmit}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
                >
                  Force Submit
                </button>

                <button
                  disabled={
                    processing || !details?.attempt?.id || attemptFinished
                  }
                  onClick={handleDisqualify}
                  className="rounded-xl bg-red-500 px-5 py-3 text-white disabled:opacity-50"
                >
                  Disqualify
                </button>

                <button
                  onClick={onClose}
                  className="rounded-xl border px-5 py-3"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
