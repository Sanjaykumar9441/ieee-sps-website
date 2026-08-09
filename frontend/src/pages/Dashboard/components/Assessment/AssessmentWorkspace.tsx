import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { socket } from "../../../../lib/socket";

import { Assessment } from "./AssessmentCard";

import Overview from "../Assessment/Workspace/Overview";
import QuestionBanks from "../Assessment/Workspace/QuestionBanks/QuestionBanks";
import Students from "../Assessment/Workspace/Students";
import LiveMonitor from "../Assessment/Workspace/LiveMonitor";
import Leaderboard from "../Assessment/Workspace/Leaderboard";
import Analytics from "../Assessment/Workspace/Analytics";
//import Export from "./Export";
import Settings from "../Assessment/Workspace/Settings";

interface Props {
  assessment: Assessment;
  onClose: () => void;
}

type WorkspaceTab =
  | "overview"
  | "questionBanks"
  | "students"
  | "live"
  | "leaderboard"
  | "analytics"
  | "export"
  | "settings";

const tabs: WorkspaceTab[] = [
  "overview",
  "questionBanks",
  "students",
  "live",
  "leaderboard",
  "analytics",
  //"export",
  "settings",
];

export default function AssessmentWorkspace({ assessment, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");

  useEffect(() => {
    socket.emit("joinAssessmentRoom", assessment.id);

    return () => {
      socket.emit("leaveAssessmentRoom", assessment.id);
    };
  }, [assessment.id]);

  return (
    <div className="mt-8 rounded-2xl border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-6">
        <div>
          <h2 className="text-2xl font-bold">{assessment.title}</h2>
          <p className="mt-1 text-gray-500">Assessment Workspace</p>
        </div>

        <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100">
          <X size={22} />
        </button>
      </div>

      <div>
        {/* Tabs */}
        <div className="border-b">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 whitespace-nowrap transition ${
                  activeTab === tab
                    ? "border-b-2 border-[#00629B] text-[#00629B] font-semibold"
                    : "text-gray-500"
                }`}
              >
                {tab === "questionBanks"
                  ? "Question Banks"
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === "overview" && (
            <Overview assessment={assessment} onNavigate={setActiveTab} />
          )}

          {activeTab === "questionBanks" && (
            <QuestionBanks assessment={assessment} />
          )}

          {activeTab === "students" && <Students assessment={assessment} />}

          {activeTab === "live" && <LiveMonitor assessment={assessment} />}

          {activeTab === "leaderboard" && (
            <Leaderboard assessment={assessment} />
          )}

          {activeTab === "analytics" && <Analytics assessment={assessment} />}

          {/* activeTab === "export" && <Export assessment={assessment} /> */}

          {activeTab === "settings" && <Settings assessment={assessment} />}
        </div>
      </div>
    </div>
  );
}
