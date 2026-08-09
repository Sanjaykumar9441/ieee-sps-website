import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Mail, User, GraduationCap, Clock } from "lucide-react";

import { socket } from "../../../../../lib/socket";
import { AllowedStudent } from "./Students";

const API = import.meta.env.VITE_API_URL;

interface Props {
  open: boolean;

  student: AllowedStudent | null;

  assessmentId: string;

  onClose: () => void;

  onRefresh: () => Promise<void>;
}

interface StudentAttempt {
  id: string;
  status: string;
  startedAt: string | null;
  submittedAt: string | null;
  score: number;
}

interface StudentTimeline {
  loggedInAt: string | null;
  assessmentStartedAt: string | null;
  submittedAt: string | null;
}

interface StudentStatistics {
  questionsAnswered: number;
  score: number;
}

interface StudentDetails {
  student: AllowedStudent;
  attempt: StudentAttempt | null;
  statistics: StudentStatistics;
  timeline: StudentTimeline;
}

export default function StudentDetailsDrawer({
  open,
  student,
  assessmentId,
  onClose,
  onRefresh,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [details, setDetails] = useState<StudentDetails | null>(null);

  const [processing, setProcessing] = useState(false);

  const fetchDetails = async () => {
    if (!student) return;

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const { data } = await axios.get(
        `${API}/api/student-auth/details/${student.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !student) return;

    fetchDetails();

    socket.on("studentStatusChanged", fetchDetails);
    socket.on("studentLoggedIn", fetchDetails);
    socket.on("studentSubmitted", fetchDetails);
    socket.on("studentBlocked", fetchDetails);
    socket.on("studentUnblocked", fetchDetails);
    socket.on("dashboardRefresh", fetchDetails);

    return () => {
      socket.off("studentStatusChanged", fetchDetails);
      socket.off("studentLoggedIn", fetchDetails);
      socket.off("studentSubmitted", fetchDetails);
      socket.off("studentBlocked", fetchDetails);
      socket.off("studentUnblocked", fetchDetails);
      socket.off("dashboardRefresh", fetchDetails);
    };
  }, [open, student]);

  if (!open || !student) return null;

  return (
    <>
      {/* Overlay */}

      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/40" />

      {/* Drawer */}

      <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        {/* Header */}

        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold">Student Details</h2>

            <p className="text-sm text-gray-500">Assessment Information</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={22} />
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center">Loading...</div>
        ) : (
          <div className="space-y-8 p-6">
            {/* Personal Information */}

            <div className="rounded-2xl border bg-white p-6">
              <h3 className="mb-5 text-xl font-semibold">
                Personal Information
              </h3>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <p className="text-sm text-gray-500">Name</p>

                  <div className="mt-2 flex items-center gap-2">
                    <User size={18} className="text-[#00629B]" />
                    <span className="font-medium">
                      {details?.student?.name}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Roll Number</p>

                  <p className="mt-2 font-medium">
                    {details?.student?.roll_no}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Email</p>

                  <div className="mt-2 flex items-center gap-2">
                    <Mail size={18} className="text-[#00629B]" />
                    <span className="break-all">{details?.student?.email}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Department</p>

                  <div className="mt-2 flex items-center gap-2">
                    <GraduationCap size={18} className="text-[#00629B]" />

                    <span>{details?.student?.department}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Year</p>

                  <p className="mt-2">{details?.student?.year}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Section</p>

                  <p className="mt-2">{details?.student?.section}</p>
                </div>
              </div>
            </div>

            {/* Assessment Status */}

            <div className="rounded-2xl border bg-white p-6">
              <h3 className="mb-5 text-xl font-semibold">Assessment Status</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Allowed / Blocked */}

                <div>
                  <p className="text-sm text-gray-500">Status</p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                      details?.student?.status === "allowed"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {details?.student?.status}
                  </span>
                </div>

                {/* OTP */}

                <div>
                  <p className="text-sm text-gray-500">OTP</p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                      details?.student?.otp_sent
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {details?.student?.otp_sent ? "Sent" : "Not Sent"}
                  </span>
                </div>

                {/* Login */}

                <div>
                  <p className="text-sm text-gray-500">Login</p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                      details?.student?.logged_in
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {details?.student?.logged_in
                      ? "Logged In"
                      : "Not Logged In"}
                  </span>
                </div>

                {/* Attempt */}

                <div>
                  <p className="text-sm text-gray-500">Attempt</p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                      details?.student?.attempt_started
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {details?.student?.attempt_started
                      ? "Started"
                      : "Not Started"}
                  </span>
                </div>

                {/* Submitted */}

                <div>
                  <p className="text-sm text-gray-500">Submission</p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                      details?.student?.submitted
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {details?.student?.submitted ? "Submitted" : "Pending"}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}

            <div className="rounded-2xl border bg-white p-6">
              <h3 className="mb-5 text-xl font-semibold">Timeline</h3>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="mt-1 rounded-full bg-green-500 p-2">
                    <Clock size={14} className="text-white" />
                  </div>

                  <div>
                    <p className="font-medium">OTP Sent</p>

                    <p className="text-sm text-gray-500">
                      {details?.student?.otp_sent
                        ? "OTP sent"
                        : "Not Available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 rounded-full bg-blue-500 p-2">
                    <Clock size={14} className="text-white" />
                  </div>

                  <div>
                    <p className="font-medium">Logged In</p>

                    <p className="text-sm text-gray-500">
                      {details?.timeline?.loggedInAt
                        ? new Date(details.timeline.loggedInAt).toLocaleString()
                        : "Not Available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 rounded-full bg-yellow-500 p-2">
                    <Clock size={14} className="text-white" />
                  </div>

                  <div>
                    <p className="font-medium">Assessment Started</p>

                    <p className="text-sm text-gray-500">
                      {details?.timeline?.assessmentStartedAt
                        ? new Date(
                            details.timeline.assessmentStartedAt,
                          ).toLocaleString()
                        : "Not Available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 rounded-full bg-purple-500 p-2">
                    <Clock size={14} className="text-white" />
                  </div>

                  <div>
                    <p className="font-medium">Submitted</p>

                    <p className="text-sm text-gray-500">
                      {details?.timeline?.submittedAt
                        ? new Date(
                            details.timeline.submittedAt,
                          ).toLocaleString()
                        : "Not Available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}

            <div className="rounded-2xl border bg-white p-6">
              <h3 className="mb-5 text-xl font-semibold">Statistics</h3>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-gray-500">Questions Answered</p>

                  <h2 className="mt-2 text-2xl font-bold">
                    {details?.statistics?.questionsAnswered ?? 0}
                  </h2>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-sm text-gray-500">Score</p>

                  <h2 className="mt-2 text-2xl font-bold text-blue-600">
                    {details?.statistics?.score ?? 0}
                  </h2>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-sm text-gray-500">Attempt Status</p>

                  <h2 className="mt-2 text-xl font-bold">
                    {details?.attempt?.status ?? "Not Started"}
                  </h2>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-sm text-gray-500">Started At</p>

                  <h2 className="mt-2 text-sm font-semibold">
                    {details?.attempt?.startedAt
                      ? new Date(details.attempt.startedAt).toLocaleString()
                      : "Not Started"}
                  </h2>
                </div>
              </div>
            </div>

            {/* Footer Actions */}

            <div className="mt-8 flex flex-wrap justify-end gap-3 border-t pt-6">
              <button
                type="button"
                disabled={processing}
                onClick={async () => {
                  if (!student) return;

                  try {
                    setProcessing(true);
                    const token = localStorage.getItem("token");

                    const { data } = await axios.post(
                      `${API}/api/student-auth/send-bulk-otp`,

                      {
                        assessmentId,

                        studentIds: [student.id],
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
                }}
                className="rounded-xl bg-green-600 px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send OTP
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={async () => {
                  if (!student) return;

                  try {
                    setProcessing(true);
                    const token = localStorage.getItem("token");

                    const { data } = await axios.post(
                      `${API}/api/student-auth/block`,

                      {
                        assessmentId,

                        studentIds: [student.id],
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
                }}
                className="rounded-xl bg-yellow-500 px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {student.status === "blocked" ? "Unblock" : "Block"}
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={async () => {
                  if (!student) return;

                  if (!window.confirm("Delete this student?")) {
                    return;
                  }

                  try {
                    setProcessing(true);
                    const token = localStorage.getItem("token");

                    const { data } = await axios.post(
                      `${API}/api/student-auth/delete`,

                      {
                        assessmentId,

                        studentIds: [student.id],
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
                }}
                className="rounded-xl bg-red-600 px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border px-5 py-2"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
