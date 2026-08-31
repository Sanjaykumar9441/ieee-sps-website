import { useState } from "react";
import { BarChart3, Download, FileSpreadsheet, FileText, Table2 } from "lucide-react";
import toast from "react-hot-toast";
import { downloadAssessmentExport } from "../assessmentApi";
import type { Assessment } from "../AssessmentCard";

export default function ExportTab({ assessment }: { assessment: Assessment }) {
  const [busy,setBusy]=useState<string|null>(null);
  const download=async(format:"excel"|"pdf"|"csv")=>{try{setBusy(format);await downloadAssessmentExport(assessment.id,format);toast.success(`${format.toUpperCase()} report downloaded.`);}catch(error:any){console.error(error);toast.error(error?.response?.data?.message||`Unable to download ${format.toUpperCase()} report.`);}finally{setBusy(null);}};
  const cards=[
    {format:"excel" as const,title:"Premium Excel Workbook",text:"Results, summary, leaderboard and question analysis in separate sheets.",icon:FileSpreadsheet},
    {format:"pdf" as const,title:"Premium PDF Report",text:"Branded summary, performance statistics and a polished results table.",icon:FileText},
    {format:"csv" as const,title:"Raw CSV Data",text:"Flat result data for further processing in any spreadsheet tool.",icon:Table2},
  ];
  return <div className="space-y-6"><div className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-start gap-4"><div className="rounded-xl bg-blue-50 p-3 text-[#00629B]"><BarChart3 size={22}/></div><div><h2 className="text-2xl font-bold text-slate-900">Export Centre</h2><p className="mt-1 text-sm text-slate-500">Download complete assessment results, including submitted and automatically submitted attempts.</p></div></div></div><div className="grid gap-4 lg:grid-cols-3">{cards.map(({format,title,text,icon:Icon})=><button key={format} type="button" disabled={busy!==null} onClick={()=>void download(format)} className="group rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"><div className="flex items-center justify-between"><div className="rounded-xl bg-slate-100 p-3 text-slate-700"><Icon size={22}/></div><Download size={18} className="text-slate-400 group-hover:text-[#00629B]"/></div><h3 className="mt-5 font-bold text-slate-900">{busy===format?"Preparing...":title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></button>)}</div><div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-900"><strong>Tip:</strong> Use Excel for detailed analysis, PDF for official submission/reporting, and CSV for bulk data processing.</div></div>;
}
