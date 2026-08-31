import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import StudentExam from "./StudentExam";
import StudentLogin from "../components/StudentLogin";
import VerifyOtp from "../components/VerifyOtp";
import ExamInstructions from "../components/ExamInstructions";
import { checkAssessment, resumeAssessment, startAssessment } from "../api/studenExamApi";
import type { Assessment } from "../types";

interface Props { assessmentId: string; onStartExam: (assessmentId: string) => void; }
type Step = "loading" | "login" | "otp" | "instructions" | "submitted";
type ExamStatus = "NOT_STARTED" | "LIVE" | "CLOSED";
interface ExamData { attemptId: string; totalQuestions: number; currentQuestion: number; remainingSeconds: number; question: any; }
interface ExamLaunchData extends ExamData { assessmentTitle: string; sessionId?: string; }

const isExamWindow = () => new URLSearchParams(window.location.search).get("examWindow") === "1";
const getLaunchAttemptId = () => new URLSearchParams(window.location.search).get("attemptId") || localStorage.getItem("studentAttemptId");

function SubmittedPage() {
  return <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4"><div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl">✓</div><h1 className="mt-5 text-2xl font-bold text-slate-900">Assessment Submitted</h1><p className="mt-2 text-slate-500">Your assessment has been submitted successfully.</p></div></div>;
}

