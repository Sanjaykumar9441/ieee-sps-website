import { useEffect, useState } from "react";
import {
  X, LayoutDashboard, Database, Users, Radio, Trophy, BarChart3,
  Download, Settings2
} from "lucide-react";
import { Assessment } from "./AssessmentCard";
import Overview from "./Workspace/Overview";
import QuestionBanks from "./Workspace/QuestionBanks/QuestionBanks";
import Students from "./Workspace/Students";
import LiveMonitor from "./Workspace/LiveMonitor";
import Leaderboard from "./Workspace/Leaderboard";
import Analytics from "./Workspace/Analytics";
import Export from "./Workspace/Export";
import Settings from "./Workspace/Settings";

interface Props { assessment: Assessment; onClose: () => void; }
type WorkspaceTab="overview"|"questionBanks"|"students"|"live"|"leaderboard"|"analytics"|"export"|"settings";

const tabs:{id:WorkspaceTab;label:string;icon:any}[]=[
 {id:"overview",label:"Overview",icon:LayoutDashboard},
 {id:"questionBanks",label:"Question Banks",icon:Database},
 {id:"students",label:"Students",icon:Users},
 {id:"live",label:"Live Monitor",icon:Radio},
 {id:"leaderboard",label:"Leaderboard",icon:Trophy},
 {id:"analytics",label:"Analytics",icon:BarChart3},
 {id:"export",label:"Export",icon:Download},
 {id:"settings",label:"Settings",icon:Settings2},
];

function formatDate(value?:string|null){
 if(!value)return "Not scheduled";
 const d=new Date(value);
 return Number.isNaN(d.getTime())?"Not scheduled":d.toLocaleString();
}

export default function AssessmentWorkspace({assessment,onClose}:Props){
 const storageKey=`assessment-workspace-tab:${assessment.id}`;
 const [activeTab,setActiveTab]=useState<WorkspaceTab>(()=>{
  try{
   const saved=sessionStorage.getItem(storageKey) as WorkspaceTab|null;
   return saved&&tabs.some(tab=>tab.id===saved)?saved:"overview";
  }catch{return "overview";}
 });

 useEffect(()=>{
  try{sessionStorage.setItem(storageKey,activeTab);}catch{}
 },[storageKey,activeTab]);

 const status=assessment.is_published?"Published":"Draft";

 return (
  <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
   <header className="bg-slate-950 px-6 py-6 text-white md:px-8">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
     <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center gap-2">
       <span className={`rounded-full px-3 py-1 text-xs font-semibold ${assessment.is_published?"bg-emerald-500/20 text-emerald-300":"bg-white/10 text-slate-300"}`}>{status}</span>
       <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{assessment.login_method==="OTP"?"OTP Login":"Password Login"}</span>
       <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{assessment.live_updates_enabled===false?"Live Updates Off":"Live Updates On"}</span>
      </div>
      <h2 className="truncate text-2xl font-bold md:text-3xl">{assessment.title}</h2>
      <p className="mt-1 text-sm text-slate-400">Assessment administration workspace</p>
     </div>
     <button type="button" onClick={onClose} className="self-start rounded-xl border border-white/15 p-2.5 text-slate-300 hover:bg-white/10" aria-label="Close workspace"><X size={21}/></button>
    </div>
    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
     <MiniStat label="Questions" value={String(assessment.total_questions||0)}/>
     <MiniStat label="Duration" value={`${assessment.duration_minutes||0} min`}/>
     <MiniStat label="Starts" value={formatDate(assessment.start_time)}/>
     <MiniStat label="Ends" value={formatDate(assessment.end_time)}/>
    </div>
   </header>

   <nav className="border-b border-slate-200 bg-white px-3 md:px-5">
    <div className="flex gap-1 overflow-x-auto py-2">
     {tabs.map(({id,label,icon:Icon})=>(
      <button key={id} type="button" onClick={()=>setActiveTab(id)}
       className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${activeTab===id?"bg-slate-900 text-white shadow-sm":"text-slate-600 hover:bg-slate-100"}`}>
       <Icon size={17}/>{label}
      </button>
     ))}
    </div>
   </nav>

   <main className="bg-slate-50/70 p-4 md:p-7">
    {activeTab==="overview"&&<Overview assessment={assessment} onNavigate={setActiveTab}/>}
    {activeTab==="questionBanks"&&<QuestionBanks assessment={assessment}/>}
    {activeTab==="students"&&<Students assessment={assessment}/>}
    {activeTab==="live"&&<LiveMonitor assessment={assessment}/>}
    {activeTab==="leaderboard"&&<Leaderboard assessment={assessment}/>}
    {activeTab==="analytics"&&<Analytics assessment={assessment}/>}
    {activeTab==="export"&&<Export assessment={assessment}/>}
    {activeTab==="settings"&&<Settings assessment={assessment}/>}
   </main>
  </div>
 );
}

function MiniStat({label,value}:{label:string;value:string}){
 return <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-semibold text-white">{value}</p></div>;
}
