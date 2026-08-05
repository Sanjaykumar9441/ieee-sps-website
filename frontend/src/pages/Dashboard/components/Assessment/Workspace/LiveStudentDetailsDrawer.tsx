import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, User, Clock, Activity, BarChart3 } from "lucide-react";

import { socket } from "../../../../../lib/socket";
import { LiveStudent } from "./LiveMonitor";

const API = import.meta.env.VITE_API_URL;

interface StudentTimeline {
  otpSentAt?: string;
  loggedInAt?: string;
  assessmentStartedAt?: string;
  submittedAt?: string;
}

interface StudentStatistics {
  questionsAnswered: number;
  correct: number;
  wrong: number;
  unanswered: number;
  score: number;
  timeSpent: string;
  violations: number;
}

interface StudentAttempt {
  id: string;
  status: string;
  startedAt?: string;
  submittedAt?: string;
  score?: number;
}

interface StudentDetails {
  student: LiveStudent;
  attempt: StudentAttempt | null;
  timeline: StudentTimeline;
  statistics: StudentStatistics;
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

  const fetchDetails = async () => {
    if (!student) return;

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const { data } = await axios.get(
        `${API}/api/live-monitor/details/${student.studentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setDetails(data);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load student details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!student) return;

    const token = localStorage.getItem("token");

    try {
      setProcessing(true);

      const { data } = await axios.post(
        `${API}/api/student-auth/send-bulk-otp`,
        {
          assessmentId,
          studentIds: [student.studentId],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(data.message);

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

    const token = localStorage.getItem("token");

    try {
      setProcessing(true);

      const { data } = await axios.post(
        `${API}/api/student-auth/block`,
        {
          assessmentId,
          studentIds: [student.studentId],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(data.message);

      await onRefresh();

      await fetchDetails();
    } catch (err) {
      console.error(err);

      toast.error("Unable to block student.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!student) return;

    if (!window.confirm("Delete this student?")) {
      return;
    }

    const token = localStorage.getItem("token");

    try {
      setProcessing(true);

      const { data } = await axios.post(
        `${API}/api/student-auth/delete`,
        {
          assessmentId,
          studentIds: [student.studentId],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

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

    const token = localStorage.getItem("token");

    try {
      setProcessing(true);

      const { data } = await axios.post(
        `${API}/api/live-monitor/force-submit`,
        {
          assessmentId,
          attemptId: student.attemptId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

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

    const token = localStorage.getItem("token");

    try {
      setProcessing(true);

      const { data } = await axios.post(
        `${API}/api/live-monitor/disqualify`,
        {
          assessmentId,
          attemptId: student.attemptId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

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

    fetchDetails();
  }, [open, student?.studentId]);

  useEffect(() => {
    if (!open) return;

    socket.on("studentProgress", fetchDetails);
    socket.on("answerSaved", fetchDetails);
    socket.on("assessmentSubmitted", fetchDetails);
    socket.on("studentDisqualified", fetchDetails);

    return () => {
      socket.off("studentProgress", fetchDetails);
      socket.off("answerSaved", fetchDetails);
      socket.off("assessmentSubmitted", fetchDetails);
      socket.off("studentDisqualified", fetchDetails);
    };
  }, [open, student?.studentId]);

  if (!open || !student) return null;

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

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border p-4">
                  <p className="text-gray-500">Status</p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold
                    ${
                      student.status === "LIVE"
                        ? "bg-green-100 text-green-700"
                        : student.status === "SUBMITTED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {student.status}
                  </span>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-gray-500">Remaining Time</p>

                  <p className="mt-2 text-xl font-bold">
                    {Math.floor(student.remainingSeconds / 60)}m{" "}
                    {student.remainingSeconds % 60}s
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-gray-500">Current Question</p>

                  <p className="mt-2 text-xl font-bold">
                    {student.currentQuestion} / {student.totalQuestions}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-gray-500">Answered</p>

                  <p className="mt-2 text-xl font-bold">
                    {student.answeredQuestions}
                  </p>
                </div>
              </div>
            </div>
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
                    {details?.attempt?.startedAt
                      ? new Date(details.attempt.startedAt).toLocaleString()
                      : "-"}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-3">
                  <span className="text-gray-600">Submitted</span>

                  <span className="font-medium">
                    {details?.attempt?.submittedAt
                      ? new Date(details.attempt.submittedAt).toLocaleString()
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
                    {student.answeredQuestions}
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
                    {student.violations}
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
                    {student.totalQuestions > 0
                      ? Math.round(
                          (student.answeredQuestions / student.totalQuestions) *
                            100,
                        )
                      : 0}
                    %
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-[#00629B]"
                    style={{
                      width: `${
                        student.totalQuestions > 0
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
                  Block
                </button>

                <button
                  disabled={processing}
                  onClick={handleDelete}
                  className="rounded-xl bg-red-600 px-5 py-3 text-white disabled:opacity-50"
                >
                  Delete
                </button>

                <button
                  disabled={processing}
                  onClick={handleForceSubmit}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
                >
                  Force Submit
                </button>

                <button
                  disabled={processing}
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