export default function StudentExamPortal({ assessmentId, onStartExam }: Props) {
  const [step, setStep] = useState<Step>("loading");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [examStatus, setExamStatus] = useState<ExamStatus>("NOT_STARTED");
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState("");
  const [examData, setExamData] = useState<ExamData | null>(null);

  const handleStartExam = async () => {
    if (examStatus !== "LIVE") { toast.error("The examination has not started yet."); return; }
    const width = Math.max(1024, window.screen.availWidth || window.innerWidth);
    const height = Math.max(700, window.screen.availHeight || window.innerHeight);
    const examWindow = window.open("about:blank", "student-exam-window", `popup=yes,width=${width},height=${height},left=0,top=0,menubar=yes,toolbar=yes,location=yes,status=no,scrollbars=yes,resizable=yes`);
    if (!examWindow) { toast.error("Please allow pop-ups for this site and click Start Exam again."); return; }
    try { examWindow.moveTo(0, 0); examWindow.resizeTo(width, height); examWindow.focus(); } catch { /* browser may restrict window management */ }
    examWindow.document.title = "Examination";
    examWindow.document.body.innerHTML = '<div style="font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#334155"><div style="text-align:center"><div style="font-size:18px;font-weight:600">Opening examination...</div><div style="margin-top:8px;color:#64748b">Please wait.</div></div></div>';

    try {
      const result = await startAssessment(assessmentId);
      if (!result?.attemptId || !result?.question) throw new Error("Assessment started but the first question was not created.");
      const launchData: ExamLaunchData = { attemptId: result.attemptId, totalQuestions: Number(result.totalQuestions || 0), currentQuestion: Number(result.currentQuestion || 1), remainingSeconds: Number(result.remainingSeconds || 0), question: result.question, assessmentTitle: assessment.title, sessionId: result.sessionId };
      localStorage.setItem(`studentExamLaunch:${result.attemptId}`, JSON.stringify(launchData));
      localStorage.setItem(`studentCurrentQuestion:${result.attemptId}`, "1");
      onStartExam(assessmentId);
      const examUrl = new URL(`${window.location.origin}/student/exam/${assessmentId}`);
      examUrl.searchParams.set("examWindow", "1");
      examUrl.searchParams.set("attemptId", result.attemptId);
      examWindow.location.replace(examUrl.toString());
      examWindow.focus();
    } catch (err: any) {
      console.error("[EXAM] Unable to start:", err);
      try { examWindow.close(); } catch { /* ignore */ }
      toast.error(err?.response?.data?.message || err?.message || "Unable to start assessment.");
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "ASSESSMENT_SUBMITTED") return;
      if (String(event.data.assessmentId) !== String(assessmentId)) return;
      setExamData(null); setStep("submitted");
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [assessmentId]);

  useEffect(() => {
    let mounted = true;
    const loadAssessment = async () => {
      if (isExamWindow()) {
        const attemptId = getLaunchAttemptId();
        if (attemptId) {
          const rawLaunch = localStorage.getItem(`studentExamLaunch:${attemptId}`);
          if (rawLaunch) {
            try {
              const launch = JSON.parse(rawLaunch) as ExamLaunchData;
              if (launch.sessionId) { sessionStorage.setItem(`quiz_session_${attemptId}`, launch.sessionId); localStorage.setItem(`quiz_session_${attemptId}`, launch.sessionId); }
              if (launch.question) {
                setAssessment({ title: launch.assessmentTitle, start_time: new Date().toISOString(), end_time: new Date(Date.now() + launch.remainingSeconds * 1000).toISOString(), is_active: true } as Assessment);
                setExamStatus("LIVE"); setExamData(launch); setStep("instructions");
                void resumeAssessment(assessmentId, attemptId).then((resumed) => { if (mounted) setExamData(resumed); }).catch((error) => console.warn("[EXAM] Background resume failed; launch data retained.", error));
                return;
              }
            } catch (error) { console.error("[EXAM] Invalid launch payload:", error); }
          }
        }
      }
      try {
        const result = await checkAssessment(assessmentId);
        if (!mounted) return;
        const loaded = result.assessment; setAssessment(loaded);
        const now = Date.now(), start = new Date(loaded.start_time).getTime(), end = new Date(loaded.end_time).getTime();
        if (now < start) { setExamStatus("NOT_STARTED"); setCountdown(Math.max(0, Math.floor((start - now) / 1000))); }
        else if (now < end) { setExamStatus("LIVE"); setCountdown(0); }
        else { setExamStatus("CLOSED"); setCountdown(0); }
        setStep("login");
      } catch (err: any) {
        console.error("[EXAM] Unable to load assessment:", err); if (!mounted) return;
        toast.error(err?.response?.data?.message || err?.message || "Unable to load assessment."); setStep("login");
      }
    };
    void loadAssessment(); return () => { mounted = false; };
  }, [assessmentId]);

  useEffect(() => {
    if (!assessment || isExamWindow()) return;
    const update = () => {
      const now = Date.now(), start = new Date(assessment.start_time).getTime(), end = new Date(assessment.end_time).getTime();
      if (now < start) { setExamStatus("NOT_STARTED"); setCountdown(Math.max(0, Math.floor((start - now) / 1000))); }
      else if (now < end) { setExamStatus("LIVE"); setCountdown(0); }
      else { setExamStatus("CLOSED"); setCountdown(0); }
    };
    update(); const interval = window.setInterval(update, 1000); return () => window.clearInterval(interval);
  }, [assessment]);

  if (step === "submitted") return <SubmittedPage />;
  if (step === "loading" && !examData) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#00629B]" /><p className="mt-4 text-sm text-slate-500">Loading assessment...</p></div></div>;
  if (!assessment) return <div className="min-h-screen flex items-center justify-center text-slate-500">Assessment unavailable.</div>;
  if (step === "login") return <StudentLogin assessmentId={assessmentId} assessmentTitle={assessment.title} onLoggedIn={() => setStep("instructions")} onOtpSent={(studentEmail) => { setEmail(studentEmail); setStep("otp"); }} />;
  if (step === "otp") return <VerifyOtp assessmentId={assessmentId} email={email} onVerified={() => setStep("instructions")} onBack={() => setStep("login")} />;

  if (examData) {
    const student = JSON.parse(localStorage.getItem("student") || "{}");
    return <StudentExam assessmentId={assessmentId} attemptId={examData.attemptId} assessmentTitle={assessment.title} studentName={student.name || "Student"} totalQuestions={examData.totalQuestions} firstQuestion={examData.question} remainingSeconds={examData.remainingSeconds} onSubmitted={() => {
      const attemptId = examData.attemptId;
      localStorage.removeItem("studentAttemptId"); localStorage.removeItem(`studentCurrentQuestion:${attemptId}`); localStorage.removeItem(`studentExamLaunch:${attemptId}`);
      if (window.opener && !window.opener.closed) window.opener.postMessage({ type: "ASSESSMENT_SUBMITTED", assessmentId, attemptId }, window.location.origin);
      window.setTimeout(() => { try { window.close(); } catch { /* ignore */ } }, 150);
    }} />;
  }

  return <ExamInstructions assessment={assessment} onStart={handleStartExam} examStatus={examStatus} countdown={countdown} />;
}
