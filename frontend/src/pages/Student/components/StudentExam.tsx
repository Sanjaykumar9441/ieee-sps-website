import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Flag, Maximize, Send, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { getAssessmentStatus, submitAssessment } from "../api/studenExamApi";
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
  currentQuestion: number;
  questions: AttemptQuestion[];
  remainingSeconds: number;
  onSubmitted: () => void;
}

type SubmitReason = "AUTO_SUBMIT" | "SECURITY_AUTO_SUBMIT" | "STUDENT_SUBMIT";
type AnswerMap = Record<string, string[]>;

const answerStorageKey = (attemptId: string) => `studentAnswers:${attemptId}`;
const questionStorageKey = (attemptId: string) =>
  `studentCurrentQuestion:${attemptId}`;

function readAnswerMap(
  attemptId: string,
  questions: AttemptQuestion[],
): AnswerMap {
  try {
    const raw = localStorage.getItem(answerStorageKey(attemptId));
    const stored = raw ? JSON.parse(raw) : {};
    const result: AnswerMap = {};

    if (stored && typeof stored === "object") {
      Object.entries(stored).forEach(([id, value]) => {
        if (Array.isArray(value)) result[id] = value.map(String);
      });
    }

    // If this browser has no local snapshot yet (for example after a refresh
    // before the first local save), seed it from the one-time paper response.
    for (const question of questions) {
      if (result[question.id]) continue;
      const serverAnswers = question.assessment_answers?.[0]?.selected_answers;
      if (Array.isArray(serverAnswers) && serverAnswers.length) {
        result[question.id] = serverAnswers.map(String);
      }
    }

    return result;
  } catch {
    return {};
  }
}

function writeAnswerMap(attemptId: string, answers: AnswerMap) {
  try {
    localStorage.setItem(answerStorageKey(attemptId), JSON.stringify(answers));
  } catch (error) {
    console.warn("[EXAM] Unable to persist local answer snapshot:", error);
  }
}

