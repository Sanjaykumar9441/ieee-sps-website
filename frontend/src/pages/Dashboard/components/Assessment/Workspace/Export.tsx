import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Trophy, BarChart3, ListChecks } from "lucide-react";
import toast from "react-hot-toast";
import { Assessment } from "../AssessmentCard";

interface Props { assessment: Assessment; }
const API = import.meta.env.VITE_API_URL;

export default function Export({ assessment }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const download = async (format: "xlsx" | "pdf", type: string) => {
    const key = `${format}-${type}`; setLoading(key);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/api/admin/export/${assessment.id}?format=${format}&type=${type}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.message || "Export failed."); }
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`${assessment.slug || "assessment"}-${type}.${format}`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast.success("Export downloaded.");
    } catch (e:any) { toast.error(e.message || "Export failed."); } finally { setLoading(null); }
  };
  const Card=({title,description,type,Icon}:{title:string;description:string;type:string;Icon:any})=><div className="rounded-2xl border bg-white p-6"><div className="flex items-start gap-4"><div className="rounded-xl bg-slate-100 p-3"><Icon size={22}/></div><div><h3 className="font-semibold text-lg">{title}</h3><p className="mt-1 text-sm text-gray-500">{description}</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><button disabled={!!loading} onClick={()=>download("xlsx",type)} className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-medium hover:bg-gray-50 disabled:opacity-50"><FileSpreadsheet size={18}/>{loading===`xlsx-${type}`?"Preparing...":"Excel"}</button><button disabled={!!loading} onClick={()=>download("pdf",type)} className="flex items-center justify-center gap-2 rounded-xl bg-[#00629B] px-4 py-3 font-medium text-white disabled:opacity-50"><FileText size={18}/>{loading===`pdf-${type}`?"Preparing...":"PDF"}</button></div></div>;
  return <div className="space-y-8"><div><h2 className="flex items-center gap-3 text-3xl font-bold"><Download size={28} className="text-[#00629B]"/>Export Results</h2><p className="mt-2 text-gray-500">Download assessment results and rankings in Excel or PDF.</p></div><div className="grid gap-5 xl:grid-cols-2"><Card title="Complete Results" description="All submitted attempts with score, timing and student details." type="results" Icon={FileSpreadsheet}/><Card title="Leaderboard" description="Ranked submitted results with score, rank and time taken." type="leaderboard" Icon={Trophy}/><Card title="Question Analysis" description="Correct, wrong and skipped percentages for every question." type="question-analysis" Icon={ListChecks}/><Card title="Student Performance" description="Student-level performance dataset for further analysis." type="performance" Icon={BarChart3}/></div></div>;
}
