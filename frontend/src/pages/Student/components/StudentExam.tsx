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
  const {
    infractionCount,
    maxInfractions,
    warning,
    disqualified,
    dismissWarning,
    reportInfraction,
  } = useAntiCheat({
    attemptId,
    enabled: true,
  });

  const { connected, reconnecting, reconnectCount } = useExamSocket({
    attemptId,
    assessmentId,
    enabled: true,

    onResync: (data) => {
      console.log("[EXAM] Reconnected and synchronized:", data);

      if (!data?.success) {
        return;
      }

      if (typeof data.remainingSeconds === "number") {
        setRemainingSeconds(data.remainingSeconds);
      }

      if (data.palette) {
        setPalette(data.palette);
      }

      if (
        data.status === "SUBMITTED" ||
        data.status === "DISQUALIFIED" ||
        data.status === "EXPIRED"
      ) {
        onSubmitted();
      }
    },

    onConnectionLost: () => {
      console.warn("[EXAM] Socket connection lost.");
    },

    onReconnected: () => {
      console.log("[EXAM] Socket connection restored.");
    },
  });

  const [question, setQuestion] = useState<AttemptQuestion>(firstQuestion);

  const [currentQuestion, setCurrentQuestion] = useState(
    firstQuestion.question_order,
  );

  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);

  const [isFullscreen, setIsFullscreen] = useState(
    Boolean(document.fullscreenElement),
  );

  const [palette, setPalette] = useState<PaletteQuestion[]>([]);

  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(
    firstQuestion.assessment_answers?.[0]?.selected_answers || [],
  );

  const [saving, setSaving] = useState(false);

  const [loadingQuestion, setLoadingQuestion] = useState(false);

  const [submitOpen, setSubmitOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [violations, setViolations] = useState(0);

  const previousVisibility = useRef(document.visibilityState);

  /* ============================================================
     PALETTE
  ============================================================ */

  const loadPalette = useCallback(async () => {
    try {
      const result = await getPalette(attemptId);

      setPalette(result.palette);
    } catch (error) {
      console.error("Palette error:", error);
    }
  }, [attemptId]);

  useEffect(() => {
    loadPalette();
  }, [loadPalette]);

  /* ============================================================
     TIMER
  ============================================================ */

  useEffect(() => {
    const sync = async () => {
      try {
        const status = await getAssessmentStatus(attemptId);

        if (status.expired || status.remainingSeconds <= 0) {
          onSubmitted();
          return;
        }

        setRemainingSeconds(status.remainingSeconds);

        if (status.palette) {
          setPalette(status.palette);
        }
      } catch (error) {
        console.error("Status sync error:", error);
      }
    };

    const interval = window.setInterval(sync, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [attemptId, onSubmitted]);

  /* ============================================================
     SERVER STATUS SYNC
  ============================================================ */

  useEffect(() => {
    const sync = async () => {
      try {
        const status = await getAssessmentStatus(attemptId);

        if (status.expired || status.remainingSeconds <= 0) {
          onSubmitted();
          return;
        }

        setRemainingSeconds(status.remainingSeconds);

        if (status.palette) {
          setPalette(status.palette);
        }
      } catch (error) {
        console.error("Status sync error:", error);
      }
    };

    const interval = window.setInterval(sync, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [attemptId, onSubmitted]);

  const syncServerState = async () => {
    try {
      const data = await getAssessmentStatus(attemptId);

      if (!data?.success) {
        return;
      }

      if (typeof data.remainingSeconds === "number") {
        setRemainingSeconds(data.remainingSeconds);
      }

      if (
        data.status === "SUBMITTED" ||
        data.status === "DISQUALIFIED" ||
        data.status === "EXPIRED"
      ) {
        console.warn("[EXAM] Server says attempt is finished:", data.status);

        onSubmitted();
      }
    } catch (error) {
      console.error("[EXAM] Failed to synchronize:", error);
    }
  };

  useEffect(() => {
    void syncServerState();

    const interval = window.setInterval(() => {
      void syncServerState();
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [attemptId, onSubmitted]);

  /* ============================================================
     EXPIRE
  ============================================================ */

  const handleExpire = useCallback(() => {
    if (remainingSeconds > 0) {
      return;
    }

    toast.error("Time is over. Your assessment is being submitted.");

    onSubmitted();
  }, [remainingSeconds, onSubmitted]);

  /* ============================================================
     LOAD QUESTION
  ============================================================ */

  const loadQuestion = async (number: number) => {
    if (number < 1 || number > totalQuestions || loadingQuestion) {
      return;
    }

    try {
      setLoadingQuestion(true);

      const result = await getQuestion(attemptId, number);

      setQuestion(result.question);

      setCurrentQuestion(number);

      localStorage.setItem(
        `studentCurrentQuestion:${attemptId}`,
        String(number),
      );

      setRemainingSeconds(result.remainingSeconds);

      setSelectedAnswers(
        result.question.assessment_answers?.[0]?.selected_answers || [],
      );
    } catch (error: any) {
      console.error(error);

      toast.error(error?.message || "Unable to load question.");
    } finally {
      setLoadingQuestion(false);
    }
  };

  /* ============================================================
     SAVE
  ============================================================ */

  const saveCurrentAnswer = async () => {
    try {
      setSaving(true);

      await saveAnswer(attemptId, question.id, selectedAnswers);

      await loadPalette();

      return true;
    } catch (error: any) {
      console.error(error);

      toast.error(error?.message || "Unable to save answer.");

      return false;
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     NEXT
  ============================================================ */

  const handleNext = async () => {
    const saved = await saveCurrentAnswer();

    if (!saved) return;

    if (currentQuestion < totalQuestions) {
      await loadQuestion(currentQuestion + 1);
    }
  };

  /* ============================================================
     PREVIOUS
  ============================================================ */

  const handlePrevious = async () => {
    if (currentQuestion <= 1) {
      return;
    }

    await loadQuestion(currentQuestion - 1);
  };

  /* ============================================================
     SUBMIT
  ============================================================ */

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      await saveCurrentAnswer();

      const result = await submitAssessment(attemptId);

      if (result.success === false && !result.expired) {
        throw new Error(result.message || "Unable to submit assessment.");
      }

      toast.success("Assessment submitted successfully.");

      onSubmitted();
    } catch (error: any) {
      console.error(error);

      toast.error(error?.message || "Unable to submit assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ============================================================
     FULLSCREEN
  ============================================================ */

  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  /* ============================================================
   FULLSCREEN ENFORCEMENT
============================================================ */

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);

      setIsFullscreen(active);

      if (!active) {
        void reportInfraction("FULLSCREEN_EXIT");

        toast.error("Fullscreen mode is required during the examination.");

        window.setTimeout(() => {
          if (!document.fullscreenElement) {
            void enterFullscreen();
          }
        }, 500);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [reportInfraction]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void enterFullscreen();
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  /* ============================================================
     VISIBILITY / TAB SWITCH
  ============================================================ */

  useEffect(() => {
    const handleVisibility = () => {
      const current = document.visibilityState;

      if (previousVisibility.current === "visible" && current === "hidden") {
        setViolations((value) => value + 1);

        toast.error("Leaving the examination window is not allowed.");
      }

      previousVisibility.current = current;
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  /* ============================================================
   ANTI-CHEAT — COPY / PASTE / KEYBOARD / CONTEXT MENU
============================================================ */

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

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();

      void reportInfraction("CONTEXT_MENU");

      toast.error("Right-click is disabled during the examination.");
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      const blocked =
        (event.ctrlKey && key === "c") ||
        (event.ctrlKey && key === "v") ||
        (event.ctrlKey && key === "x") ||
        (event.ctrlKey && key === "a") ||
        (event.ctrlKey && key === "p") ||
        (event.ctrlKey && key === "s") ||
        (event.ctrlKey && key === "u") ||
        (event.ctrlKey &&
          event.shiftKey &&
          (key === "i" || key === "j" || key === "c")) ||
        event.key === "F12";

      if (!blocked) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      void reportInfraction("KEYBOARD_SHORTCUT");

      toast.error("This keyboard shortcut is disabled during the examination.");
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCut);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [reportInfraction]);

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-hidden">
      {!connected && reconnecting && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Connection Lost
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your connection to the examination server was interrupted. Please
              wait while we reconnect you.
            </p>

            <p className="mt-4 text-sm font-semibold text-amber-600">
              Reconnecting...
            </p>
          </div>
        </div>
      )}
      <ExamHeader
        assessmentTitle={assessmentTitle}
        studentName={studentName}
        remainingSeconds={remainingSeconds}
        onExpire={handleExpire}
      />

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-[1500px] mx-auto p-4 lg:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-6">
              {/* =================================================
                  MAIN EXAM
              ================================================= */}

              <main className="min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Question{" "}
                      <span className="text-slate-900">{currentQuestion}</span>{" "}
                      of{" "}
                      <span className="text-slate-900">{totalQuestions}</span>
                    </p>
                  </div>

                  {warning && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
                      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4">
                          <h2
                            className={`text-xl font-bold ${
                              disqualified ? "text-red-600" : "text-amber-600"
                            }`}
                          >
                            {disqualified
                              ? "Assessment Disqualified"
                              : "Anti-Cheat Warning"}
                          </h2>

                          <p className="mt-2 text-sm text-gray-600">
                            {warning}
                          </p>
                        </div>

                        <div className="mb-5 rounded-xl bg-gray-100 p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Violations
                            </span>

                            <span className="font-bold">
                              {infractionCount} / {maxInfractions}
                            </span>
                          </div>
                        </div>

                        {!disqualified && (
                          <button
                            type="button"
                            onClick={dismissWarning}
                            className="w-full rounded-xl bg-[#00629B] px-4 py-3 font-semibold text-white"
                          >
                            I Understand
                          </button>
                        )}

                        {disqualified && (
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = "/student";
                            }}
                            className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white"
                          >
                            Exit Assessment
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {violations > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                        <AlertTriangle size={14} />
                        {violations} violation
                        {violations !== 1 ? "s" : ""}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={enterFullscreen}
                      className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <Maximize size={14} />

                      {isFullscreen ? "Fullscreen Active" : "Enter Fullscreen"}
                    </button>
                  </div>
                </div>

                {loadingQuestion ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-16 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 border-3 border-slate-200 border-t-[#00629B] rounded-full animate-spin mx-auto" />

                      <p className="text-sm text-slate-400 mt-4">
                        Loading question...
                      </p>
                    </div>
                  </div>
                ) : (
                  <QuestionCard
                    question={question}
                    selectedAnswers={selectedAnswers}
                    onChange={setSelectedAnswers}
                  />
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

              {/* =================================================
                  SIDEBAR
              ================================================= */}

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
                          className={`h-2 w-2 rounded-full ${
                            connected ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                      </div>

                      <p className="text-xs text-slate-400 mt-0.5">
                        {connected
                          ? reconnectCount > 0
                            ? `Connection restored • ${reconnectCount} reconnect${
                                reconnectCount !== 1 ? "s" : ""
                              }`
                            : "Live connection active"
                          : reconnecting
                            ? "Reconnecting..."
                            : "Connection lost"}
                      </p>
                    </div>
                  </div>
                </div>

                <QuestionPalette
                  palette={palette}
                  currentQuestion={currentQuestion}
                  onSelect={loadQuestion}
                />

                <button
                  type="button"
                  onClick={() => setSubmitOpen(true)}
                  className="w-full h-12 rounded-xl bg-[#00629B] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#00527f] transition"
                >
                  <Send size={17} />
                  Submit Assessment
                </button>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <Flag size={17} className="text-amber-600 shrink-0" />

                    <p className="text-xs leading-5 text-amber-800">
                      Make sure you have answered all required questions before
                      submitting.
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
        answered={palette.filter((item) => item.answered).length}
        total={totalQuestions}
        submitting={submitting}
        onClose={() => setSubmitOpen(false)}
        onConfirm={handleSubmit}
      />
    </div>
  );
}
