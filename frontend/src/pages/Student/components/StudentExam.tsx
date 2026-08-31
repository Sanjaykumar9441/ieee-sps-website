import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Flag, Maximize, Send, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

import {
  getAssessmentStatus,
  getPalette,
  getQuestion,
  saveAnswer,
  submitAssessment,
} from "../api/studenExamApi";
import useAntiCheat from "../api/useAntiCheat";
import useExamSocket from "../api/useExamSocket";
import type { AttemptQuestion, PaletteQuestion } from "../types";

import ExamHeader from "../components/ExamHeader";
import QuestionCard from "../components/QuestionCard";
import QuestionPalette from "../components/QuestionPalette";
import ExamNavigation from "../components/ExamNavigation";
import SubmitExamModal from "../components/SubmitExamModal";

interface Props {
  assessmentId: string;
  attemptId: string;
  assessmentTitle: string;
  studentName: string;
  totalQuestions: number;
  firstQuestion: AttemptQuestion;
  remainingSeconds: number;
  onSubmitted: () => void;
}

export default function StudentExam({
  assessmentId,
  attemptId,
  assessmentTitle,
  studentName,
  totalQuestions,
  firstQuestion,
  remainingSeconds: initialSeconds,
  onSubmitted,
}: Props) {
  const finishingRef = useRef(false);
  const deadlineRef = useRef(Date.now() + Math.max(0, initialSeconds) * 1000);
  const savedAnswersRef = useRef<Record<string, string[]>>({});
  const saveTimerRef = useRef<number | null>(null);

  const [question, setQuestion] = useState<AttemptQuestion>(firstQuestion);
  const [currentQuestion, setCurrentQuestion] = useState(firstQuestion.question_order || 1);
  const [remainingSeconds, setRemainingSeconds] = useState(Math.max(0, initialSeconds));
  const [palette, setPalette] = useState<PaletteQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(
    firstQuestion.assessment_answers?.[0]?.selected_answers || [],
  );
  const [saving, setSaving] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [violations, setViolations] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  const finishExam = useCallback(() => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    onSubmitted();
  }, [onSubmitted]);

  const handleSecurityAutoSubmit = useCallback(
    (reason: string) => {
      toast.error("Your assessment has been automatically submitted.");
      console.warn("[EXAM] Security auto-submit:", reason);
      finishExam();
    },
    [finishExam],
  );

  const {
    infractionCount,
    maxInfractions,
    warning,
    dismissWarning,
    reportInfraction,
  } = useAntiCheat({
    attemptId,
    enabled: true,
    observeBrowserEvents: false,
    onAutoSubmit: handleSecurityAutoSubmit,
  });

  const { connected, reconnecting, reconnectCount } = useExamSocket({
    attemptId,
    assessmentId,
    enabled: true,
    onResync: (data) => {
      if (!data?.success) return;

      if (data.status === "SUBMITTED" || data.status === "EXPIRED") {
        finishExam();
        return;
      }

      if (typeof data.remainingSeconds === "number") {
        const next = Math.max(0, Number(data.remainingSeconds));
        setRemainingSeconds(next);
        deadlineRef.current = Date.now() + next * 1000;
      }

      if (Array.isArray(data.palette)) setPalette(data.palette);
    },
    onConnectionLost: () => console.warn("[EXAM] Socket connection lost."),
    onReconnected: () => console.log("[EXAM] Socket connection restored."),
  });

  const loadPalette = useCallback(async () => {
    try {
      const result = await getPalette(attemptId);
      setPalette(result.palette || []);
    } catch (error) {
      console.error("[EXAM] Palette error:", error);
    }
  }, [attemptId]);

  useEffect(() => {
    void loadPalette();
  }, [loadPalette]);

  // The timer runs continuously. It is based on a deadline, not on Save/Next.
  useEffect(() => {
    const tick = () => {
      if (finishingRef.current) return;
      const next = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next <= 0) {
        void submitForReason("AUTO_SUBMIT");
      }
    };

    const interval = window.setInterval(tick, 250);
    tick();
    return () => window.clearInterval(interval);
  }, []);

  // Server is authoritative. Poll often enough that an admin force-submit stops
  // the local timer quickly even if the socket connection is unavailable.
  useEffect(() => {
    const sync = async () => {
      if (finishingRef.current) return;
      try {
        const data = await getAssessmentStatus(attemptId);
        if (!data) return;

        if (data.status === "SUBMITTED" || data.status === "EXPIRED" || data.expired) {
          finishExam();
          return;
        }

        if (typeof data.remainingSeconds === "number") {
          const next = Math.max(0, Number(data.remainingSeconds));
          setRemainingSeconds(next);
          deadlineRef.current = Date.now() + next * 1000;
          if (next <= 0) void submitForReason("AUTO_SUBMIT");
        }

        if (Array.isArray(data.palette)) setPalette(data.palette);
      } catch (error) {
        console.error("[EXAM] Status sync error:", error);
      }
    };

    void sync();
    const interval = window.setInterval(sync, 2000);
    return () => window.clearInterval(interval);
  }, [attemptId, finishExam]);

  const persistCurrentAnswer = useCallback(async () => {
    if (finishingRef.current) return false;

    try {
      setSaving(true);
      await saveAnswer(attemptId, question.id, selectedAnswers);
      savedAnswersRef.current[question.id] = [...selectedAnswers];
      await loadPalette();
      return true;
    } catch (error: any) {
      console.error("[EXAM] Save answer error:", error);
      toast.error(error?.response?.data?.message || error?.message || "Unable to save answer.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [attemptId, question.id, selectedAnswers, loadPalette]);

  const loadQuestion = useCallback(
    async (number: number) => {
      if (number < 1 || number > totalQuestions || loadingQuestion || finishingRef.current) return;

      try {
        setLoadingQuestion(true);
        const result = await getQuestion(attemptId, number);
        if (finishingRef.current) return;

        setQuestion(result.question);
        setCurrentQuestion(number);
        localStorage.setItem(`studentCurrentQuestion:${attemptId}`, String(number));

        const serverAnswers = result.question.assessment_answers?.[0]?.selected_answers || [];
        const remembered = savedAnswersRef.current[result.question.id];
        setSelectedAnswers(remembered ? [...remembered] : [...serverAnswers]);

        const nextSeconds = Math.max(0, Number(result.remainingSeconds || 0));
        setRemainingSeconds(nextSeconds);
        deadlineRef.current = Date.now() + nextSeconds * 1000;
      } catch (error: any) {
        console.error("[EXAM] Load question error:", error);
        toast.error(error?.response?.data?.message || error?.message || "Unable to load question.");
      } finally {
        setLoadingQuestion(false);
      }
    },
    [attemptId, totalQuestions, loadingQuestion],
  );

  // Save the selected answer shortly after a student changes it. This makes
  // palette navigation and Previous safe even when the student does not press
  // Save & Next first.
  useEffect(() => {
    if (finishingRef.current) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    saveTimerRef.current = window.setTimeout(() => {
      void persistCurrentAnswer();
    }, 500);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [selectedAnswers, question.id, persistCurrentAnswer]);

  const handleNext = async () => {
    const saved = await persistCurrentAnswer();
    if (!saved) return;
    if (currentQuestion < totalQuestions) await loadQuestion(currentQuestion + 1);
  };

  const handlePrevious = async () => {
    if (currentQuestion <= 1) return;
    const saved = await persistCurrentAnswer();
    if (!saved) return;
    await loadQuestion(currentQuestion - 1);
  };

  async function submitForReason(reason: "AUTO_SUBMIT" | "SECURITY_AUTO_SUBMIT" | "STUDENT_SUBMIT" = "STUDENT_SUBMIT") {
    if (finishingRef.current || submitting) return;

    try {
      setSubmitting(true);
      await persistCurrentAnswer();
      const result = await submitAssessment(attemptId);

      if (result?.success === false && !result?.expired) {
        throw new Error(result.message || "Unable to submit assessment.");
      }

      console.log("[EXAM] Submitted:", reason);
      finishExam();
    } catch (error: any) {
      console.error("[EXAM] Submit error:", error);
      toast.error(error?.response?.data?.message || error?.message || "Unable to submit assessment.");
      setSubmitting(false);
    }
  }

  const handleSubmit = () => {
    void submitForReason("STUDENT_SUBMIT");
  };

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        setViolations((value) => value + 1);
        void reportInfraction("TAB_SWITCH");
      }
    };
    const handleBlur = () => void reportInfraction("WINDOW_BLUR");
    const handleFullscreen = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active) void reportInfraction("FULLSCREEN_EXIT");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, [reportInfraction]);

  useEffect(() => {
    const handleCopy = (event: ClipboardEvent) => {
      event.preventDefault();
      void reportInfraction("COPY_ATTEMPT");
      toast.error("Copying is not allowed during the examination.");
    };
    const handlePaste = (event: ClipboardEvent) => {
      event.preventDefault();
      void reportInfraction("PASTE_ATTEMPT");
      toast.error("Pasting is not allowed during the examination.");
    };
    const handleCut = (event: ClipboardEvent) => {
      event.preventDefault();
      void reportInfraction("CUT_ATTEMPT");
      toast.error("Cutting is not allowed during the examination.");
    };
    const handleContext = (event: MouseEvent) => {
      event.preventDefault();
      void reportInfraction("CONTEXT_MENU");
      toast.error("Right-click is disabled during the examination.");
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const blocked =
        (event.ctrlKey && ["c", "v", "x", "a", "p", "s", "u"].includes(key)) ||
        (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key)) ||
        event.key === "F12";
      if (!blocked) return;
      event.preventDefault();
      event.stopPropagation();
      void reportInfraction("KEYBOARD_SHORTCUT");
      toast.error("This keyboard shortcut is disabled during the examination.");
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCut);
    document.addEventListener("contextmenu", handleContext);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("contextmenu", handleContext);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [reportInfraction]);

  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    } catch (error) {
      console.warn("[EXAM] Fullscreen request was blocked by the browser.", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-hidden">
      {!connected && reconnecting && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Connection Lost</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Reconnecting to the examination server...</p>
          </div>
        </div>
      )}

      <ExamHeader
        assessmentTitle={assessmentTitle}
        studentName={studentName}
        remainingSeconds={remainingSeconds}
        onExpire={() => void submitForReason("AUTO_SUBMIT")}
      />

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-[1500px] mx-auto p-4 lg:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-6">
              <main className="min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Question <span className="text-slate-900">{currentQuestion}</span> of <span className="text-slate-900">{totalQuestions}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Each question carries 1 mark.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {violations > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                        <AlertTriangle size={14} /> {violations} violation{violations !== 1 ? "s" : ""}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => void enterFullscreen()}
                      className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <Maximize size={14} /> {isFullscreen ? "Fullscreen Active" : "Enter Fullscreen"}
                    </button>
                  </div>
                </div>

                {warning && (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-amber-900">Anti-Cheat Warning</p>
                        <p className="mt-1 text-sm text-amber-800">{warning}</p>
                        <p className="mt-1 text-xs text-amber-700">Violations: {infractionCount} / {maxInfractions}</p>
                      </div>
                      <button type="button" onClick={dismissWarning} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-amber-800 border border-amber-200">I Understand</button>
                    </div>
                  </div>
                )}

                {loadingQuestion ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-16 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00629B] rounded-full animate-spin mx-auto" />
                      <p className="text-sm text-slate-400 mt-4">Loading question...</p>
                    </div>
                  </div>
                ) : (
                  <QuestionCard question={question} selectedAnswers={selectedAnswers} onChange={setSelectedAnswers} />
                )}

                <div className="mt-5">
                  <ExamNavigation
                    currentQuestion={currentQuestion}
                    totalQuestions={totalQuestions}
                    saving={saving}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    onSaveAndNext={handleNext}
                  />
                </div>
              </main>

              <aside className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00629B]/10 text-[#00629B] flex items-center justify-center"><ShieldCheck size={20} /></div>
                    <div>
                      <div className="flex items-center gap-2"><p className="font-semibold text-slate-900">Examination Active</p><span className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} /></div>
                      <p className="text-xs text-slate-400 mt-0.5">{connected ? (reconnectCount > 0 ? `Connection restored • ${reconnectCount} reconnect${reconnectCount !== 1 ? "s" : ""}` : "Live connection active") : "Connection lost"}</p>
                    </div>
                  </div>
                </div>

                <QuestionPalette palette={palette} currentQuestion={currentQuestion} onSelect={loadQuestion} />

                <button type="button" onClick={() => setSubmitOpen(true)} className="w-full h-12 rounded-xl bg-[#00629B] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#00527f] transition" disabled={submitting}>
                  <Send size={17} /> Submit Assessment
                </button>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3"><Flag size={17} className="text-amber-600 shrink-0" /><p className="text-xs leading-5 text-amber-800">Make sure you have answered all required questions before submitting.</p></div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      <SubmitExamModal
        open={submitOpen}
        answered={palette.filter((item) => item.answered).length}
        total={totalQuestions}
        submitting={submitting}
        onClose={() => setSubmitOpen(false)}
        onConfirm={handleSubmit}
      />
    </div>
  );
}
