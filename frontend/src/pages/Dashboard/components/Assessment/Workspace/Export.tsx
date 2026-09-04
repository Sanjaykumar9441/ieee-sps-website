import { useState } from "react";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  ListOrdered,
  Table2,
} from "lucide-react";
import toast from "react-hot-toast";
import { downloadAssessmentExport, getLeaderboard } from "../assessmentApi";
import type { Assessment } from "../AssessmentCard";

const csvCell = (value: unknown): string =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const downloadText = (filename: string, text: string) => {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

type Mode = "INDIVIDUAL_STUDENTS" | "STUDENT_TEAMS" | "TEAM";

type LeaderboardRow = {
  rank: number;
  name?: string;
  rollNo?: string | null;
  email?: string;
  department?: string;
  branch?: string;
  teamId?: string | null;
  teamName?: string | null;
  members?: Array<{
    name: string;
    roll_no: string;
    email: string;
    branch?: string | null;
  }>;
};

export default function ExportTab({ assessment }: { assessment: Assessment }) {
  const [busy, setBusy] = useState<string | null>(null);
  const mode = (assessment.participation_mode || "INDIVIDUAL_STUDENTS") as Mode;

  const modeLabel =
    mode === "STUDENT_TEAMS"
      ? "Student Teams"
      : mode === "TEAM"
        ? "Team"
        : "Individual Students";

  const download = async (format: "excel" | "pdf" | "csv") => {
    try {
      setBusy(format);
      await downloadAssessmentExport(assessment.id, format);
      toast.success(`${format.toUpperCase()} report downloaded.`);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          `Unable to download ${format.toUpperCase()} report.`,
      );
    } finally {
      setBusy(null);
    }
  };

  const downloadRound2 = async () => {
    try {
      setBusy("round2");
      const leaderboard: LeaderboardRow[] = await getLeaderboard(assessment.id);

      if (!leaderboard.length) {
        toast.error("No submitted participants are available.");
        return;
      }

      let headers: string[];
      let rows: unknown[][];

      if (mode === "STUDENT_TEAMS") {
        headers = [
          "Team Name",
          "Member Name",
          "Roll Number",
          "Email",
          "Branch",
        ];
        rows = leaderboard.flatMap((team) =>
          (team.members || []).map((member) => [
            team.teamName || "",
            member.name,
            member.roll_no,
            member.email,
            member.branch || team.department || team.branch || "",
          ]),
        );
      } else if (mode === "TEAM") {
        headers = ["Team Name", "Email", "Branch"];
        rows = leaderboard.map((team) => [
          team.teamName || team.name || "",
          team.email || "",
          team.department || team.branch || "",
        ]);
      } else {
        headers = ["Name", "Roll No", "Email", "Department"];
        rows = leaderboard.map((student) => [
          student.name || "",
          student.rollNo || "",
          student.email || "",
          student.department || student.branch || "",
        ]);
      }

      if (!rows.length) {
        toast.error(
          mode === "STUDENT_TEAMS"
            ? "No team members are available for export."
            : "No participants are available for export.",
        );
        return;
      }

      const csv = [
        headers.map(csvCell).join(","),
        ...rows.map((row) => row.map(csvCell).join(",")),
      ].join("\n");

      downloadText(
        `${(assessment.title || "assessment").replace(/[^a-z0-9_-]+/gi, "_")}-round2-${mode.toLowerCase()}.csv`,
        csv,
      );

      toast.success(
        mode === "STUDENT_TEAMS"
          ? `${rows.length} team members exported in leaderboard order.`
          : `${rows.length} ${mode === "TEAM" ? "teams" : "students"} exported in leaderboard order.`,
      );
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          "Unable to export Round 2 participant CSV.",
      );
    } finally {
      setBusy(null);
    }
  };

  const cards = [
    {
      format: "excel" as const,
      title: "Premium Excel Workbook",
      text: `Results, summary, leaderboard and ${modeLabel.toLowerCase()} details.`,
      icon: FileSpreadsheet,
    },
    {
      format: "pdf" as const,
      title: "Premium PDF Report",
      text: `Branded ${modeLabel.toLowerCase()} summary, performance statistics and results.`,
      icon: FileText,
    },
    {
      format: "csv" as const,
      title: "Raw CSV Data",
      text: `Flat ${modeLabel.toLowerCase()} result data for spreadsheet processing.`,
      icon: Table2,
    },
  ];

  const round2Text =
    mode === "STUDENT_TEAMS"
      ? "Exports every team member with Team Name, Name, Roll No, Email and Branch."
      : mode === "TEAM"
        ? "Exports Team Name, Email and Branch for each team."
        : "Exports Name, Roll No, Email and Department for each student.";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-blue-50 p-3 text-[#00629B]">
            <BarChart3 size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Export Centre</h2>
            <p className="mt-1 text-sm text-slate-500">
              {modeLabel} assessment exports. The downloaded reports use the
              correct participant structure for this assessment.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <strong>Participation mode:</strong> {modeLabel}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {cards.map(({ format, title, text, icon: Icon }) => (
          <button
            key={format}
            type="button"
            disabled={busy !== null}
            onClick={() => void download(format)}
            className="group rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                <Icon size={22} />
              </div>
              <Download size={18} className="text-slate-400" />
            </div>
            <h3 className="mt-5 font-bold text-slate-900">
              {busy === format ? "Preparing..." : title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
          </button>
        ))}

        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void downloadRound2()}
          className="group rounded-2xl border border-emerald-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <ListOrdered size={22} />
            </div>
            <Download size={18} className="text-slate-400" />
          </div>
          <h3 className="mt-5 font-bold text-slate-900">
            {busy === "round2" ? "Preparing..." : "Round 2 Student CSV"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {round2Text} The file is ordered by leaderboard rank.
          </p>
        </button>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-900">
        <strong>Round 2:</strong> The downloaded file matches the importer
        structure for the selected participation mode, so it can be uploaded
        directly to another assessment configured with the same mode.
      </div>
    </div>
  );
}
