import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import LiveUpdatesToggle from "./LiveUpdatesToggle";
import { BarChart3 } from "lucide-react";

import { socket } from "../../../../../lib/socket";

import { Assessment } from "../../Assessment/AssessmentCard";

import AnalyticsCards from "../Workspace/AnalyticsCards";
import AnalyticsFilters from "../Workspace/AnalyticsFilters";
import { getDashboardAnalytics } from "../../Assessment/assessmentApi";

interface Props {
  assessment: Assessment;
}

export interface AnalyticsData {
  participants: number;

  submitted: number;

  running: number;

  averageScore: number;

  highestScore: number;

  lowestScore: number;

  passPercentage: number;

  averageTime: number;

  assessmentSummary: {
    totalQuestions: number;

    duration: number;

    maximumMarks: number;

    passingMarks: number;
  };
  departmentPerformance: {
    department: string;

    participants: number;

    averageScore: number;

    highestScore: number;

    passPercentage: number;
  }[];
  questionAnalysis: {
    questionNumber: number;

    questionText: string;

    correctPercentage: number;

    wrongPercentage: number;

    skippedPercentage: number;
  }[];
  topPerformers: {
    studentId: string;
    name: string;
    rollNo: string;
    department: string;
    score: number;
    percentage: number;
    timeTaken: number;
  }[];

  bottomPerformers: {
    studentId: string;
    name: string;
    rollNo: string;
    department: string;
    score: number;
    percentage: number;
    timeTaken: number;
  }[];

  fastestSubmissions: {
    studentId: string;
    name: string;
    rollNo: string;
    timeTaken: number;
    score: number;
  }[];

  slowestSubmissions: {
    studentId: string;
    name: string;
    rollNo: string;
    timeTaken: number;
    score: number;
  }[];
  completion: {
    allowed: number;
    loggedIn: number;
    started: number;
    submitted: number;
    pending: number;
  };
  integrity: {
    warnings: number;
    forceSubmitted: number;
    disqualified: number;
    tabSwitches: number;
    windowBlur: number;
  };
  liveActivity: {
    online: number;
    taking: number;
  };
  assessmentStatus: {
    status: string;
    duration: number;
    questions: number;
    studentsOnline: number;
    lastSubmission: string;
  };
}

