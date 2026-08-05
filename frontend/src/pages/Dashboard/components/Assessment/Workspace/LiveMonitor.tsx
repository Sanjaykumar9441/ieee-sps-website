import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Search, RefreshCw } from "lucide-react";

import { socket } from "../../../../../lib/socket";
import { Assessment } from "../../Assessment/AssessmentCard";
import LiveStudentDetailsDrawer from "./LiveStudentDetailsDrawer";

const API = import.meta.env.VITE_API_URL;

interface Props {
  assessment: Assessment;
}

export interface LiveStudent {
  attemptId: string;

  studentId: string;

  rollNo: string;

  studentName: string;

  email: string;

  department: string;

  currentQuestion: number;

  answeredQuestions: number;

  totalQuestions: number;

  remainingSeconds: number;

  violations: number;

  status: "LIVE" | "SUBMITTED" | "DISQUALIFIED";
}

export default function LiveMonitor({ assessment }: Props) {
  const [processingStudent, setProcessingStudent] = useState<string | null>(
    null,
  );

  const [selectedStudent, setSelectedStudent] = useState<LiveStudent | null>(
    null,
  );

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState<LiveStudent[]>([]);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("all");

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.get(
        `${API}/api/live-monitor/${assessment.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setStudents(data.students || []);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load live monitor.");
    } finally {
      setLoading(false);
    }
  };

  const handleForceSubmit = async (student: LiveStudent) => {
    if (!window.confirm(`Force submit ${student.studentName}'s assessment?`)) {
      return;
    }

    try {
      setProcessingStudent(student.attemptId);

      const token = localStorage.getItem("token");

      const { data } = await axios.post(
        `${API}/api/live-monitor/force-submit`,
        {
          assessmentId: assessment.id,
          attemptId: student.attemptId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(data.message);

      await fetchStudents();
    } catch (err) {
      console.error(err);

      toast.error("Unable to force submit.");
    } finally {
      setProcessingStudent(null);
    }
  };

  const handleDisqualify = async (student: LiveStudent) => {
    if (!window.confirm(`Disqualify ${student.studentName}?`)) {
      return;
    }

    try {
      setProcessingStudent(student.attemptId);

      const token = localStorage.getItem("token");

      const { data } = await axios.post(
        `${API}/api/live-monitor/disqualify`,
        {
          assessmentId: assessment.id,
          attemptId: student.attemptId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(data.message);

      await fetchStudents();
    } catch (err) {
      console.error(err);

      toast.error("Unable to disqualify student.");
    } finally {
      setProcessingStudent(null);
    }
  };

  useEffect(() => {
    void fetchStudents();

    socket.emit("joinAssessmentRoom", assessment.id);

    socket.on("studentProgress", fetchStudents);

    socket.on("answerSaved", fetchStudents);

    socket.on("assessmentSubmitted", fetchStudents);

    socket.on("studentDisqualified", fetchStudents);

    return () => {
      socket.off("studentProgress", fetchStudents);

      socket.off("answerSaved", fetchStudents);

      socket.off("assessmentSubmitted", fetchStudents);

      socket.off("studentDisqualified", fetchStudents);
    };
  }, [assessment.id]);

  const stats = useMemo(() => {
    return {
      live: students.filter((s) => s.status === "LIVE").length,

      submitted: students.filter((s) => s.status === "SUBMITTED").length,

      disqualified: students.filter((s) => s.status === "DISQUALIFIED").length,
    };
  }, [students]);

  const averageProgress =
    students.length > 0
      ? Math.round(
          students.reduce(
            (sum, student) =>
              sum +
              (student.totalQuestions
                ? (student.answeredQuestions / student.totalQuestions) * 100
                : 0),
            0,
          ) / students.length,
        )
      : 0;

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.studentName.toLowerCase().includes(search.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = status === "all" || student.status === status;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="py-20 text-center">Loading Live Monitor...</div>;
  }
  return (
    <div className="space-y-8">
      {/* Header */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Monitor</h2>

          <p className="mt-1 text-gray-500">
            Monitor students in real time during the assessment.
          </p>
        </div>

        <button
          onClick={fetchStudents}
          className="flex items-center gap-2 rounded-xl border px-5 py-3 hover:bg-gray-50"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Statistics */}

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-gray-500">Live Students</p>

          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {stats.live}
          </h2>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <p className="text-gray-500">Submitted</p>

          <h2 className="mt-2 text-3xl font-bold text-blue-600">
            {stats.submitted}
          </h2>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <p className="text-gray-500">Disqualified</p>

          <h2 className="mt-2 text-3xl font-bold text-red-600">
            {stats.disqualified}
          </h2>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <p className="text-gray-500">Average Progress</p>

          <h2 className="mt-2 text-3xl font-bold text-[#00629B]">
            {averageProgress}%
          </h2>
        </div>
      </div>

      {/* Toolbar */}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Student..."
            className="w-full rounded-xl border py-3 pl-10 pr-4"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border px-4"
        >
          <option value="all">All Status</option>

          <option value="LIVE">Live</option>

          <option value="SUBMITTED">Submitted</option>

          <option value="DISQUALIFIED">Disqualified</option>
        </select>
      </div>

      {/* Live Students Table */}

      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Student</th>

              <th className="p-4 text-left">Roll No</th>

              <th className="p-4 text-left">Current</th>

              <th className="p-4 text-left">Answered</th>

              <th className="p-4 text-left">Timer</th>

              <th className="p-4 text-left">Violations</th>

              <th className="p-4 text-left">Status</th>

              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-500">
                  No live students found.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                const minutes = Math.floor(student.remainingSeconds / 60);

                const seconds = student.remainingSeconds % 60;

                return (
                  <tr
                    key={student.attemptId}
                    className="border-t hover:bg-gray-50"
                  >
                    {/* Student */}

                    <td className="p-4">
                      <div>
                        <p className="font-semibold">{student.studentName}</p>

                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </td>

                    {/* Roll No */}

                    <td className="p-4">{student.rollNo}</td>

                    {/* Current Question */}

                    <td className="p-4">
                      {student.currentQuestion} / {student.totalQuestions}
                    </td>

                    {/* Answered */}

                    <td className="p-4">
                      <div>
                        <p className="font-medium">
                          {student.answeredQuestions}
                        </p>

                        <div className="mt-2 h-2 w-32 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-[#00629B]"
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
                    </td>

                    {/* Timer */}

                    <td className="p-4 font-medium">
                      {String(minutes).padStart(2, "0")}:
                      {String(seconds).padStart(2, "0")}
                    </td>

                    {/* Violations */}

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          student.violations > 0
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {student.violations}
                      </span>
                    </td>

                    {/* Status */}

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold
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
                    </td>

                    {/* Actions */}

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setDrawerOpen(true);
                          }}
                          className="rounded-lg border px-3 py-1 hover:bg-gray-100"
                        >
                          View
                        </button>

                        <button
                          disabled={processingStudent === student.attemptId}
                          onClick={() => handleForceSubmit(student)}
                          className="rounded-lg border border-yellow-400 px-3 py-1 text-yellow-700 hover:bg-yellow-50 disabled:opacity-50"
                        >
                          Force Submit
                        </button>

                        <button
                          disabled={processingStudent === student.attemptId}
                          onClick={() => handleDisqualify(student)}
                          className="rounded-lg border border-red-400 px-3 py-1 text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Disqualify
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <LiveStudentDetailsDrawer
          open={drawerOpen}
          student={selectedStudent}
          assessmentId={assessment.id}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedStudent(null);
          }}
          onRefresh={fetchStudents}
        />
      </div>
    </div>
  );
}
