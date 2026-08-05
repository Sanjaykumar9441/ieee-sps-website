import { useEffect, useState } from "react";
import axios from "axios";
import {
  FileText,
  Users,
  UserCheck,
  Trophy,
  AlertTriangle,
  BarChart3,
  Activity,
} from "lucide-react";

import { socket } from "../../../../../lib/socket";
import { Assessment } from "../../Assessment/AssessmentCard";

const API = import.meta.env.VITE_API_URL;

type WorkspaceTab =
  | "overview"
  | "questionBanks"
  | "students"
  | "live"
  | "leaderboard"
  | "analytics"
  | "export"
  | "settings";

interface Props {
  assessment: Assessment;
  onNavigate: (tab: WorkspaceTab) => void;
}

interface AnalyticsData {
  registered_students: number;
  logged_in_students: number;
  started_students: number;
  submitted_students: number;
  disqualified_students: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  pass_percentage: number;
}

export default function Overview({
  assessment,
  onNavigate,
}: Props) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    registered_students: 0,
    logged_in_students: 0,
    started_students: 0,
    submitted_students: 0,
    disqualified_students: 0,
    average_score: 0,
    highest_score: 0,
    lowest_score: 0,
    pass_percentage: 0,
  });

  const [loading, setLoading] = useState(true);

  const [isLive, setIsLive] = useState(socket.connected);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.get(
        `${API}/api/dashboard-analytics/${assessment.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAnalytics(data.analytics);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    socket.emit("joinAssessmentRoom", assessment.id);

    const handleConnect = () => setIsLive(true);

    const handleDisconnect = () => setIsLive(false);

    const handleAnalytics = (data: AnalyticsData) => {
      setAnalytics(data);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("dashboardAnalyticsUpdated", handleAnalytics);
    socket.on("assessmentSubmitted", fetchAnalytics);
    socket.on("studentProgress", fetchAnalytics);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("dashboardAnalyticsUpdated", handleAnalytics);
      socket.off("assessmentSubmitted", fetchAnalytics);
      socket.off("studentProgress", fetchAnalytics);

      socket.emit("leaveAssessmentRoom", assessment.id);
    };
  }, [assessment.id]);

  const cards = [
    {
      title: "Questions",
      value: assessment.total_questions,
      icon: FileText,
    },
    {
      title: "Registered",
      value: analytics.registered_students,
      icon: Users,
    },
    {
      title: "Logged In",
      value: analytics.logged_in_students,
      icon: UserCheck,
    },
    {
      title: "Submitted",
      value: analytics.submitted_students,
      icon: Trophy,
    },
    {
      title: "Disqualified",
      value: analytics.disqualified_students,
      icon: AlertTriangle,
    },
    {
      title: "Average Score",
      value: `${analytics.average_score}%`,
      icon: BarChart3,
    },
  ];

  if (loading) {
    return (
      <div className="py-20 text-center">
        Loading overview...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Overview</h2>
          <p className="text-gray-500">Assessment summary</p>
        </div>

        <div
          className={`flex items-center gap-2 rounded-full px-4 py-2 ${
            isLive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          <Activity size={16} />
          {isLive ? "LIVE" : "OFFLINE"}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border bg-white p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {card.title}
                  </p>

                  <h3 className="mt-2 text-3xl font-bold">
                    {card.value}
                  </h3>
                </div>

                <div className="rounded-xl bg-blue-50 p-4">
                  <Icon
                    size={26}
                    className="text-[#00629B]"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border bg-white p-6">
        <h3 className="mb-5 text-lg font-semibold">
          Quick Actions
        </h3>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <button
            onClick={() => onNavigate("questionBanks")}
            className="rounded-xl border py-4 hover:bg-slate-50"
          >
            Question Banks
          </button>

          <button
            onClick={() => onNavigate("students")}
            className="rounded-xl border py-4 hover:bg-slate-50"
          >
            Students
          </button>

          <button
            onClick={() => onNavigate("live")}
            className="rounded-xl border py-4 hover:bg-slate-50"
          >
            Live Monitor
          </button>

          <button
            onClick={() => onNavigate("leaderboard")}
            className="rounded-xl border py-4 hover:bg-slate-50"
          >
            Leaderboard
          </button>

          <button
            onClick={() => onNavigate("analytics")}
            className="rounded-xl border py-4 hover:bg-slate-50"
          >
            Analytics
          </button>
        </div>
      </div>
    </div>
  );
}