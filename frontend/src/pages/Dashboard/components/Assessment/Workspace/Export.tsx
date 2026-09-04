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

const csvCell = (value: any) => `"${String(value ?? "").replace(/"/g, '""')}"`;
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

export default function ExportTab({ assessment }: { assessment: Assessment }) {
  const [busy, setBusy] = useState<string | null>(null);
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
      const leaderboard = await getLeaderboard(assessment.id);
      const rows = (leaderboard || []).map((s: any) => ({
        rank: s.rank,
        name: s.teamName || s.name || "",
        rollNo: s.teamName ? "" : s.rollNo || "",
        email: s.email || "",
        department: s.department || s.branch || "",
      }));
      if (!rows.length) {
        toast.error("No submitted students are available.");
        return;
      }
      const headers =
        assessment.participation_mode === "INDIVIDUAL_STUDENTS"
          ? ["Rank", "Name", "Roll No", "Email", "Department"]
          : ["Rank", "Team Name", "Email", "Branch", "Members"];
      const csv = [
        headers,
        ...rows.map((r) =>
          assessment.participation_mode === "INDIVIDUAL_STUDENTS"
            ? [r.rank, r.name, r.rollNo, r.email, r.department]
            : [r.rank, r.name, r.email, r.department, ""],
        ),
      ]
        .map((r) => r.map(csvCell).join(","))
        .join("\n");
      downloadText(
        `${(assessment.title || "assessment").replace(/[^a-z0-9_-]+/gi, "_")}-round2-students.csv`,
        csv,
      );
      toast.success(`${rows.length} students exported in leaderboard order.`);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          "Unable to export Round 2 student CSV.",
      );
    } finally {
      setBusy(null);
    }
  };
  const cards = [
    {
      format: "excel" as const,
      title: "Premium Excel Workbook",
      text: "Results, summary, leaderboard and detailed performance data.",
      icon: FileSpreadsheet,
    },
    {
      format: "pdf" as const,
      title: "Premium PDF Report",
      text: "Branded summary, performance statistics and results.",
      icon: FileText,
    },
    {
      format: "csv" as const,
      title: "Raw CSV Data",
      text: "Flat result data for spreadsheet processing.",
      icon: Table2,
    },
  ];
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
              Download assessment reports or prepare a student list for the next
              quiz round.
            </p>
          </div>
        </div>
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
            For individual assessments: Name, Roll No, Email and Department. For
            team assessments: Team Name, Email and Branch. Ordered from rank 1
            downward.
          </p>
        </button>
      </div>
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-900">
        <strong>Round 2:</strong> The downloaded student CSV uses the same
        columns accepted by the student importer, so it can be uploaded directly
        to another assessment.
      </div>
    </div>
  );
}