export default function Analytics({ assessment }: Props) {
  const [loading, setLoading] = useState(() => localStorage.getItem(`assessment_live_updates:${assessment.id}`) !== "false");

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    participants: 0,
    submitted: 0,
    running: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    passPercentage: 0,
    averageTime: 0,
    assessmentSummary: {
      totalQuestions: 0,
      duration: 0,
      maximumMarks: 0,
      passingMarks: 0,
    },
    departmentPerformance: [],
    questionAnalysis: [],
    topPerformers: [],
    bottomPerformers: [],
    fastestSubmissions: [],
    slowestSubmissions: [],
    completion: { allowed: 0, loggedIn: 0, started: 0, submitted: 0, pending: 0 },
    integrity: { warnings: 0, forceSubmitted: 0, disqualified: 0, tabSwitches: 0, windowBlur: 0 },
    liveActivity: { online: 0, taking: 0 },
    assessmentStatus: { status: "Inactive", duration: 0, questions: 0, studentsOnline: 0, lastSubmission: "-" },
  });

  const [department, setDepartment] = useState("all");
  const [liveUpdates, setLiveUpdates] = useState(assessment.live_updates_enabled !== false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getDashboardAnalytics(assessment.id, { department });
      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      toast.error("Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.assessmentId === assessment.id) setLiveUpdates(Boolean(detail.enabled));
    };
    window.addEventListener("assessment-live-updates-changed", handler);
    return () => window.removeEventListener("assessment-live-updates-changed", handler);
  }, [assessment.id]);

  useEffect(() => {
    void fetchAnalytics();

    if (!liveUpdates) return;

    socket.emit("joinAssessmentRoom", assessment.id);

    const refresh = () => {
      void fetchAnalytics();
    };

    const handleDashboardAnalytics = (data: AnalyticsData) => {
      setAnalytics(data);
      setLastUpdated(new Date());
    };

    socket.on("dashboardRefresh", refresh);
    socket.on("dashboardAnalytics", handleDashboardAnalytics);

    return () => {
      socket.off("dashboardRefresh", refresh);
      socket.off("dashboardAnalytics", handleDashboardAnalytics);
      socket.emit("leaveAssessmentRoom", assessment.id);
    };
  }, [assessment.id, department, liveUpdates]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-72 animate-pulse rounded-xl bg-gray-200" />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl bg-gray-200"
            />
          ))}
        </div>

        <div className="h-56 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}

      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-3xl font-bold">
            <BarChart3 className="text-[#00629B]" size={30} />
            Assessment Analytics
          </h2>

          <p className="mt-2 text-gray-500">
            Comprehensive insights into assessment performance.
          </p>
        </div>

        <div className="space-y-2">
          <LiveUpdatesToggle assessment={assessment} value={liveUpdates} onChange={setLiveUpdates} />
          <p className="text-xs text-slate-500">Last updated {lastUpdated.toLocaleTimeString()}</p>
        </div>
      </div>
      <AnalyticsFilters
        department={department}
        setDepartment={setDepartment}
        onRefresh={() => void fetchAnalytics()}
        onReset={() => {
          setDepartment("all");
        }}
      />
      <AnalyticsCards analytics={analytics} />

      {/* Assessment Summary */}

      <div className="rounded-2xl border bg-white p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Assessment Summary</h2>

            <p className="mt-1 text-gray-500">
              Basic information about this assessment.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border p-5">
            <p className="text-sm text-gray-500">Total Questions</p>

            <h3 className="mt-2 text-3xl font-bold text-[#00629B]">
              {analytics.assessmentSummary.totalQuestions}
            </h3>
          </div>

          <div className="rounded-xl border p-5">
            <p className="text-sm text-gray-500">Duration</p>

            <h3 className="mt-2 text-3xl font-bold text-green-600">
              {analytics.assessmentSummary.duration} mins
            </h3>
          </div>

          <div className="rounded-xl border p-5">
            <p className="text-sm text-gray-500">Maximum Marks</p>

            <h3 className="mt-2 text-3xl font-bold text-purple-600">
              {analytics.assessmentSummary.maximumMarks}
            </h3>
          </div>

          <div className="rounded-xl border p-5">
            <p className="text-sm text-gray-500">Passing Marks</p>

            <h3 className="mt-2 text-3xl font-bold text-orange-600">
              {analytics.assessmentSummary.passingMarks}
            </h3>
          </div>


          <div className="rounded-xl border p-5">
            <p className="text-sm text-gray-500">Total Attempts</p>

            <h3 className="mt-2 text-3xl font-bold text-red-600">
              {analytics.completion.started}
            </h3>
          </div>
        </div>
      </div>

      {/* Department Performance */}

      <div className="rounded-2xl border bg-white p-8">
        <div>
          <h2 className="text-2xl font-bold">Department Performance</h2>
          <p className="mt-1 text-gray-500">Performance comparison across departments.</p>
        </div>
        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-4 text-left">Department</th>
                <th className="p-4 text-center">Participants</th>
                <th className="p-4 text-center">Average Score</th>
                <th className="p-4 text-center">Highest Score</th>
                <th className="p-4 text-center">Pass %</th>
              </tr>
            </thead>
            <tbody>
              {analytics.departmentPerformance.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-500">Department analytics not available.</td></tr>
              ) : analytics.departmentPerformance.map((dept) => (
                <tr key={dept.department} className="border-b transition hover:bg-gray-50">
                  <td className="p-4 font-semibold">{dept.department}</td>
                  <td className="p-4 text-center">{dept.participants}</td>
                  <td className="p-4 text-center font-semibold">{dept.averageScore}</td>
                  <td className="p-4 text-center font-semibold">{dept.highestScore}</td>
                  <td className="p-4 text-center">{dept.passPercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Question Analysis */}

      <div className="rounded-2xl border bg-white p-8">
        <div>
          <h2 className="text-2xl font-bold">Question Analysis</h2>
          <p className="mt-1 text-gray-500">Accuracy and response status for each MCQ.</p>
        </div>
        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-4 text-left">Question</th>
                <th className="p-4 text-center">Correct %</th>
                <th className="p-4 text-center">Wrong %</th>
                <th className="p-4 text-center">Skipped %</th>
              </tr>
            </thead>
            <tbody>
              {analytics.questionAnalysis.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-gray-500">Question analytics not available.</td></tr>
              ) : analytics.questionAnalysis.map((question) => (
                <tr key={question.questionNumber} className="border-b">
                  <td className="p-4">
                    <p className="font-semibold">Question {question.questionNumber}</p>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">{question.questionText}</p>
                  </td>
                  <td className="p-4 text-center font-semibold text-green-600">{question.correctPercentage}%</td>
                  <td className="p-4 text-center font-semibold text-red-600">{question.wrongPercentage}%</td>
                  <td className="p-4 text-center font-semibold text-yellow-600">{question.skippedPercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Top Performers */}

        <div className="rounded-2xl border bg-white p-8">
          <h2 className="text-2xl font-bold">🏆 Top Performers</h2>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left">Rank</th>

                  <th className="p-4 text-left">Student</th>

                  <th className="p-4 text-left">Roll No</th>

                  <th className="p-4 text-left">Department</th>

                  <th className="p-4 text-center">Score</th>

                  <th className="p-4 text-center">Accuracy</th>

                  <th className="p-4 text-center">Time</th>
                </tr>
              </thead>

              <tbody>
                {analytics.topPerformers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      No top performers available.
                    </td>
                  </tr>
                ) : (
                  analytics.topPerformers.map((student, index) => (
                    <tr
                      key={student.studentId}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-4">
                        {index === 0
                          ? "🥇"
                          : index === 1
                            ? "🥈"
                            : index === 2
                              ? "🥉"
                              : `#${index + 1}`}
                      </td>

                      <td className="p-4 font-semibold">{student.name}</td>

                      <td className="p-4">{student.rollNo}</td>

                      <td className="p-4">{student.department}</td>

                      <td className="p-4 text-center font-semibold text-blue-600">
                        {student.score}
                      </td>

                      <td className="p-4 text-center">{student.percentage}%</td>

                      <td className="p-4 text-center">
                        {Math.floor(student.timeTaken / 60)}m{" "}
                        {student.timeTaken % 60}s
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Needs Attention */}

        <div className="rounded-2xl border bg-white p-8">
          <h2 className="text-2xl font-bold">📉 Needs Attention</h2>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left">Rank</th>

                  <th className="p-4 text-left">Student</th>

                  <th className="p-4 text-left">Roll No</th>

                  <th className="p-4 text-left">Department</th>

                  <th className="p-4 text-center">Score</th>

                  <th className="p-4 text-center">Accuracy</th>

                  <th className="p-4 text-center">Time</th>
                </tr>
              </thead>

              <tbody>
                {analytics.bottomPerformers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  analytics.bottomPerformers.map((student, index) => (
                    <tr
                      key={student.studentId}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-4">#{index + 1}</td>

                      <td className="p-4 font-semibold">{student.name}</td>

                      <td className="p-4">{student.rollNo}</td>

                      <td className="p-4">{student.department}</td>

                      <td className="p-4 text-center font-semibold text-red-600">
                        {student.score}
                      </td>

                      <td className="p-4 text-center">{student.percentage}%</td>

                      <td className="p-4 text-center">
                        {Math.floor(student.timeTaken / 60)}m{" "}
                        {student.timeTaken % 60}s
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fastest Submissions */}

        <div className="rounded-2xl border bg-white p-8">
          <h2 className="text-2xl font-bold">⚡ Fastest Submissions</h2>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left">Student</th>

                  <th className="p-4 text-left">Roll No</th>

                  <th className="p-4 text-center">Time</th>

                  <th className="p-4 text-center">Score</th>
                </tr>
              </thead>

              <tbody>
                {analytics.fastestSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-500">
                      No submissions available.
                    </td>
                  </tr>
                ) : (
                  analytics.fastestSubmissions.map((student) => (
                    <tr
                      key={student.studentId}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-4 font-semibold">{student.name}</td>

                      <td className="p-4">{student.rollNo}</td>

                      <td className="p-4 text-center">
                        {Math.floor(student.timeTaken / 60)}m{" "}
                        {student.timeTaken % 60}s
                      </td>

                      <td className="p-4 text-center font-semibold text-green-600">
                        {student.score}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slowest Submissions */}

        <div className="rounded-2xl border bg-white p-8">
          <h2 className="text-2xl font-bold">🐢 Slowest Submissions</h2>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left">Student</th>

                  <th className="p-4 text-left">Roll No</th>

                  <th className="p-4 text-center">Time</th>

                  <th className="p-4 text-center">Score</th>
                </tr>
              </thead>

              <tbody>
                {analytics.slowestSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-500">
                      No submissions available.
                    </td>
                  </tr>
                ) : (
                  analytics.slowestSubmissions.map((student) => (
                    <tr
                      key={student.studentId}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-4 font-semibold">{student.name}</td>

                      <td className="p-4">{student.rollNo}</td>

                      <td className="p-4 text-center">
                        {Math.floor(student.timeTaken / 60)}m{" "}
                        {student.timeTaken % 60}s
                      </td>

                      <td className="p-4 text-center font-semibold text-orange-600">
                        {student.score}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assessment Completion */}

      <div className="rounded-2xl border bg-white p-8">
        <div>
          <h2 className="text-2xl font-bold">Assessment Completion</h2>

          <p className="mt-1 text-gray-500">
            Live assessment progress of all eligible students.
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border p-5 text-center">
            <p className="text-sm text-gray-500">Allowed</p>

            <h3 className="mt-2 text-3xl font-bold text-blue-600">
              {analytics.completion.allowed}
            </h3>
          </div>

          <div className="rounded-xl border p-5 text-center">
            <p className="text-sm text-gray-500">Logged In</p>

            <h3 className="mt-2 text-3xl font-bold text-cyan-600">
              {analytics.completion.loggedIn}
            </h3>
          </div>

          <div className="rounded-xl border p-5 text-center">
            <p className="text-sm text-gray-500">Started</p>

            <h3 className="mt-2 text-3xl font-bold text-yellow-600">
              {analytics.completion.started}
            </h3>
          </div>

          <div className="rounded-xl border p-5 text-center">
            <p className="text-sm text-gray-500">Submitted</p>

            <h3 className="mt-2 text-3xl font-bold text-green-600">
              {analytics.completion.submitted}
            </h3>
          </div>

          <div className="rounded-xl border p-5 text-center">
            <p className="text-sm text-gray-500">Pending</p>

            <h3 className="mt-2 text-3xl font-bold text-red-600">
              {analytics.completion.pending}
            </h3>
          </div>
        </div>
      </div>

      {/* Assessment Integrity */}

      <div className="rounded-2xl border bg-white p-8">
        <div>
          <h2 className="text-2xl font-bold">Assessment Integrity</h2>

          <p className="mt-1 text-gray-500">
            Anti-cheat monitoring and integrity statistics.
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border p-5 text-center">
            <p className="text-sm text-gray-500">Warnings</p>

            <h3 className="mt-2 text-3xl font-bold text-yellow-600">
              {analytics.integrity.warnings}
            </h3>
          </div>

          <div className="rounded-xl border p-5 text-center">
            <p className="text-sm text-gray-500">Force Submitted</p>

            <h3 className="mt-2 text-3xl font-bold text-red-600">
              {analytics.integrity.forceSubmitted}
            </h3>
          </div>

          <div className="rounded-xl border p-5 text-center">
            <p className="text-sm text-gray-500">Disqualified</p>

            <h3 className="mt-2 text-3xl font-bold text-red-700">
              {analytics.integrity.disqualified}
            </h3>
          </div>

          <div className="rounded-xl border p-5 text-center">
            <p className="text-sm text-gray-500">Tab Switches</p>

            <h3 className="mt-2 text-3xl font-bold text-orange-600">
              {analytics.integrity.tabSwitches}
            </h3>
          </div>

          <div className="rounded-xl border p-5 text-center">
            <p className="text-sm text-gray-500">Window Blur</p>

            <h3 className="mt-2 text-3xl font-bold text-blue-600">
              {analytics.integrity.windowBlur}
            </h3>
          </div>
        </div>
      </div>

      {/* Live Activity */}

      <div className="rounded-2xl border bg-white p-8">
        <div>
          <h2 className="text-2xl font-bold">Live Activity</h2>

          <p className="mt-1 text-gray-500">
            Real-time assessment activity powered by Socket.IO.
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {/* Students Online */}

          <div className="rounded-xl border p-5 text-center">
            <p className="text-sm text-gray-500">Students Online</p>

            <h3 className="mt-2 text-3xl font-bold text-green-600">
              {analytics.liveActivity.online}
            </h3>

            <p className="mt-1 text-sm text-gray-400">
              Active in the last 60 seconds
            </p>
          </div>

          {/* Taking Quiz */}

          <div className="rounded-xl border p-5 text-center">
            <p className="text-sm text-gray-500">Taking Quiz</p>

            <h3 className="mt-2 text-3xl font-bold text-blue-600">
              {analytics.liveActivity.taking}
            </h3>

            <p className="mt-1 text-sm text-gray-400">Currently in progress</p>
          </div>
        </div>
      </div>

      {/* Assessment Status */}

      <div className="rounded-2xl border bg-white p-8">
        <div>
          <h2 className="text-2xl font-bold">Assessment Status</h2>

          <p className="mt-1 text-gray-500">
            Current live status of the assessment.
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-xl border p-5 text-center">
            <p className="text-sm text-gray-500">Status</p>

            <h3
              className={`mt-2 text-2xl font-bold ${
                analytics.assessmentStatus.status === "Active"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {analytics.assessmentStatus.status}
            </h3>
          </div>

          <div className="rounded-xl border p-5 text-center">
            <p className="text-sm text-gray-500">Duration</p>

            <h3 className="mt-2 text-2xl font-bold text-blue-600">
              {analytics.assessmentStatus.duration} mins
            </h3>
          </div>

          <div className="rounded-xl border p-5 text-center">
            <p className="text-sm text-gray-500">Questions</p>

            <h3 className="mt-2 text-2xl font-bold text-purple-600">
              {analytics.assessmentStatus.questions}
            </h3>
          </div>

          <div className="rounded-xl border p-5 text-center">
            <p className="text-sm text-gray-500">Students Online</p>

            <h3 className="mt-2 text-2xl font-bold text-green-600">
              {analytics.assessmentStatus.studentsOnline}
            </h3>
          </div>

          <div className="rounded-xl border p-5 text-center">
            <p className="text-sm text-gray-500">Last Submission</p>

            <h3 className="mt-2 text-lg font-bold text-orange-600">
              {analytics.assessmentStatus.lastSubmission}
            </h3>
          </div>

          <div className="rounded-xl border p-5 text-center">
            <p className="text-sm text-gray-500">Last Updated</p>

            <h3 className="mt-2 text-lg font-bold text-[#00629B]">
              {lastUpdated.toLocaleTimeString()}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
