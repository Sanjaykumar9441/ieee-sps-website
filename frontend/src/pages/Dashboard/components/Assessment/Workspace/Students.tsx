import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { socket } from "../../../../../lib/socket";
import { Assessment } from "../../Assessment/AssessmentCard";
import StudentDetailsDrawer from "./StudentDetailsDrawer";
import {
  getAllowedStudents,
  sendBulkOtp,
  blockStudents,
  unblockStudents,
  deleteStudents,
} from "../../Assessment/assessmentApi";

export interface AllowedStudent {
  id: string;

  roll_no: string;

  name: string;

  email: string;

  department: string;

  year: number;

  section: string;

  status: "allowed" | "blocked";

  otp_sent: boolean;

  logged_in: boolean;

  attempt_started: boolean;

  submitted: boolean;
}

interface Props {
  assessment: Assessment;
}

export default function Students({ assessment }: Props) {
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState<AllowedStudent[]>([]);

  const [search, setSearch] = useState("");

  const [department, setDepartment] = useState("all");

  const [year, setYear] = useState("all");

  const [section, setSection] = useState("all");

  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [processing, setProcessing] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<AllowedStudent | null>(
    null,
  );

  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchStudents = useCallback(async () => {
  try {
    setLoading(true);

    const students = await getAllowedStudents(assessment.id);

    setStudents(students || []);
  } catch (err) {
    console.error(err);

    toast.error("Unable to load students");
  } finally {
    setLoading(false);
  }
}, [assessment.id]);

  useEffect(() => {
  void fetchStudents();

  socket.emit("joinAssessmentRoom", assessment.id);

  const refresh = () => {
    void fetchStudents();
  };

  socket.on("studentStatusChanged", refresh);
  socket.on("studentLoggedIn", refresh);
  socket.on("studentSubmitted", refresh);
  socket.on("dashboardRefresh", refresh);
  socket.on("studentBlocked", refresh);
  socket.on("studentUnblocked", refresh);
  socket.on("studentDeleted", refresh);

  return () => {
    socket.off("studentStatusChanged", refresh);
    socket.off("studentLoggedIn", refresh);
    socket.off("studentSubmitted", refresh);
    socket.off("dashboardRefresh", refresh);
    socket.off("studentBlocked", refresh);
    socket.off("studentUnblocked", refresh);
    socket.off("studentDeleted", refresh);

    socket.emit("leaveAssessmentRoom", assessment.id);
  };
}, [assessment.id, fetchStudents]);

  const stats = useMemo(() => {
    const started = students.filter((s) => s.attempt_started).length;

    return {
      allowed: students.filter((s) => s.status === "allowed").length,

      blocked: students.filter((s) => s.status === "blocked").length,

      loggedIn: students.filter((s) => s.logged_in).length,

      started,

      submitted: students.filter((s) => s.submitted).length,

      notStarted: students.length - started,
    };
  }, [students]);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.roll_no.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase());

    const matchesDepartment =
      department === "all" || student.department === department;

    const matchesYear = year === "all" || String(student.year) === year;

    const matchesSection = section === "all" || student.section === section;

    return matchesSearch && matchesDepartment && matchesYear && matchesSection;
  });

  const handleSendOtp = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student.");
      return;
    }

    try {
      setProcessing(true);

      const data = await sendBulkOtp(assessment.id, selectedStudents);

      toast.success(data.message || "OTP sent successfully.");

      setSelectedStudents([]);

      fetchStudents();
    } catch (err) {
      console.error(err);

      toast.error("Unable to send OTP.");
    } finally {
      setProcessing(false);
    }
  };

  const handleBlock = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student.");
      return;
    }

    if (!window.confirm("Block selected students?")) {
      return;
    }

    try {
      setProcessing(true);

      const data = await blockStudents(assessment.id, selectedStudents);

      toast.success(data.message || "Students blocked.");

      setSelectedStudents([]);

      fetchStudents();
    } catch (err) {
      console.error(err);

      toast.error("Unable to block students.");
    } finally {
      setProcessing(false);
    }
  };

  const handleUnblock = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student.");
      return;
    }

    try {
      setProcessing(true);

      const data = await unblockStudents(assessment.id, selectedStudents);

      toast.success(data.message || "Students unblocked.");

      setSelectedStudents([]);

      fetchStudents();
    } catch (err) {
      console.error(err);

      toast.error("Unable to unblock students.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student.");
      return;
    }

    if (
      !window.confirm("Delete selected students? This action cannot be undone.")
    ) {
      return;
    }

    try {
      setProcessing(true);

      const data = await deleteStudents(assessment.id, selectedStudents);

      toast.success(data.message || "Students deleted.");

      setSelectedStudents([]);

      fetchStudents();
    } catch (err) {
      console.error(err);

      toast.error("Unable to delete students.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center">Loading Students...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Allowed Students</h2>

          <p className="mt-1 text-gray-500">
            Manage students allowed to take this assessment.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="rounded-xl border px-5 py-3">Import CSV</button>

          <button className="rounded-xl border px-5 py-3">Export</button>

          <button className="rounded-xl bg-[#00629B] px-5 py-3 text-white">
            + Add Student
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border p-5">
          <p className="text-gray-500">Allowed</p>

          <h2 className="mt-2 text-3xl font-bold">{stats.allowed}</h2>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-gray-500">Blocked</p>

          <h2 className="mt-2 text-3xl font-bold text-red-600">
            {stats.blocked}
          </h2>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-gray-500">Logged In</p>

          <h2 className="mt-2 text-3xl font-bold text-blue-600">
            {stats.loggedIn}
          </h2>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-gray-500">Started</p>

          <h2 className="mt-2 text-3xl font-bold text-blue-600">
            {stats.started}
          </h2>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-gray-500">Submitted</p>

          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {stats.submitted}
          </h2>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-gray-500">Not Started</p>

          <h2 className="mt-2 text-3xl font-bold text-gray-600">
            {stats.notStarted}
          </h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Student..."
          className="rounded-xl border p-3"
        />

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option value="all">All Departments</option>
          <option value="ECE">ECE</option>
          <option value="CSE">CSE</option>
          <option value="IT">IT</option>
          <option value="EEE">EEE</option>
          <option value="MECH">MECH</option>
          <option value="CIVIL">CIVIL</option>
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option value="all">All Years</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>

        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option value="all">All Sections</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>
      </div>

      {selectedStudents.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-blue-50 p-4">
          <div className="font-semibold text-blue-700">
            <p className="font-semibold">
              {selectedStudents.length}
              of
              {filteredStudents.length}
              students selected
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              disabled={processing}
              onClick={handleSendOtp}
              className="rounded-xl bg-green-600 px-5 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send OTP
            </button>

            <button
              disabled={processing}
              onClick={handleBlock}
              className="rounded-xl bg-green-600 px-5 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Block
            </button>

            <button
              disabled={processing}
              onClick={handleUnblock}
              className="rounded-xl bg-green-600 px-5 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Unblock
            </button>

            <button
              disabled={processing}
              onClick={handleDelete}
              className="rounded-xl bg-red-600 px-5 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">
                <input
                  type="checkbox"
                  checked={
                    filteredStudents.length > 0 &&
                    filteredStudents.every((student) =>
                      selectedStudents.includes(student.id),
                    )
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStudents((prev) => [
                        ...new Set([
                          ...prev,
                          ...filteredStudents.map((student) => student.id),
                        ]),
                      ]);
                    } else {
  setSelectedStudents((prev) =>
    prev.filter(
      (id) => !filteredStudents.some((student) => student.id === id),
    ),
  );
}
                  }}
                />
              </th>

              <th className="p-4 text-left">Roll No</th>

              <th className="p-4 text-left">Name</th>

              <th className="p-4 text-left">Department</th>

              <th className="p-4 text-left">Year</th>

              <th className="p-4 text-left">Section</th>

              <th className="p-4 text-left">Status</th>

              <th className="p-4 text-left">OTP</th>

              <th className="p-4 text-left">Login</th>

              <th className="p-4 text-left">Attempt</th>

              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} className="border-t">
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudents((prev) =>
                          prev.includes(student.id)
                            ? prev
                            : [...prev, student.id],
                        );
                      } else {
                        setSelectedStudents(
                          selectedStudents.filter((id) => id !== student.id),
                        );
                      }
                    }}
                  />
                </td>

                <td className="p-4">{student.roll_no}</td>

                <td className="p-4">{student.name}</td>

                <td className="p-4">{student.department}</td>

                <td className="p-4">{student.year}</td>

                <td className="p-4">{student.section}</td>

                <td className="p-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      student.status === "allowed"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {student.status}
                  </span>
                </td>

                <td className="p-4">
                  <span
                    className={
                      student.otp_sent ? "text-green-600" : "text-gray-400"
                    }
                  >
                    {student.otp_sent ? "Sent" : "Not Sent"}
                  </span>
                </td>

                <td className="p-4">
                  <span
                    className={
                      student.logged_in ? "text-green-600" : "text-gray-400"
                    }
                  >
                    {student.logged_in ? "Logged In" : "Not Logged In"}
                  </span>
                </td>

                <td className="p-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      student.submitted
                        ? "bg-green-100 text-green-700"
                        : student.attempt_started
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {student.submitted
                      ? "Submitted"
                      : student.attempt_started
                        ? "In Progress"
                        : "Not Started"}
                  </span>
                </td>

                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedStudent(student);

                        setDrawerOpen(true);
                      }}
                      className="rounded border px-3 py-1"
                    >
                      View
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          const data = await sendBulkOtp(assessment.id, [
                            student.id,
                          ]);

                          toast.success(
                            data.message || "OTP sent successfully.",
                          );

                          fetchStudents();
                        } catch (err) {
                          console.error(err);

                          toast.error("Unable to send OTP.");
                        }
                      }}
                      className="rounded border px-3 py-1 text-blue-600"
                    >
                      Send OTP
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          if (student.status === "blocked") {
                            const data = await unblockStudents(assessment.id, [
                              student.id,
                            ]);

                            toast.success(data.message || "Student unblocked.");
                          } else {
                            if (!window.confirm("Block this student?")) {
                              return;
                            }

                            const data = await blockStudents(assessment.id, [
                              student.id,
                            ]);

                            toast.success(data.message || "Student blocked.");
                          }

                          fetchStudents();
                        } catch (err) {
                          console.error(err);

                          toast.error("Operation failed.");
                        }
                      }}
                      className={`rounded border px-3 py-1 ${
                        student.status === "blocked"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {student.status === "blocked" ? "Unblock" : "Block"}
                    </button>

                    <button
                      disabled={student.logged_in}
                      onClick={async () => {
                        if (!window.confirm("Delete this student?")) {
                          return;
                        }

                        try {
                          const data = await deleteStudents(assessment.id, [
                            student.id,
                          ]);

                          toast.success(data.message || "Student deleted.");

                          fetchStudents();
                        } catch (err) {
                          console.error(err);

                          toast.error("Unable to delete student.");
                        }
                      }}
                      className="rounded border px-3 py-1 text-red-600 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <StudentDetailsDrawer
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
  );
}
