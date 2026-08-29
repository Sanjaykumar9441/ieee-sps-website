import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Flag,
  Maximize,
  Send,
  ShieldCheck,
} from "lucide-react";

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

import type {
  AttemptQuestion,
  PaletteQuestion,
} from "../types";

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
  const securitySubmitRef = useRef<(() => void) | null>(null);

  /* ============================================================
     ANTI-CHEAT
  ============================================================ */

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
    // StudentExam owns the browser-event policy so Escape can have
    // the requested first-warning / second-Escape submit behaviour.
    observeBrowserEvents: false,
  });

  /* ============================================================
     SOCKET
  ============================================================ */

  const {
    connected,
    reconnecting,
    reconnectCount,
  } = useExamSocket({
    attemptId,
    assessmentId,
    enabled: true,

    onResync: (data) => {

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

  /* ============================================================
     STATE
  ============================================================ */

  const [question, setQuestion] =
    useState<AttemptQuestion | null>(
      firstQuestion ?? null
    );

  const [currentQuestion, setCurrentQuestion] =
    useState(firstQuestion.question_order);

  const [remainingSeconds, setRemainingSeconds] =
    useState(initialSeconds);

  const [isFullscreen, setIsFullscreen] = useState(
    Boolean(document.fullscreenElement)
  );

  const [palette, setPalette] =
    useState<PaletteQuestion[]>([]);

  const [selectedAnswers, setSelectedAnswers] =
    useState<string[]>(
      firstQuestion.assessment_answers?.[0]
        ?.selected_answers || []
    );

  const answerCacheRef = useRef<Record<number, string[]>>({
    [firstQuestion.question_order]:
      firstQuestion.assessment_answers?.[0]?.selected_answers || [],
  });

  const [saving, setSaving] = useState(false);

  const [loadingQuestion, setLoadingQuestion] =
    useState(false);

  const [submitOpen, setSubmitOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const previousVisibility = useRef(document.visibilityState);
  const escapeWarningRef = useRef(false);
  const escapeCountRef = useRef(0);
  const lastEscapeAtRef = useRef(0);
  const intentionalFullscreenExitRef = useRef(false);
  const escapeResetTimerRef = useRef<number | null>(null);
  const securitySubmittingRef = useRef(false);

  /* ============================================================
     PALETTE
  ============================================================ */

  const loadPalette = useCallback(async () => {
    try {
      const result = await getPalette(attemptId);

      setPalette(result.palette);
    } catch (error) {
      console.error(
        "[EXAM] Palette error:",
        error
      );
    }
  }, [attemptId]);

  useEffect(() => {
    void loadPalette();
  }, [loadPalette]);

  /* ============================================================
     SERVER STATUS SYNC
  ============================================================ */

  const syncServerState = useCallback(async () => {
    try {
      const data =
        await getAssessmentStatus(attemptId);

      if (!data?.success) {
        return;
      }

      if (
        typeof data.remainingSeconds === "number"
      ) {
        setRemainingSeconds(
          data.remainingSeconds
        );
      }

      if (
        data.status === "SUBMITTED" ||
        data.status === "DISQUALIFIED" ||
        data.status === "EXPIRED"
      ) {
        console.warn(
          "[EXAM] Server says attempt is finished:",
          data.status
        );

        onSubmitted();
      }
    } catch (error) {
      console.error(
        "[EXAM] Failed to synchronize:",
        error
      );
    }
  }, [attemptId, onSubmitted]);

  useEffect(() => {
    void syncServerState();

    const interval = window.setInterval(() => {
      void syncServerState();
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [syncServerState]);

  // Keep the visible timer moving every second. The server remains authoritative
  // and the 15-second sync above corrects any local clock drift.
  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemainingSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  /* ============================================================
     EXPIRE / AUTO SUBMIT
  ============================================================ */

  const autoSubmittingRef =
    useRef(false);

  const handleExpire = useCallback(async () => {
    /*
     * Prevent multiple submit requests.
     *
     * ExamTimer can call onExpire more than once
     * because the timer remains at 0 for a short time.
     */
    if (autoSubmittingRef.current) {
      return;
    }

    if (remainingSeconds > 0) {
      return;
    }

    autoSubmittingRef.current = true;

    try {
      toast(
        "Time is over. Submitting your assessment...",
        {
          icon: "⏰",
        }
      );

      /*
       * Save the currently selected answer first.
       */
      if (question) {
        try {
          await saveAnswer(
            attemptId,
            question.id,
            selectedAnswers
          );
        } catch (saveError) {
          /*
           * Do not block submission if the final answer
           * could not be saved.
           *
           * The backend timer still determines the
           * official attempt state.
           */
          console.warn(
            "[EXAM] Final answer could not be saved:",
            saveError
          );
        }
      }

      /*
       * Submit the attempt on the backend.
       */
      const result =
        await submitAssessment(attemptId);

      console.log(
        "[EXAM] Auto-submit response:",
        result
      );

      /*
       * The backend may return:
       *
       * success: true
       *
       * OR
       *
       * expired: true
       *
       * if the server already expired the attempt.
       */
      if (
        result?.success === true ||
        result?.expired === true ||
        result?.status === "SUBMITTED" ||
        result?.status === "EXPIRED"
      ) {
        onSubmitted();
        return;
      }

      /*
       * If the backend does not explicitly return success,
       * check the current server status.
       */
      const status =
        await getAssessmentStatus(attemptId);

      if (
        status?.status === "SUBMITTED" ||
        status?.status === "EXPIRED" ||
        status?.status === "DISQUALIFIED" ||
        status?.expired === true ||
        status?.remainingSeconds <= 0
      ) {
        onSubmitted();
        return;
      }

      /*
       * Submission genuinely failed.
       */
      autoSubmittingRef.current = false;

      toast.error(
        status?.message ||
          result?.message ||
          "Unable to submit the assessment."
      );
    } catch (error: any) {
      console.error(
        "[EXAM] Automatic submission failed:",
        error
      );

      /*
       * Check server once more.
       *
       * The backend may have submitted the attempt even
       * if the frontend request received an error.
       */
      try {
        const status =
          await getAssessmentStatus(attemptId);

        if (
          status?.status === "SUBMITTED" ||
          status?.status === "EXPIRED" ||
          status?.status === "DISQUALIFIED" ||
          status?.expired === true ||
          status?.remainingSeconds <= 0
        ) {
          onSubmitted();
          return;
        }
      } catch (statusError) {
        console.error(
          "[EXAM] Unable to verify final attempt status:",
          statusError
        );
      }

      autoSubmittingRef.current = false;

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Automatic submission failed. Please wait."
      );
    }
  }, [
    attemptId,
    remainingSeconds,
    question?.id,
    selectedAnswers,
    onSubmitted,
  ]);

  const handleSecurityAutoSubmit = useCallback(async () => {
    if (securitySubmittingRef.current) return;
    securitySubmittingRef.current = true;

    try {
      // Best effort: preserve the answer currently visible before submitting.
      if (question) {
        try {
          await saveAnswer(attemptId, question.id, selectedAnswers);
        } catch (error) {
          console.warn("[EXAM] Could not save answer before security submit:", error);
        }
      }

      const result = await submitAssessment(attemptId);
      if (
        result?.success === true ||
        result?.expired === true ||
        result?.status === "SUBMITTED" ||
        result?.status === "EXPIRED"
      ) {
        toast.error("Assessment submitted because you left the examination window.");
        onSubmitted();
        return;
      }

      const status = await getAssessmentStatus(attemptId);
      if (
        status?.status === "SUBMITTED" ||
        status?.status === "EXPIRED" ||
        status?.status === "DISQUALIFIED" ||
        status?.remainingSeconds <= 0
      ) {
        toast.error("Assessment submitted because you left the examination window.");
        onSubmitted();
        return;
      }

      securitySubmittingRef.current = false;
      toast.error("Security submission could not be confirmed. Please return to the exam window.");
    } catch (error: any) {
      console.error("[EXAM] Security auto-submit failed:", error);

      try {
        const status = await getAssessmentStatus(attemptId);
        if (
          status?.status === "SUBMITTED" ||
          status?.status === "EXPIRED" ||
          status?.status === "DISQUALIFIED" ||
          status?.remainingSeconds <= 0
        ) {
          onSubmitted();
          return;
        }
      } catch (statusError) {
        console.error("[EXAM] Unable to verify security submission:", statusError);
      }

      securitySubmittingRef.current = false;
      toast.error(error?.response?.data?.message || "Security submission failed. Return to the exam window.");
    }
  }, [attemptId, question?.id, selectedAnswers, onSubmitted]);

  useEffect(() => {
    securitySubmitRef.current = () => {
      void handleSecurityAutoSubmit();
    };
    return () => {
      securitySubmitRef.current = null;
    };
  }, [handleSecurityAutoSubmit]);

  /* ============================================================
     LOAD QUESTION
  ============================================================ */

  const loadQuestion = async (
    number: number
  ) => {
    if (
      number < 1 ||
      number > totalQuestions ||
      loadingQuestion
    ) {
      return;
    }

    try {
      setLoadingQuestion(true);

      const result =
        await getQuestion(
          attemptId,
          number
        );

      console.log(
        "[EXAM] Question response:",
        result
      );

      if (!result?.question) {
        throw new Error(
          "Question data is missing from server response."
        );
      }

      setQuestion(result.question);

      setCurrentQuestion(number);

      localStorage.setItem(
        `studentCurrentQuestion:${attemptId}`,
        String(number)
      );

      setRemainingSeconds(
        result.remainingSeconds
      );

      const serverAnswers =
        result.question.assessment_answers?.[0]?.selected_answers || [];
      const cachedAnswers = answerCacheRef.current[number];
      const answers =
        serverAnswers.length > 0 || cachedAnswers === undefined
          ? serverAnswers
          : cachedAnswers;

      answerCacheRef.current[number] = answers;
      setSelectedAnswers(answers);
    } catch (error: any) {
      console.error(
        "[EXAM] Question loading error:",
        error
      );

      toast.error(
        error?.message ||
          "Unable to load question."
      );
    } finally {
      setLoadingQuestion(false);
    }
  };

  /* ============================================================
     SAVE
  ============================================================ */

  const saveCurrentAnswer = async () => {
    /*
     * Important:
     * Question can temporarily be null while loading.
     */
    if (!question) {
      toast.error(
        "Question is not loaded."
      );

      return false;
    }

    try {
      setSaving(true);
      answerCacheRef.current[currentQuestion] = [...selectedAnswers];

      await saveAnswer(
        attemptId,
        question.id,
        selectedAnswers
      );

      await loadPalette();

      return true;
    } catch (error: any) {
      console.error(
        "[EXAM] Save answer error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save answer."
      );

      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleAnswerChange = useCallback((answers: string[]) => {
    setSelectedAnswers(answers);
    answerCacheRef.current[currentQuestion] = [...answers];
  }, [currentQuestion]);

  const handleQuestionSelect = async (number: number) => {
    if (number === currentQuestion) return;

    // Preserve the current answer before changing questions. This also makes
    // palette navigation behave like Save & Next / Previous.
    const saved = await saveCurrentAnswer();
    if (!saved) return;

    await loadQuestion(number);
  };

  /* ============================================================
     NEXT
  ============================================================ */

  const handleNext = async () => {
    const saved =
      await saveCurrentAnswer();

    if (!saved) {
      return;
    }

    if (
      currentQuestion < totalQuestions
    ) {
      await loadQuestion(
        currentQuestion + 1
      );
    }
  };

  /* ============================================================
     PREVIOUS
  ============================================================ */

  const handlePrevious = async () => {
    if (currentQuestion <= 1) return;

    const saved = await saveCurrentAnswer();
    if (!saved) return;

    await loadQuestion(currentQuestion - 1);
  };

  /* ============================================================
     SUBMIT
  ============================================================ */

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      /*
       * Save current answer before submitting.
       */
      const saved =
        await saveCurrentAnswer();

      if (!saved) {
        setSubmitting(false);
        return;
      }

      const result =
        await submitAssessment(
          attemptId
        );

      if (
        result.success === false &&
        !result.expired
      ) {
        throw new Error(
          result.message ||
            "Unable to submit assessment."
        );
      }

      toast.success(
        "Assessment submitted successfully."
      );

      onSubmitted();
    } catch (error: any) {
      console.error(
        "[EXAM] Submit error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to submit assessment."
      );
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
      console.error(
        "[EXAM] Fullscreen error:",
        error
      );
    }
  };

  /* ============================================================
     FULLSCREEN / WINDOW EXIT POLICY
  ============================================================ */

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);

      if (active) return;

      // The first Escape is a warning only. The second Escape within
      // the short grace window submits the attempt.
      if (escapeWarningRef.current) {
        return;
      }

      if (intentionalFullscreenExitRef.current) {
        intentionalFullscreenExitRef.current = false;
        escapeWarningRef.current = false;
        return;
      }

      // Fullscreen was exited by another method (mouse/browser control).
      // Treat that as leaving the exam and submit immediately.
      void reportInfraction("FULLSCREEN_EXIT");
      toast.error("Fullscreen was exited. Submitting your assessment.");
      void securitySubmitRef.current?.();

      escapeWarningRef.current = true;
      if (escapeResetTimerRef.current) {
        window.clearTimeout(escapeResetTimerRef.current);
      }
      escapeResetTimerRef.current = window.setTimeout(() => {
        escapeWarningRef.current = false;
      }, 1800);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      const now = Date.now();
      if (escapeResetTimerRef.current) {
        window.clearTimeout(escapeResetTimerRef.current);
      }

      escapeCountRef.current =
        now - lastEscapeAtRef.current <= 1800
          ? escapeCountRef.current + 1
          : 1;
      lastEscapeAtRef.current = now;

      if (escapeCountRef.current === 1) {
        toast.error("Warning: Escape detected. A second Escape will submit your assessment.");
        void reportInfraction("FULLSCREEN_EXIT");
        escapeWarningRef.current = true;
        escapeResetTimerRef.current = window.setTimeout(() => {
          escapeCountRef.current = 0;
          escapeWarningRef.current = false;
          lastEscapeAtRef.current = 0;
        }, 1800);
        return;
      }

      // Allow the browser's second Escape to leave fullscreen. The next
      // tab/window change is what triggers the actual security submission.
      escapeCountRef.current = 0;
      // Mark this fullscreenchange as the intentional second Escape so it
      // does not create another warning or immediate submission.
      intentionalFullscreenExitRef.current = true;
      escapeWarningRef.current = true;
      lastEscapeAtRef.current = 0;
      void reportInfraction("FULLSCREEN_EXIT");
      toast.error("Fullscreen exited. Switching tabs or leaving this window will submit the assessment.");
      escapeResetTimerRef.current = window.setTimeout(() => {
        escapeWarningRef.current = false;
        intentionalFullscreenExitRef.current = false;
      }, 700);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown, true);
      if (escapeResetTimerRef.current) {
        window.clearTimeout(escapeResetTimerRef.current);
      }
      intentionalFullscreenExitRef.current = false;
    };
  }, [reportInfraction]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void enterFullscreen();
    }, 300);
    return () => window.clearTimeout(timer);
  }, []);

  /* ============================================================
     VISIBILITY / TAB SWITCH
  ============================================================ */

  useEffect(() => {
    const handleVisibility = () => {
      const current = document.visibilityState;

      if (previousVisibility.current === "visible" && current === "hidden") {
        void reportInfraction("TAB_SWITCH");
        void securitySubmitRef.current?.();
      }

      previousVisibility.current = current;
    };

    const handleBlur = () => {
      // A real window blur means the student has left the exam window.
      // Fullscreen's own exit is handled separately so the first Escape remains a warning.
      if (document.visibilityState === "visible" && document.fullscreenElement) {
        void reportInfraction("WINDOW_BLUR");
        void securitySubmitRef.current?.();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [reportInfraction]);

  /* ============================================================
     ANTI-CHEAT — COPY / PASTE / KEYBOARD / CONTEXT MENU
  ============================================================ */

  useEffect(() => {
    const handleCopy = (
      event: ClipboardEvent
    ) => {
      event.preventDefault();

      void reportInfraction(
        "COPY_ATTEMPT"
      );

      toast.error(
        "Copying is not allowed during the examination."
      );
    };

    const handlePaste = (
      event: ClipboardEvent
    ) => {
      event.preventDefault();

      void reportInfraction(
        "PASTE_ATTEMPT"
      );

      toast.error(
        "Pasting is not allowed during the examination."
      );
    };

    const handleCut = (
      event: ClipboardEvent
    ) => {
      event.preventDefault();

      void reportInfraction(
        "CUT_ATTEMPT"
      );

      toast.error(
        "Cutting is not allowed during the examination."
      );
    };

    const handleContextMenu = (
      event: MouseEvent
    ) => {
      event.preventDefault();

      void reportInfraction(
        "CONTEXT_MENU"
      );

      toast.error(
        "Right-click is disabled during the examination."
      );
    };

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      const key =
        event.key.toLowerCase();

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
          (key === "i" ||
            key === "j" ||
            key === "c")) ||
        event.key === "F12";

      if (!blocked) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      void reportInfraction(
        "KEYBOARD_SHORTCUT"
      );

      toast.error(
        "This keyboard shortcut is disabled during the examination."
      );
    };

    document.addEventListener(
      "copy",
      handleCopy
    );

    document.addEventListener(
      "paste",
      handlePaste
    );

    document.addEventListener(
      "cut",
      handleCut
    );

    document.addEventListener(
      "contextmenu",
      handleContextMenu
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "copy",
        handleCopy
      );

      document.removeEventListener(
        "paste",
        handlePaste
      );

      document.removeEventListener(
        "cut",
        handleCut
      );

      document.removeEventListener(
        "contextmenu",
        handleContextMenu
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [reportInfraction]);

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-hidden">

      {/* ========================================================
          CONNECTION LOST
      ======================================================== */}

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
              Your connection to the examination
              server was interrupted. Please wait
              while we reconnect you.
            </p>

            <p className="mt-4 text-sm font-semibold text-amber-600">
              Reconnecting...
            </p>
          </div>
        </div>
      )}

      {/* ========================================================
          HEADER
      ======================================================== */}

      <ExamHeader
        assessmentTitle={assessmentTitle}
        studentName={studentName}
        remainingSeconds={remainingSeconds}
        onExpire={handleExpire}
      />

      {/* ========================================================
          MAIN CONTENT
      ======================================================== */}

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-[1500px] mx-auto p-4 lg:p-6">

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-6">

              {/* ==================================================
                  MAIN EXAM
              ================================================== */}

              <main className="min-w-0">

                <div className="flex items-center justify-between mb-4">

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Question{" "}
                      <span className="text-slate-900">
                        {currentQuestion}
                      </span>{" "}
                      of{" "}
                      <span className="text-slate-900">
                        {totalQuestions}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">

                    {/* =================================================
                        INFRACTION COUNT
                    ================================================= */}

                    {infractionCount > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">

                        <AlertTriangle size={14} />

                        {infractionCount} violation
                        {infractionCount !== 1
                          ? "s"
                          : ""}

                      </div>
                    )}

                    {/* =================================================
                        FULLSCREEN BUTTON
                    ================================================= */}

                    <button
                      type="button"
                      onClick={
                        enterFullscreen
                      }
                      className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <Maximize size={14} />

                      {isFullscreen
                        ? "Fullscreen Active"
                        : "Enter Fullscreen"}
                    </button>

                  </div>
                </div>

                {/* =================================================
                    ANTI-CHEAT WARNING
                ================================================= */}

                {warning && (
                  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">

                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

                      <div className="mb-4">

                        <h2
                          className={`text-xl font-bold ${
                            disqualified
                              ? "text-red-600"
                              : "text-amber-600"
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
                            {infractionCount} /{" "}
                            {maxInfractions}
                          </span>

                        </div>

                      </div>

                      {!disqualified && (
                        <button
                          type="button"
                          onClick={
                            dismissWarning
                          }
                          className="w-full rounded-xl bg-[#00629B] px-4 py-3 font-semibold text-white"
                        >
                          I Understand
                        </button>
                      )}

                      {disqualified && (
                        <button
                          type="button"
                          onClick={() => {
                            window.location.href =
                              "/student";
                          }}
                          className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white"
                        >
                          Exit Assessment
                        </button>
                      )}

                    </div>
                  </div>
                )}

                {/* =================================================
                    QUESTION
                ================================================= */}

                {loadingQuestion ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-16 flex items-center justify-center">

                    <div className="text-center">

                      <div className="w-8 h-8 border-3 border-slate-200 border-t-[#00629B] rounded-full animate-spin mx-auto" />

                      <p className="text-sm text-slate-400 mt-4">
                        Loading question...
                      </p>

                    </div>

                  </div>
                ) : question ? (
                  <QuestionCard
                    question={question}
                    selectedAnswers={
                      selectedAnswers
                    }
                    onChange={
                      handleAnswerChange
                    }
                  />
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-16 flex items-center justify-center">

                    <div className="text-center">

                      <AlertTriangle
                        className="mx-auto text-amber-500"
                        size={32}
                      />

                      <p className="text-sm text-slate-500 mt-4">
                        Question could not be loaded.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          loadQuestion(
                            currentQuestion
                          )
                        }
                        className="mt-4 rounded-xl bg-[#00629B] px-5 py-2 text-sm font-semibold text-white"
                      >
                        Retry
                      </button>

                    </div>

                  </div>
                )}

                {/* =================================================
                    NAVIGATION
                ================================================= */}

                <div className="mt-5">

                  <ExamNavigation
                    currentQuestion={
                      currentQuestion
                    }
                    totalQuestions={
                      totalQuestions
                    }
                    saving={saving}
                    onPrevious={
                      handlePrevious
                    }
                    onNext={handleNext}
                    onSaveAndNext={
                      handleNext
                    }
                  />

                </div>

              </main>

              {/* ==================================================
                  SIDEBAR
              ================================================== */}

              <aside className="space-y-5">

                {/* =================================================
                    EXAM STATUS
                ================================================= */}

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
                            connected
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />

                      </div>

                      <p className="text-xs text-slate-400 mt-0.5">

                        {connected
                          ? reconnectCount > 0
                            ? `Connection restored • ${reconnectCount} reconnect${
                                reconnectCount !== 1
                                  ? "s"
                                  : ""
                              }`
                            : "Live connection active"
                          : reconnecting
                          ? "Reconnecting..."
                          : "Connection lost"}

                      </p>

                    </div>

                  </div>

                </div>

                {/* =================================================
                    QUESTION PALETTE
                ================================================= */}

                <QuestionPalette
                  palette={palette}
                  currentQuestion={
                    currentQuestion
                  }
                  onSelect={handleQuestionSelect}
                />

                {/* =================================================
                    SUBMIT BUTTON
                ================================================= */}

                <button
                  type="button"
                  onClick={() =>
                    setSubmitOpen(true)
                  }
                  className="w-full h-12 rounded-xl bg-[#00629B] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#00527f] transition"
                >
                  <Send size={17} />
                  Submit Assessment
                </button>

                {/* =================================================
                    INFORMATION
                ================================================= */}

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                  <div className="flex gap-3">

                    <Flag
                      size={17}
                      className="text-amber-600 shrink-0"
                    />

                    <p className="text-xs leading-5 text-amber-800">
                      Make sure you have answered
                      all required questions before
                      submitting.
                    </p>

                  </div>

                </div>

              </aside>

            </div>

          </div>
        </div>
      </div>

      {/* ========================================================
          SUBMIT MODAL
      ======================================================== */}

      <SubmitExamModal
        open={submitOpen}
        answered={
          palette.filter(
            (item) => item.answered
          ).length
        }
        total={totalQuestions}
        submitting={submitting}
        onClose={() =>
          setSubmitOpen(false)
        }
        onConfirm={handleSubmit}
      />

    </div>
  );
}