import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Flag, Maximize, Send, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { getAssessmentStatus, getPalette, getQuestion, saveAnswer, submitAssessment } from "../api/studenExamApi";
import useAntiCheat from "../api/useAntiCheat";
import useExamSocket from "../api/useExamSocket";
import type { AttemptQuestion, PaletteQuestion } from "../types";
import ExamHeader from "../components/ExamHeader";
import QuestionCard from "../components/QuestionCard";
import QuestionPalette from "../components/QuestionPalette";
import ExamNavigation from "../components/ExamNavigation";
import SubmitExamModal from "../components/SubmitExamModal";

interface Props { assessmentId:string; attemptId:string; assessmentTitle:string; studentName:string; totalQuestions:number; firstQuestion:AttemptQuestion; remainingSeconds:number; onSubmitted:()=>void; }

export default function StudentExam({ assessmentId, attemptId, assessmentTitle, studentName, totalQuestions, firstQuestion, remainingSeconds: initialSeconds, onSubmitted }: Props) {
  const finishingRef = useRef(false);
  const deadlineRef = useRef(Date.now() + Math.max(0, initialSeconds) * 1000);
  const savedAnswersRef = useRef<Record<string,string[]>>({});
  const saveTimerRef = useRef<number | null>(null);

  const [question,setQuestion] = useState<AttemptQuestion>(firstQuestion);
  const [currentQuestion,setCurrentQuestion] = useState(firstQuestion.question_order || 1);
  const [remainingSeconds,setRemainingSeconds] = useState(Math.max(0,initialSeconds));
  const [palette,setPalette] = useState<PaletteQuestion[]>([]);
  const [selectedAnswers,setSelectedAnswers] = useState<string[]>(firstQuestion.assessment_answers?.[0]?.selected_answers || []);
  const [saving,setSaving] = useState(false);
  const [loadingQuestion,setLoadingQuestion] = useState(false);
  const [submitOpen,setSubmitOpen] = useState(false);
  const [submitting,setSubmitting] = useState(false);
  const [violations,setViolations] = useState(0);
  const [isFullscreen,setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  const finishExam = useCallback(() => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    onSubmitted();
  },[onSubmitted]);

  const handleSecurityAutoSubmit = useCallback((reason:string) => {
    toast.error("Your assessment has been automatically submitted.");
    console.warn("[EXAM] Security auto-submit:",reason);
    finishExam();
  },[finishExam]);

  const { infractionCount,maxInfractions,warning,dismissWarning,reportInfraction } = useAntiCheat({
    attemptId, enabled:true, observeBrowserEvents:false, onAutoSubmit:handleSecurityAutoSubmit,
  });

  const { connected,reconnecting,reconnectCount } = useExamSocket({
    attemptId, assessmentId, enabled:true,
    onResync:(data:any) => {
      if (!data?.success) return;
      if (data.status === "SUBMITTED" || data.status === "EXPIRED") { finishExam(); return; }
      if (typeof data.remainingSeconds === "number") {
        const next=Math.max(0,Number(data.remainingSeconds));
        setRemainingSeconds(next); deadlineRef.current=Date.now()+next*1000;
      }
      if (Array.isArray(data.palette)) setPalette(data.palette);
    },
    onConnectionLost:()=>console.warn("[EXAM] Socket connection lost."),
    onReconnected:()=>console.log("[EXAM] Socket connection restored."),
  });

  const loadPalette = useCallback(async()=>{
    try { const result=await getPalette(attemptId); setPalette(result.palette || []); }
    catch(error){ console.error("[EXAM] Palette error:",error); }
  },[attemptId]);

  const persistCurrentAnswer = useCallback(async()=>{
    if (finishingRef.current) return false;
    try {
      setSaving(true);
      await saveAnswer(attemptId,question.id,selectedAnswers);
      savedAnswersRef.current[question.id]=[...selectedAnswers];
      await loadPalette();
      return true;
    } catch(error:any) {
      console.error("[EXAM] Save answer error:",error);
      toast.error(error?.response?.data?.message || error?.message || "Unable to save answer.");
      return false;
    } finally { setSaving(false); }
  },[attemptId,question.id,selectedAnswers,loadPalette]);

  const submitForReason = useCallback(async(reason:"AUTO_SUBMIT"|"SECURITY_AUTO_SUBMIT"|"STUDENT_SUBMIT"="STUDENT_SUBMIT")=>{
    if (finishingRef.current || submitting) return;
    try {
      setSubmitting(true);
      await persistCurrentAnswer();
      const result=await submitAssessment(attemptId);
      if (result?.success===false && !result?.expired) throw new Error(result.message || "Unable to submit assessment.");
      console.log("[EXAM] Submitted:",reason);
      finishExam();
    } catch(error:any) {
      console.error("[EXAM] Submit error:",error);
      toast.error(error?.response?.data?.message || error?.message || "Unable to submit assessment.");
      setSubmitting(false);
    }
  },[attemptId,finishExam,persistCurrentAnswer,submitting]);

  useEffect(()=>{ void loadPalette(); },[loadPalette]);

  // Continuous client-side countdown. Save/Next has no control over the timer.
  useEffect(()=>{
    const tick=()=>{
      if (finishingRef.current) return;
      const next=Math.max(0,Math.ceil((deadlineRef.current-Date.now())/1000));
      setRemainingSeconds(next);
      if (next<=0) void submitForReason("AUTO_SUBMIT");
    };
    tick();
    const interval=window.setInterval(tick,250);
    return ()=>window.clearInterval(interval);
  },[submitForReason]);

  // Server remains authoritative and catches admin Force Submit even if Socket.IO fails.
  useEffect(()=>{
    const sync=async()=>{
      if (finishingRef.current) return;
      try {
        const data:any=await getAssessmentStatus(attemptId);
        if (!data) return;
        if (data.status === "SUBMITTED" || data.status === "EXPIRED" || data.expired) { finishExam(); return; }
        if (typeof data.remainingSeconds === "number") {
          const next=Math.max(0,Number(data.remainingSeconds));
          setRemainingSeconds(next); deadlineRef.current=Date.now()+next*1000;
          if (next<=0) void submitForReason("AUTO_SUBMIT");
        }
        if (Array.isArray(data.palette)) setPalette(data.palette);
      } catch(error){ console.error("[EXAM] Status sync error:",error); }
    };
    void sync();
    const interval=window.setInterval(sync,2000);
    return ()=>window.clearInterval(interval);
  },[attemptId,finishExam,submitForReason]);

  const loadQuestion=useCallback(async(number:number)=>{
    if (number<1 || number>totalQuestions || loadingQuestion || finishingRef.current) return;
    try {
      setLoadingQuestion(true);
      const result:any=await getQuestion(attemptId,number);
      if (finishingRef.current) return;
      setQuestion(result.question); setCurrentQuestion(number);
      localStorage.setItem(`studentCurrentQuestion:${attemptId}`,String(number));
      const serverAnswers=result.question.assessment_answers?.[0]?.selected_answers || [];
      const remembered=savedAnswersRef.current[result.question.id];
      setSelectedAnswers(remembered ? [...remembered] : [...serverAnswers]);
      const nextSeconds=Math.max(0,Number(result.remainingSeconds || 0));
      setRemainingSeconds(nextSeconds); deadlineRef.current=Date.now()+nextSeconds*1000;
    } catch(error:any) {
      console.error("[EXAM] Load question error:",error);
      toast.error(error?.response?.data?.message || error?.message || "Unable to load question.");
    } finally { setLoadingQuestion(false); }
  },[attemptId,totalQuestions,loadingQuestion]);

  // Autosave also makes direct palette navigation and Previous safe.
  useEffect(()=>{
    if (finishingRef.current) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current=window.setTimeout(()=>{ void persistCurrentAnswer(); },500);
    return ()=>{ if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current); };
  },[selectedAnswers,question.id,persistCurrentAnswer]);

  const handleNext=async()=>{ const saved=await persistCurrentAnswer(); if(saved && currentQuestion<totalQuestions) await loadQuestion(currentQuestion+1); };
  const handlePrevious=async()=>{ if(currentQuestion<=1)return; const saved=await persistCurrentAnswer(); if(saved) await loadQuestion(currentQuestion-1); };
  const handleSubmit=()=>void submitForReason("STUDENT_SUBMIT");

  useEffect(()=>{
    const visibility=()=>{ if(document.visibilityState==="hidden"){setViolations(v=>v+1);void reportInfraction("TAB_SWITCH");} };
    const blur=()=>void reportInfraction("WINDOW_BLUR");
    const fullscreen=()=>{ const active=Boolean(document.fullscreenElement); setIsFullscreen(active); if(!active)void reportInfraction("FULLSCREEN_EXIT"); };
    document.addEventListener("visibilitychange",visibility); window.addEventListener("blur",blur); document.addEventListener("fullscreenchange",fullscreen);
    return()=>{document.removeEventListener("visibilitychange",visibility);window.removeEventListener("blur",blur);document.removeEventListener("fullscreenchange",fullscreen);};
  },[reportInfraction]);

  useEffect(()=>{
    const copy=(e:ClipboardEvent)=>{e.preventDefault();void reportInfraction("COPY_ATTEMPT");};
    const paste=(e:ClipboardEvent)=>{e.preventDefault();void reportInfraction("PASTE_ATTEMPT");};
    const cut=(e:ClipboardEvent)=>{e.preventDefault();void reportInfraction("CUT_ATTEMPT");};
    const context=(e:MouseEvent)=>{e.preventDefault();void reportInfraction("CONTEXT_MENU");};
    const key=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();const blocked=(e.ctrlKey && ["c","v","x","a","p","s","u"].includes(k))||(e.ctrlKey&&e.shiftKey&&["i","j","c"].includes(k))||e.key==="F12";if(!blocked)return;e.preventDefault();void reportInfraction("KEYBOARD_SHORTCUT");};
    document.addEventListener("copy",copy);document.addEventListener("paste",paste);document.addEventListener("cut",cut);document.addEventListener("contextmenu",context);document.addEventListener("keydown",key);
    return()=>{document.removeEventListener("copy",copy);document.removeEventListener("paste",paste);document.removeEventListener("cut",cut);document.removeEventListener("contextmenu",context);document.removeEventListener("keydown",key);};
  },[reportInfraction]);

  const enterFullscreen=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();}catch(error){console.warn("[EXAM] Fullscreen request blocked by browser.",error);}};

  return <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-hidden">
    {reconnecting && <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl"><div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600"/><h2 className="text-xl font-bold text-slate-900">Connection Lost</h2><p className="mt-2 text-sm text-slate-500">Reconnecting to the examination server...</p></div></div>}
    <ExamHeader assessmentTitle={assessmentTitle} studentName={studentName} remainingSeconds={remainingSeconds} onExpire={()=>void submitForReason("AUTO_SUBMIT")}/>
    <div className="flex-1 overflow-hidden"><div className="h-full overflow-y-auto"><div className="max-w-[1500px] mx-auto p-4 lg:p-6"><div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-6">
      <main className="min-w-0">
        <div className="flex items-center justify-between mb-4"><div><p className="text-sm font-semibold text-slate-500">Question <span className="text-slate-900">{currentQuestion}</span> of <span className="text-slate-900">{totalQuestions}</span></p><p className="text-xs text-slate-400 mt-1">Every question carries 1 mark.</p></div><div className="flex items-center gap-2">{violations>0&&<div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold"><AlertTriangle size={14}/>{violations} violation{violations!==1?"s":""}</div>}<button type="button" onClick={()=>void enterFullscreen()} className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50"><Maximize size={14}/>{isFullscreen?"Fullscreen Active":"Enter Fullscreen"}</button></div></div>
        {warning&&<div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-amber-900">Anti-Cheat Warning</p><p className="mt-1 text-sm text-amber-800">{warning}</p><p className="mt-1 text-xs text-amber-700">Violations: {infractionCount} / {maxInfractions}</p></div><button type="button" onClick={dismissWarning} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-amber-800 border border-amber-200">I Understand</button></div></div>}
        {loadingQuestion?<div className="bg-white rounded-2xl border border-slate-200 p-16 text-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#00629B] rounded-full animate-spin mx-auto"/><p className="text-sm text-slate-400 mt-4">Loading question...</p></div>:<QuestionCard question={question} selectedAnswers={selectedAnswers} onChange={setSelectedAnswers}/>} 
        <div className="mt-5"><ExamNavigation currentQuestion={currentQuestion} totalQuestions={totalQuestions} saving={saving} onPrevious={handlePrevious} onNext={handleNext} onSaveAndNext={handleNext}/></div>
      </main>
      <aside className="space-y-5"><div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#00629B]/10 text-[#00629B] flex items-center justify-center"><ShieldCheck size={20}/></div><div><div className="flex items-center gap-2"><p className="font-semibold text-slate-900">Examination Active</p><span className={`h-2 w-2 rounded-full ${connected?"bg-green-500":"bg-red-500"}`}/></div><p className="text-xs text-slate-400 mt-0.5">{connected?(reconnectCount?`Connection restored • ${reconnectCount} reconnect${reconnectCount!==1?"s":""}`:"Live connection active"):"Connection lost"}</p></div></div></div><QuestionPalette palette={palette} currentQuestion={currentQuestion} onSelect={loadQuestion}/><button type="button" onClick={()=>setSubmitOpen(true)} disabled={submitting} className="w-full h-12 rounded-xl bg-[#00629B] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#00527f]"><Send size={17}/>Submit Assessment</button><div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex gap-3"><Flag size={17} className="text-amber-600 shrink-0"/><p className="text-xs leading-5 text-amber-800">Review your answers before submitting.</p></div></div></aside>
    </div></div></div></div>
    <SubmitExamModal open={submitOpen} answered={palette.filter(item=>item.answered).length} total={totalQuestions} submitting={submitting} onClose={()=>setSubmitOpen(false)} onConfirm={handleSubmit}/>
  </div>;
}
