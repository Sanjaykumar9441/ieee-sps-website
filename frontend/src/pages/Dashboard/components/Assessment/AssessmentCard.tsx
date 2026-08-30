import { Clock, FileText, Edit, Copy, Trash2, LayoutDashboard, Rocket, CopyCheck, CalendarDays } from "lucide-react";

export interface Assessment {
  id: string;
  title: string;
  slug?: string;
  description?: string | null;
  total_questions: number;
  duration_minutes: number;
  marks_per_question?: number;
  negative_marks?: number;
  pass_percentage?: number;
  passing_score?: number;
  is_active: boolean;
  status?: string;
  is_published: boolean;
  created_at: string;
  start_time?: string | null;
  end_time?: string | null;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  random_questions?: boolean;
  allow_resume?: boolean;
  auto_submit?: boolean;
  show_leaderboard?: boolean;
  anti_cheat_enabled?: boolean;
  socket_monitoring?: boolean;
  login_method?: "PASSWORD" | "OTP";
  live_updates_enabled?: boolean;
}

interface Props {
  assessment: Assessment;
  onDashboard: (assessment: Assessment) => void;
  onEdit: (assessment: Assessment) => void;
  onDuplicate: (id: string) => void;
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onDelete: (id: string) => void;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not scheduled" : date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function AssessmentCard({
  assessment,
  onDashboard,
  onEdit,
  onDuplicate,
  onPublish,
  onUnpublish,
  onDelete,
}: Props) {
  const copyId = async () => {
    try { await navigator.clipboard.writeText(assessment.id); } catch { /* clipboard unavailable */ }
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-slate-900">{assessment.title}</h2>
            <p className="mt-1 text-sm text-slate-500">Assessment</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${assessment.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              {assessment.is_active ? "Active" : "Inactive"}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${assessment.is_published ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
              {assessment.is_published ? "Published" : "Draft"}
            </span>
          </div>
        </div>

        {assessment.is_published && (
          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-blue-700">Assessment ID</p>
                <p className="mt-1 truncate font-mono text-sm text-blue-900">{assessment.id}</p>
              </div>
              <button type="button" onClick={copyId} title="Copy assessment ID" className="rounded-lg border border-blue-200 bg-white p-2 text-blue-700 hover:bg-blue-100">
                <CopyCheck size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4">
          <Info icon={<FileText size={18} />} label="Questions" value={assessment.total_questions || 0} />
          <Info icon={<Clock size={18} />} label="Duration" value={`${assessment.duration_minutes || 0} mins`} />
          <Info icon={<CalendarDays size={18} />} label="Starts" value={formatDateTime(assessment.start_time)} />
          <Info icon={<CalendarDays size={18} />} label="Ends" value={formatDateTime(assessment.end_time)} />
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Action onClick={() => onDashboard(assessment)} primary icon={<LayoutDashboard size={17} />}>Dashboard</Action>
          <Action onClick={() => onEdit(assessment)} icon={<Edit size={17} />}>Edit</Action>
          <Action onClick={() => onDuplicate(assessment.id)} icon={<Copy size={17} />}>Duplicate</Action>
          {assessment.is_published
            ? <Action onClick={() => onUnpublish(assessment.id)} icon={<Rocket size={17} />} className="border-orange-300 text-orange-600 hover:bg-orange-50">Unpublish</Action>
            : <Action onClick={() => onPublish(assessment.id)} icon={<Rocket size={17} />}>Publish</Action>}
          <Action onClick={() => onDelete(assessment.id)} icon={<Trash2 size={17} />} className="border-red-300 text-red-600 hover:bg-red-50 sm:col-span-1">Delete</Action>
        </div>
      </div>
    </article>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return <div className="flex min-w-0 items-start gap-3"><span className="mt-0.5 text-slate-500">{icon}</span><div className="min-w-0"><p className="text-xs text-slate-500">{label}</p><p className="truncate text-sm font-semibold text-slate-900">{value}</p></div></div>;
}

function Action({ onClick, children, icon, primary, className = "" }: { onClick: () => void; children: React.ReactNode; icon: React.ReactNode; primary?: boolean; className?: string }) {
  return <button type="button" onClick={onClick} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${primary ? "bg-[#00629B] text-white hover:bg-[#00527f]" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"} ${className}`}>{icon}{children}</button>;
}
