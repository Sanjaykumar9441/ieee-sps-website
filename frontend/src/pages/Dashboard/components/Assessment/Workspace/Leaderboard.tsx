import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Search, Trophy } from "lucide-react";

import { socket } from "../../../../../lib/socket";
import { Assessment } from "../../Assessment/AssessmentCard";
import LeaderboardStudentDrawer from "./LeaderboardStudentDrawer";
import { getLeaderboard } from "../../Assessment/assessmentApi";

interface Props {
  assessment: Assessment;
}

export interface LeaderboardStudent {
  rank: number;
  attemptId: string;
  studentId: string;
  name: string;
  rollNo: string;
  department: string;
  status: "SUBMITTED";
  score: number;
  correct: number;
  wrong: number;
  unanswered: number;
  percentage: number;
  scorePercentage: number;
  timeTaken: number;
  submittedAt: string | null;
  startedAt: string | null;
}

export default function Leaderboard({ assessment }: Props) {
  const [loading, setLoading] = useState(() => localStorage.getItem(`assessment_live_updates:${assessment.id}`) !== "false");

  const [students, setStudents] = useState<LeaderboardStudent[]>([]);

  const [search, setSearch] = useState("");

  const [selectedStudent, setSelectedStudent] =
    useState<LeaderboardStudent | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [department, setDepartment] = useState("all");

  const [sortBy, setSortBy] = useState("rank");

  const [liveUpdates, setLiveUpdates] = useState(() => localStorage.getItem(`assessment_live_updates:${assessment.id}`) !== "false");

  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await getLeaderboard(assessment.id);

      setStudents(data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);

      toast.error("Unable to load leaderboard.");
    } finally {
      setLoading(false);
    }
  }, [assessment.id]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.assessmentId === assessment.id) setLiveUpdates(Boolean(detail.enabled));
    };
    window.addEventListener("assessment-live-updates-changed", handler);
    return () => window.removeEventListener("assessment-live-updates-changed", handler);
  }, [assessment.id]);

  useEffect(() => {
    void fetchLeaderboard();

    if (!liveUpdates) return;

    socket.emit("joinAssessmentRoom", assessment.id);

    const refreshLeaderboard = () => {
      void fetchLeaderboard();
    };

    socket.on("leaderboardUpdated", refreshLeaderboard);

    return () => {
      socket.off("leaderboardUpdated", refreshLeaderboard);
      socket.emit("leaveAssessmentRoom", assessment.id);
    };
  }, [assessment.id, liveUpdates, fetchLeaderboard]);

  const filteredStudents = useMemo(() => {
    let data = [...students];

    /* ==========================
     Department Filter
  ========================== */

    if (department !== "all") {
      data = data.filter((student) => student.department === department);
    }

    /* ==========================
     Search
  ========================== */

    if (search.trim()) {
      const keyword = search.toLowerCase();

      data = data.filter(
        (student) =>
          student.name.toLowerCase().includes(keyword) ||
          student.rollNo.toLowerCase().includes(keyword),
      );
    }

    /* ==========================
     Sorting
  ========================== */

    switch (sortBy) {
      case "score":
        data.sort((a, b) => b.score - a.score);
        break;

      case "accuracy":
        data.sort((a, b) => b.percentage - a.percentage);
        break;

      case "time":
        data.sort((a, b) => a.timeTaken - b.timeTaken);
        break;

      default:
        data.sort((a, b) => a.rank - b.rank);
    }

    return data;
  }, [students, search, department, sortBy]);

  const filteredStats = useMemo(() => {
    const participants = filteredStudents.length;

    const highest =
      participants > 0 ? Math.max(...filteredStudents.map((s) => s.score)) : 0;

    const average =
      participants > 0
        ? Math.round(
            filteredStudents.reduce((sum, s) => sum + s.score, 0) /
              participants,
          )
        : 0;

    const passingPercentage = assessment.pass_percentage ?? 40;

    const passPercentage =
      participants > 0
        ? Math.round(
            (filteredStudents.filter(
              (s) => s.scorePercentage >= passingPercentage,
            ).length /
              participants) *
              100,
          )
        : 0;

    return {
      participants,
      highest,
      average,
      passPercentage,
    };
  }, [filteredStudents, assessment.pass_percentage]);

  const topStudents = [...filteredStudents]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-72 animate-pulse rounded-xl bg-gray-200" />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl bg-gray-200"
            />
          ))}
        </div>

        <div className="h-96 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-sm text-gray-500">
          Last Updated {lastUpdated.toLocaleTimeString()}
        </p>
        <span className="text-sm font-medium">🔄 Live Updates</span>

        <button
          onClick={() => setLiveUpdates(!liveUpdates)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            liveUpdates
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          {liveUpdates ? "ON" : "OFF"}
        </button>
      </div>
      {/* Header */}

      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-3xl font-bold">
            <Trophy className="text-yellow-500" size={30} />
            Live Leaderboard
          </h2>

          <p className="mt-2 text-gray-500">
            Live rankings of assessment participants.
          </p>
        </div>
      </div>

      {/* Statistics */}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-gray-500">Participants</p>

          <h2 className="mt-3 text-3xl font-bold">
            {filteredStats.participants}
          </h2>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <p className="text-gray-500">Highest Score</p>

          <h2 className="mt-3 text-3xl font-bold text-green-600">
            {filteredStats.highest}
          </h2>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <p className="text-gray-500">Average Score</p>

          <h2 className="mt-3 text-3xl font-bold text-blue-600">
            {filteredStats.average}
          </h2>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <p className="text-gray-500">Pass %</p>

          <h2 className="mt-3 text-3xl font-bold text-emerald-600">
            {filteredStats.passPercentage}%
          </h2>
        </div>
      </div>

      {/* Top 3 */}

      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((index) => {
          const student = topStudents[index];

          if (!student) {
            return (
              <div
                key={index}
                className="rounded-2xl border-2 border-dashed p-8 text-center"
              >
                <div className="text-5xl">🏅</div>

                <p className="mt-4 font-semibold text-gray-500">
                  Waiting for submissions
                </p>
              </div>
            );
          }

          const medals = [
            {
              emoji: "🥇",
              bg: "bg-yellow-50",
              border: "border-yellow-300",
            },
            {
              emoji: "🥈",
              bg: "bg-gray-100",
              border: "border-gray-300",
            },
            {
              emoji: "🥉",
              bg: "bg-orange-50",
              border: "border-orange-300",
            },
          ];

          return (
            <div
              key={student.attemptId}
              className={`rounded-2xl border-2 ${medals[index].border} ${medals[index].bg} p-8 text-center shadow-sm transition hover:shadow-lg`}
            >
              <div className="text-5xl">{medals[index].emoji}</div>

              <h3 className="mt-5 text-xl font-bold">{student.name}</h3>

              <p className="mt-2 text-gray-500">{student.rollNo}</p>

              <div className="mt-6 space-y-2">
                <p className="text-3xl font-bold text-[#00629B]">
                  {student.score}
                </p>

                <p className="text-sm text-gray-500">Score</p>

                <p className="rounded-full bg-green-100 px-4 py-1 text-green-700 inline-block">
                  {student.percentage}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {/* Toolbar */}

      <div className="flex flex-col gap-4 rounded-2xl border bg-white p-5 xl:flex-row xl:items-center xl:justify-between">
        {/* Left */}

        <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* Search */}

          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-3.5 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student..."
              className="w-full rounded-xl border py-3 pl-11 pr-4"
            />
          </div>

          {/* Department */}

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-xl border px-4 py-3"
          >
            <option value="all">All Departments</option>

            <option value="ECE">ECE</option>

            <option value="CSE">CSE</option>

            <option value="IT">IT</option>

            <option value="EEE">EEE</option>

            <option value="MECH">MECH</option>

            <option value="CIVIL">CIVIL</option>
          </select>

          {/* Sort */}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border px-4 py-3"
          >
            <option value="rank">Rank</option>

            <option value="score">Score</option>

            <option value="accuracy">Accuracy</option>

            <option value="time">Time Taken</option>
          </select>
        </div>

        {/* Right */}

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSearch("");
              setDepartment("all");
              setSortBy("rank");
            }}
            className="rounded-xl border px-5 py-3 hover:bg-gray-50"
          >
            Reset Filters
          </button>

        </div>
      </div>

      {/* Leaderboard Table */}

      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Rank</th>

              <th className="p-4 text-left">Student</th>

              <th className="p-4 text-left">Roll No</th>

              <th className="p-4 text-left">Department</th>

              <th className="p-4 text-left">Score</th>

              <th className="p-4 text-left">Correct</th>

              <th className="p-4 text-left">Wrong</th>

              <th className="p-4 text-left">Accuracy</th>

              <th className="p-4 text-left">Time Taken</th>

              <th className="p-4 text-left">Submitted</th>

              <th className="p-4 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-16 text-center">
                  {students.length === 0 ? (
                    <>
                      <div className="text-6xl">🏆</div>

                      <h3 className="mt-4 text-xl font-semibold">
                        No students have submitted yet.
                      </h3>

                      <p className="mt-2 text-gray-500">
                        Leaderboard will appear automatically.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-6xl">🔍</div>

                      <h3 className="mt-4 text-xl font-semibold">
                        No matching students found.
                      </h3>

                      <p className="mt-2 text-gray-500">
                        Try changing your filters.
                      </p>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                const minutes = Math.floor(student.timeTaken / 60);

                const seconds = student.timeTaken % 60;

                return (
                  <tr
                    key={student.attemptId}
                    className="border-t hover:bg-gray-50"
                  >
                    {/* Rank */}

                    <td className="p-4">
                      {student.rank === 1 ? (
                        <span className="rounded-full bg-yellow-100 px-3 py-1 font-semibold text-yellow-700">
                          🥇 #1
                        </span>
                      ) : student.rank === 2 ? (
                        <span className="rounded-full bg-gray-200 px-3 py-1 font-semibold">
                          🥈 #2
                        </span>
                      ) : student.rank === 3 ? (
                        <span className="rounded-full bg-orange-100 px-3 py-1 font-semibold text-orange-700">
                          🥉 #3
                        </span>
                      ) : (
                        <span className="font-semibold">#{student.rank}</span>
                      )}
                    </td>

                    {/* Student */}

                    <td className="p-4">
                      <div>
                        <p className="font-semibold">{student.name}</p>

                        <p className="text-xs text-gray-500">
                          {student.department}
                        </p>
                      </div>
                    </td>

                    {/* Roll */}

                    <td className="p-4">{student.rollNo}</td>

                    {/* Department */}

                    <td className="p-4">{student.department}</td>

                    {/* Score */}

                    <td className="p-4 font-semibold text-[#00629B]">
                      {student.score}
                    </td>

                    {/* Correct */}

                    <td className="p-4 text-green-600 font-medium">
                      {student.correct}
                    </td>

                    {/* Wrong */}

                    <td className="p-4 text-red-600 font-medium">
                      {student.wrong}
                    </td>

                    {/* Accuracy */}

                    <td className="p-4">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        {student.percentage}%
                      </span>
                    </td>

                    {/* Time */}

                    <td className="p-4">
                      {minutes}m {seconds}s
                    </td>

                    {/* Submitted */}

                    <td className="p-4 whitespace-nowrap">
                      {student.submittedAt
                        ? new Date(student.submittedAt).toLocaleTimeString()
                        : "-"}
                    </td>

                    {/* Action */}

                    <td className="p-4">
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setDrawerOpen(true);
                        }}
                        className="rounded-lg border px-4 py-2 transition hover:bg-gray-100"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <LeaderboardStudentDrawer
        open={drawerOpen}
        student={selectedStudent}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedStudent(null);
        }}
      />
    </div>
  );
}
