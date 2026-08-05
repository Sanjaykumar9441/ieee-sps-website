import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { socket } from "../../../../../lib/socket";
import { Assessment } from "../../Assessment/AssessmentCard";
import StudentDetailsDrawer from "./StudentDetailsDrawer";

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

const API = import.meta.env.VITE_API_URL;

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

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const { data } = await axios.get(
        `${API}/api/student-auth/${assessment.id}`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setStudents(data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();

    socket.emit("joinAssessmentRoom", assessment.id);

    socket.on("studentStatusChanged", fetchStudents);

    socket.on("studentLoggedIn", fetchStudents);

    socket.on("studentSubmitted", fetchStudents);

    return () => {
      socket.emit("leaveAssessmentRoom", assessment.id);

      socket.off("studentStatusChanged", fetchStudents);
      socket.off("studentLoggedIn", fetchStudents);
      socket.off("studentSubmitted", fetchStudents);
    };
  }, [assessment.id]);

  const stats = useMemo(() => {
    return {
      allowed: students.filter((s) => s.status === "allowed").length,
      blocked: students.filter((s) => s.status === "blocked").length,
      loggedIn: students.filter((s) => s.logged_in).length,
      submitted: students.filter((s) => s.submitted).length,
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
    try {
      setProcessing(true);

      const token = localStorage.getItem("token");

      const { data } = await axios.post(
        `${API}/api/student-auth/send-bulk-otp`,
        {
          assessmentId: assessment.id,
          studentIds: selectedStudents,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(data.message);

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
    try {
      setProcessing(true);

      const token = localStorage.getItem("token");

      const { data } = await axios.post(
        `${API}/api/student-auth/block`,
        {
          assessmentId: assessment.id,
          studentIds: selectedStudents,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(data.message);

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
    try {
      setProcessing(true);

      const token = localStorage.getItem("token");

      const { data } = await axios.post(
        `${API}/api/student-auth/unblock`,
        {
          assessmentId: assessment.id,
          studentIds: selectedStudents,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(data.message);

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
    if (!window.confirm("Delete selected students?")) {
      return;
    }

    try {
      setProcessing(true);

      const token = localStorage.getItem("token");

      const { data } = await axios.post(
        `${API}/api/student-auth/delete`,
        {
          assessmentId: assessment.id,
          studentIds: selectedStudents,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(data.message);

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
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
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
          <p className="text-gray-500">Submitted</p>

          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {stats.submitted}
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
          <option value="EEE">EEE</option>
          <option value="ME">ME</option>
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
                    selectedStudents.length === filteredStudents.length
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStudents(
                        filteredStudents.map((student) => student.id),
                      );
                    } else {
                      setSelectedStudents([]);
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
                        setSelectedStudents([...selectedStudents, student.id]);
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
                    {student.logged_in ? "Online" : "Offline"}
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

                    <button className="rounded border px-3 py-1">Edit</button>

                    <button
                      disabled={student.status === "blocked"}
                      className="rounded border px-3 py-1 text-red-600"
                    >
                      Block
                    </button>

                    <button
                      disabled={student.logged_in}
                      className="rounded border px-3 py-1 text-red-600"
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