export default function StudentExam({
  assessmentId,
  attemptId,
  assessmentTitle,
  studentName,
  totalQuestions,
  currentQuestion: initialQuestion,
  questions,
  remainingSeconds: initialSeconds,
  onSubmitted,
}: Props) {
  const finishingRef = useRef(false);
  const submittingRef = useRef(false);
  const submitRef = useRef<(reason: SubmitReason) => void>(() => undefined);
  const answersRef = useRef<AnswerMap>({});
  const deadlineRef = useRef(Date.now() + Math.max(0, initialSeconds) * 1000);
  const [answerMap, setAnswerMap] = useState<AnswerMap>(() => {
    const loaded = readAnswerMap(attemptId, questions);
    answersRef.current = loaded;
    writeAnswerMap(attemptId, loaded);
    return loaded;
  });
  const [questionIndex, setQuestionIndex] = useState(
    Math.min(Math.max(1, initialQuestion), Math.max(1, questions.length)),
  );
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.max(0, initialSeconds),
  );
  const [submitting, setSubmitting] = useState(false);
  const [violations, setViolations] = useState(0);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(
    Boolean(document.fullscreenElement),
  );
  const [fullscreenError, setFullscreenError] = useState("");
  const fullscreenEnteredRef = useRef(Boolean(document.fullscreenElement));

  const currentQuestion = questions[questionIndex - 1] || questions[0];

  const palette = useMemo<PaletteQuestion[]>(() => {
    return questions.map((item) => ({
      id: item.id,
      questionOrder: item.question_order,
      answered:
        Array.isArray(answerMap[item.id]) && answerMap[item.id].length > 0,
      markedForReview: false,
    }));
  }, [answerMap, questions]);

  const finishExam = useCallback(() => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    try {
      localStorage.removeItem(answerStorageKey(attemptId));
      localStorage.removeItem(questionStorageKey(attemptId));
    } catch {
      // Ignore localStorage cleanup errors.
    }
    onSubmitted();
  }, [attemptId, onSubmitted]);

  const persistCurrentAnswer = useCallback(() => {
    if (!currentQuestion || finishingRef.current) return false;
    const next = { ...answersRef.current };
    next[currentQuestion.id] = [...(next[currentQuestion.id] || [])];
    answersRef.current = next;
    writeAnswerMap(attemptId, next);
    try {
      localStorage.setItem(
        questionStorageKey(attemptId),
        String(questionIndex),
      );
    } catch {
      // Ignore localStorage errors; React state remains authoritative for this tab.
    }
    return true;
  }, [attemptId, currentQuestion, questionIndex]);

  const submitForReason = useCallback(
    async (reason: SubmitReason = "STUDENT_SUBMIT") => {
      if (finishingRef.current || submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);

      try {
        persistCurrentAnswer();

        const answers = questions.map((item) => ({
          attemptQuestionId: item.id,
          selectedAnswers: answersRef.current[item.id] || [],
        }));

        const result = await submitAssessment(attemptId, reason, answers);

        if (result?.success === false) {
          throw new Error(result.message || "Unable to submit assessment.");
        }

        console.log("[EXAM] Submission queued:", reason);
        toast.success("Assessment submitted successfully.");
        finishExam();
      } catch (error: any) {
        console.error("[EXAM] Submit error:", error);
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to submit assessment. Your answers are still saved locally.",
        );
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [attemptId, finishExam, persistCurrentAnswer, questions],
  );

  submitRef.current = submitForReason;

  const handleSecurityAutoSubmit = useCallback((reason: string) => {
    toast.error("Your assessment has been automatically submitted.");
    console.warn("[EXAM] Security auto-submit:", reason);
    void submitRef.current("SECURITY_AUTO_SUBMIT");
  }, []);

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
    onResync: (data: any) => {
      if (!data) return;
      if (data.status === "SUBMITTED") {
        finishExam();
        return;
      }
      if (
        data.expired ||
        data.status === "EXPIRED" ||
        Number(data.remainingSeconds) <= 0
      ) {
        void submitRef.current("AUTO_SUBMIT");
      }
    },
    onConnectionLost: () => console.warn("[EXAM] Socket connection lost."),
    onReconnected: () => console.log("[EXAM] Socket connection restored."),
  });

  useEffect(() => {
    const tick = () => {
      if (finishingRef.current) return;
      const next = Math.max(
        0,
        Math.ceil((deadlineRef.current - Date.now()) / 1000),
      );
      setRemainingSeconds(next);
      if (next <= 0) void submitRef.current("AUTO_SUBMIT");
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        questionStorageKey(attemptId),
        String(questionIndex),
      );
    } catch {
      // Ignore localStorage errors.
    }
  }, [attemptId, questionIndex]);

  const updateSelectedAnswers = useCallback(
    (nextAnswers: string[]) => {
      if (!currentQuestion || finishingRef.current) return;
      const next = {
        ...answersRef.current,
        [currentQuestion.id]: [...nextAnswers],
      };
      answersRef.current = next;
      setAnswerMap(next);
      writeAnswerMap(attemptId, next);
    },
    [attemptId, currentQuestion],
  );

  const goToQuestion = useCallback(
    (number: number) => {
      if (number < 1 || number > questions.length || finishingRef.current)
        return;
      persistCurrentAnswer();
      setQuestionIndex(number);
    },
    [persistCurrentAnswer, questions.length],
  );

  const handleNext = () => {
    if (questionIndex < questions.length) goToQuestion(questionIndex + 1);
  };

  const handlePrevious = () => {
    if (questionIndex > 1) goToQuestion(questionIndex - 1);
  };

  const enterFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        setFullscreenError("");
        return true;
      }
      if (!document.fullscreenEnabled) {
        setFullscreenError(
          "Fullscreen is not available in this browser or window.",
        );
        return false;
      }
      const element: any = document.documentElement;
      if (typeof element.requestFullscreen !== "function") {
        setFullscreenError("Fullscreen is not supported by this browser.");
        return false;
      }
      await element.requestFullscreen({ navigationUI: "hide" });
      setFullscreenError("");
      return true;
    } catch (error) {
      console.warn("[EXAM] Fullscreen request blocked by browser.", error);
      setFullscreenError(
        "Click Enter Fullscreen once. Browsers require a direct user action for fullscreen.",
      );
      return false;
    }
  };

  useEffect(() => {
    const visibility = () => {
      if (document.visibilityState === "hidden") {
        setViolations((v) => v + 1);
        void reportInfraction("TAB_SWITCH");
      }
    };
    const blur = () => void reportInfraction("WINDOW_BLUR");
    const fullscreen = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (active) {
        fullscreenEnteredRef.current = true;
        setFullscreenError("");
      } else if (fullscreenEnteredRef.current) {
        void reportInfraction("FULLSCREEN_EXIT");
      }
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    document.addEventListener("fullscreenchange", fullscreen);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", blur);
      document.removeEventListener("fullscreenchange", fullscreen);
    };
  }, [reportInfraction]);

  useEffect(() => {
    const copy = (e: ClipboardEvent) => {
      e.preventDefault();
      void reportInfraction("COPY_ATTEMPT");
    };
    const paste = (e: ClipboardEvent) => {
      e.preventDefault();
      void reportInfraction("PASTE_ATTEMPT");
    };
    const cut = (e: ClipboardEvent) => {
      e.preventDefault();
      void reportInfraction("CUT_ATTEMPT");
    };
    const context = (e: MouseEvent) => {
      e.preventDefault();
      void reportInfraction("CONTEXT_MENU");
    };
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const blocked =
        (e.ctrlKey && ["c", "v", "x", "a", "p", "s", "u"].includes(k)) ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(k)) ||
        e.key === "F12";
      if (!blocked) return;
      e.preventDefault();
      void reportInfraction("KEYBOARD_SHORTCUT");
    };
    document.addEventListener("copy", copy);
    document.addEventListener("paste", paste);
    document.addEventListener("cut", cut);
    document.addEventListener("contextmenu", context);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("copy", copy);
      document.removeEventListener("paste", paste);
      document.removeEventListener("cut", cut);
      document.removeEventListener("contextmenu", context);
      document.removeEventListener("keydown", key);
    };
  }, [reportInfraction]);

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        Unable to load examination paper.
      </div>
    );
  }

  const selectedAnswers = answerMap[currentQuestion.id] || [];
  const answeredCount = palette.filter((item) => item.answered).length;

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-hidden">
      {reconnecting && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Connection Lost
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Reconnecting to the examination server...
            </p>
          </div>
        </div>
      )}
      <ExamHeader
        assessmentTitle={assessmentTitle}
        studentName={studentName}
        remainingSeconds={remainingSeconds}
        onExpire={() => void submitRef.current("AUTO_SUBMIT")}
      />
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-[1500px] mx-auto p-4 lg:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-6">
              <main className="min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Question{" "}
                      <span className="text-slate-900">{questionIndex}</span> of{" "}
                      <span className="text-slate-900">{totalQuestions}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Answers are saved locally and submitted together at the
                      end.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {violations > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                        <AlertTriangle size={14} /> {violations} violation
                        {violations !== 1 ? "s" : ""}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => void enterFullscreen()}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <Maximize size={14} />{" "}
                      {isFullscreen ? "Fullscreen Active" : "Enter Fullscreen"}
                    </button>
                    {fullscreenError && (
                      <p className="max-w-xs text-right text-[11px] font-medium text-amber-700">
                        {fullscreenError}
                      </p>
                    )}
                  </div>
                </div>
                {warning && (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-amber-900">
                          Anti-Cheat Warning
                        </p>
                        <p className="mt-1 text-sm text-amber-800">{warning}</p>
                        <p className="mt-1 text-xs text-amber-700">
                          Violations: {infractionCount} / {maxInfractions}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={dismissWarning}
                        className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-amber-800 border border-amber-200"
                      >
                        I Understand
                      </button>
                    </div>
                  </div>
                )}
                <QuestionCard
                  question={currentQuestion}
                  selectedAnswers={selectedAnswers}
                  onChange={updateSelectedAnswers}
                />
                <div className="mt-5">
                  <ExamNavigation
                    currentQuestion={questionIndex}
                    totalQuestions={totalQuestions}
                    saving={false}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    onSaveAndNext={handleNext}
                  />
                </div>
              </main>
              <aside className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00629B]/10 text-[#00629B] flex items-center justify-center">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          Examination Active
                        </p>
                        <span
                          className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {connected
                          ? reconnectCount
                            ? `Connection restored • ${reconnectCount} reconnect${reconnectCount !== 1 ? "s" : "s"}`
                            : "Live connection active"
                          : "Connection lost"}
                      </p>
                    </div>
                  </div>
                </div>
                <QuestionPalette
                  palette={palette}
                  currentQuestion={questionIndex}
                  onSelect={goToQuestion}
                />
                <button
                  type="button"
                  onClick={() => setSubmitOpen(true)}
                  disabled={submitting}
                  className="w-full h-12 rounded-xl bg-[#00629B] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#00527f] disabled:opacity-60"
                >
                  <Send size={17} /> Submit Assessment
                </button>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <Flag size={17} className="text-amber-600 shrink-0" />
                    <p className="text-xs leading-5 text-amber-800">
                      {answeredCount} of {totalQuestions} questions answered.
                      Review your answers before submitting.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
      <SubmitExamModal
        open={submitOpen}
        answered={answeredCount}
        total={totalQuestions}
        submitting={submitting}
        onClose={() => setSubmitOpen(false)}
        onConfirm={() => void submitForReason("STUDENT_SUBMIT")}
      />
    </div>
  );
}
