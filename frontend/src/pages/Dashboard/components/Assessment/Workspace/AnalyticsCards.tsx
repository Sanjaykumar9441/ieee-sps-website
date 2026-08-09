import {
  Users,
  ClipboardCheck,
  Activity,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

import { AnalyticsData } from "./Analytics";

interface Props {
  analytics: AnalyticsData;
}

export default function AnalyticsCards({ analytics }: Props) {
  const cards = [
    {
      title: "Participants",
      value: analytics.participants,
      description: "Registered Students",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },

    {
      title: "Submitted",
      value: analytics.submitted,
      description: "Completed Assessments",
      icon: ClipboardCheck,
      color: "text-green-600",
      bg: "bg-green-50",
    },

    {
      title: "Running",
      value: analytics.running,
      description: "Currently Active",
      icon: Activity,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },

    {
      title: "Average Score",
      value: analytics.averageScore.toFixed(2),
      description: "Overall Performance",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },

    {
      title: "Highest Score",
      value: analytics.highestScore.toFixed(2),
      description: "Top Performer",
      icon: Award,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },

    {
      title: "Lowest Score",
      value: analytics.lowestScore.toFixed(2),
      description: "Needs Improvement",
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },

    {
      title: "Pass %",
      value: `${analytics.passPercentage}%`,
      description: "Successful Students",
      icon: CheckCircle,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },

    {
      title: "Average Time",
      value: `${analytics.averageTime} mins`,
      description: "Submission Duration",
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-2xl border bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>

                <h2 className={`mt-3 text-3xl font-bold ${card.color}`}>
                  {card.value}
                </h2>

                <p className="mt-2 text-sm text-gray-400">{card.description}</p>
              </div>

              <div className={`rounded-xl p-3 ${card.bg}`}>
                <Icon size={26} className={card.color} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
