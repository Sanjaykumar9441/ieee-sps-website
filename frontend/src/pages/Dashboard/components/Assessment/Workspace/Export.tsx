import { useState } from "react";
import { FileSpreadsheet, FileText, Download } from "lucide-react";
import toast from "react-hot-toast";
import { downloadAssessmentExport } from "../assessmentApi";
import { Assessment } from "../AssessmentCard";

export default function ExportTab({ assessment }: { assessment: Assessment }) {\n  const assessmentId = assessment.id;
  const [busy, setBusy] = useState<string | null>(null);

  const download = async (format: "excel" | "pdf" | "csv") => {
    try {
      setBusy(format);
      await downloadAssessmentExport(assessmentId, format);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (error) {
      console.error(error);
      toast.error(`Unable to download ${format.toUpperCase()}`);
    } finally {
      setBusy(null);
    }
  };

  const button = (
    format: "excel" | "pdf" | "csv",
    label: string,
    Icon: any,
  ) => (
    <button
      type="button"
      disabled={busy !== null}
      onClick={() => void download(format)}
      className="flex items-center gap-3 rounded-xl border px-5 py-4 text-left hover:bg-gray-50 disabled:opacity-50"
    >
      <Icon size={20} />
      <span className="flex-1">
        <span className="block font-semibold">{label}</span>
        <span className="text-sm text-gray-500">
          Results, scores, status and submission times
        </span>
      </span>
      <Download size={18} />
    </button>
  );

  return (
    <div className="space-y-4 rounded-2xl border bg-white p-6">
      <h2 className="text-xl font-semibold">Export Results</h2>
      <p className="text-sm text-gray-500">
        Download complete assessment results and monitoring information.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {button("excel", "Excel report", FileSpreadsheet)}
        {button("pdf", "PDF report", FileText)}
        {button("csv", "CSV data", FileText)}
      </div>
    </div>
  );
}
