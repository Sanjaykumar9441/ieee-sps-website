import { Clock, FileText, Users, Activity, Edit, Copy, Trash2, Archive, LayoutDashboard, Rocket, CopyCheck } from "lucide-react";

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
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function AssessmentCard({ assessment, onDashboard, onEdit, onDuplicate, onPublish, onUnpublish, onArchive, onDelete }: Props) {
  const copyId = async () => {
    try { await navigator.clipboard.writeText(assessment.id); } catch { /* clipboard may be unavailable */ }
  };

  return <div className="rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg">
    <div className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="text-xl font-bold">{assessment.title}</h2><p className="mt-1 text-sm text-gray-500">Assessment</p></div>
        <div className="flex gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${assessment.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{assessment.is_active ? "Active" : "Inactive"}</span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${assessment.is_published ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{assessment.is_published ? "Published" : "Draft"}</span></div>
      </div>

      {assessment.is_published && <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-3"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs font-medium text-blue-700">Assessment ID</p><p className="mt-1 truncate font-mono text-sm text-blue-900">{assessment.id}</p></div><button type="button" onClick={copyId} title="Copy assessment ID" className="rounded-lg border border-blue-200 bg-white p-2 text-blue-700 hover:bg-blue-100"><CopyCheck size={16} /></button></div></div>}

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Info icon={<FileText size={18} />} label="Questions" value={assessment.total_questions} />
        <Info icon={<Clock size={18} />} label="Duration" value={`${assessment.duration_minutes} mins`} />
        <Info icon={<Activity size={18} />} label="Status" value={assessment.is_active ? "Running" : "Stopped"} />
        <Info icon={<Users size={18} />} label="Created" value={new Date(assessment.created_at).toLocaleString()} />
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <Action onClick={() => onDashboard(assessment)} primary icon={<LayoutDashboard size={18} />}>Dashboard</Action>
        <Action onClick={() => onEdit(assessment)} icon={<Edit size={18} />}>Edit</Action>
        <Action onClick={() => onDuplicate(assessment.id)} icon={<Copy size={18} />}>Duplicate</Action>
        {assessment.is_published ? <Action onClick={() => onUnpublish(assessment.id)} icon={<Rocket size={18} />} className="border-orange-300 text-orange-600 hover:bg-orange-50">Unpublish</Action> : <Action onClick={() => onPublish(assessment.id)} icon={<Rocket size={18} />}>Publish</Action>}
        <Action onClick={() => onArchive(assessment.id)} icon={<Archive size={18} />}>Archive</Action>
        <Action onClick={() => onDelete(assessment.id)} icon={<Trash2 size={18} />} className="border-red-300 text-red-600 hover:bg-red-50">Delete</Action>
      </div>
    </div>
  </div>;
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) { return <div className="flex items-center gap-3">{icon}<div><p className="text-xs text-gray-500">{label}</p><p className="font-semibold text-sm">{value}</p></div></div>; }
function Action({ onClick, children, icon, primary, className = "" }: { onClick: () => void; children: React.ReactNode; icon: React.ReactNode; primary?: boolean; className?: string }) { return <button onClick={onClick} className={`flex items-center justify-center gap-2 rounded-xl py-2 text-sm ${primary ? "bg-[#00629B] text-white" : "border"} ${className}`}>{icon}{children}</button>; }
