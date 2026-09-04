import { useCallback, useEffect, useState } from "react";
import { Clock3, Maximize, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

import StudentExam from "./StudentExam";
import StudentLogin from "./StudentLogin";
import VerifyOtp from "./VerifyOtp";
import ExamInstructions from "./ExamInstructions";

import {
  checkAssessment,
  resumeAssessment,
  startAssessment,
} from "../api/studenExamApi";

import type { AttemptQuestion } from "../types";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface Props {
  assessmentId: string;
  onStartExam: (assessmentId: string) => void;
}

/*
 * Keep this assessment type local to the student portal.
 *
 * Student/types.ts does not export Assessment.
 * ExamInstructions only needs these assessment properties.
 */
interface StudentAssessment {
  id?: string;
  title: string;
  description?: string | null;

  total_questions: number;
  duration_minutes: number;

  marks_per_question?: number;
  negative_marks?: number;
  pass_percentage?: number;
  passing_score?: number;

  is_active: boolean;
  status?: string;
  is_published?: boolean;

  created_at?: string;

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

type Step =
  | "loading"
  | "login"
  | "otp"
  | "instructions"
  | "launch-gate"
  | "submitted";

type ExamStatus = "NOT_STARTED" | "LIVE" | "CLOSED";

interface ExamData {
  attemptId: string;
  totalQuestions: number;
  currentQuestion: number;
  remainingSeconds: number;
  question: AttemptQuestion;
}

interface ExamLaunchData extends ExamData {
  assessmentTitle: string;
  sessionId?: string;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const isExamWindow = (): boolean => {
  try {
    const params = new URLSearchParams(window.location.search);

    return params.get("examWindow") === "1";
  } catch {
    return false;
  }
};

const isLaunchGate = (): boolean => {
  try {
    const params = new URLSearchParams(window.location.search);

    return params.get("launchGate") === "1";
  } catch {
    return false;
  }
};

const getLaunchTitle = (): string => {
  try {
    const params = new URLSearchParams(window.location.search);

    return params.get("assessmentTitle") || "Assessment";
  } catch {
    return "Assessment";
  }
};

const getLaunchAttemptId = (): string | null => {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("attemptId") || null;
  } catch {
    return null;
  }
};

const getStudentName = (): string => {
  try {
    const raw = localStorage.getItem("student");

    if (!raw) {
      return "Student";
    }

    const student = JSON.parse(raw);

    return (
      student?.name || student?.full_name || student?.student_name || "Student"
    );
  } catch {
    return "Student";
  }
};

/* -------------------------------------------------------------------------- */
/* Fullscreen start gate                                                     */
/* -------------------------------------------------------------------------- */

function FullscreenStartGate({
  assessmentTitle,
  onStart,
}: {
  assessmentTitle: string;
  onStart: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00629B]/10 text-[#00629B]">
          <ShieldCheck className="h-7 w-7" />
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Secure Examination
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {assessmentTitle}
        </h1>

        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-left">
          <div className="flex items-start gap-3">
            <Maximize className="mt-0.5 h-5 w-5 shrink-0 text-[#00629B]" />
            <div>
              <p className="font-semibold text-slate-800">
                Enter fullscreen to begin
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                The examination timer and secure monitoring begin only after you
                click the button below.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00629B] px-5 py-3.5 font-semibold text-white transition hover:bg-[#004f7d] focus:outline-none focus:ring-2 focus:ring-[#00629B]/40"
        >
          <Maximize className="h-5 w-5" />
          Enter Fullscreen &amp; Start
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Clock3 className="h-4 w-4" />
          Timer starts after this click
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Submitted page                                                             */
/* -------------------------------------------------------------------------- */

function SubmittedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl">
          ✓
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          Assessment Submitted
        </h1>

        <p className="mt-2 text-slate-500">
          Your assessment has been submitted successfully.
        </p>

        <p className="mt-4 text-sm text-slate-400">You may close this page.</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Student Exam Portal                                                        */
/* -------------------------------------------------------------------------- */

export default function StudentExamPortal({
  assessmentId,
  onStartExam,
}: Props) {
  const examWindow = isExamWindow();
  const launchGate = examWindow && isLaunchGate();
  const urlAttemptId = examWindow ? getLaunchAttemptId() : null;
  const gateRequired = examWindow && (launchGate || Boolean(urlAttemptId));

  const [step, setStep] = useState<Step>("loading");

  const [assessment, setAssessment] = useState<StudentAssessment | null>(null);

  const [examStatus, setExamStatus] = useState<ExamStatus>("NOT_STARTED");

  const [countdown, setCountdown] = useState<number>(0);

  const [email, setEmail] = useState<string>("");

  const [examData, setExamData] = useState<ExamData | null>(null);

  const [startingExam, setStartingExam] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* Finish / submitted                                                       */
  /* ------------------------------------------------------------------------ */

  const completeExam = useCallback(
    (attemptId?: string) => {
      setExamData(null);
      setStep("submitted");

      /*
       * Clean only temporary attempt data.
       */
      localStorage.removeItem("studentAttemptId");

      if (attemptId) {
        localStorage.removeItem(`studentExamLaunch:${attemptId}`);

        localStorage.removeItem(`studentCurrentQuestion:${attemptId}`);

        sessionStorage.removeItem(`quiz_session_${attemptId}`);

        localStorage.removeItem(`quiz_session_${attemptId}`);
      }

      /*
       * The completion flag is intentionally removed
       * after this page receives it.
       */
      localStorage.removeItem(`assessmentCompleted:${assessmentId}`);
    },
    [assessmentId],
  );

  /* ------------------------------------------------------------------------ */
  /* Listen for submission from exam popup                                    */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    /*
     * The exam popup itself does not need to listen
     * to its own parent-message events.
     */
    if (examWindow) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      /*
       * Only accept messages from this website.
       */
      if (event.origin !== window.location.origin) {
        return;
      }

      const data = event.data;

      if (!data || data.type !== "ASSESSMENT_SUBMITTED") {
        return;
      }

      if (String(data.assessmentId) !== String(assessmentId)) {
        return;
      }

      completeExam(data.attemptId ? String(data.attemptId) : undefined);
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [assessmentId, completeExam, examWindow]);

  /* ------------------------------------------------------------------------ */
  /* Cross-tab submission listener                                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (examWindow) {
      return;
    }

    const key = `assessmentCompleted:${assessmentId}`;

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key || !event.newValue) {
        return;
      }

      completeExam(event.newValue);
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [assessmentId, completeExam, examWindow]);

  /* ------------------------------------------------------------------------ */
  /* Start examination                                                        */
  /* ------------------------------------------------------------------------ */

  const handleStartExam = () => {
    if (examStatus !== "LIVE") {
      toast.error("The examination is not live yet.");
      return;
    }

    /*
     * IMPORTANT: open the popup synchronously from the Start Exam click.
     * No API request is made here. The server-side attempt (and therefore
     * the real exam timer) is created only after the student clicks
     * "Enter Fullscreen & Start" inside the exam window.
     */
    const width = Math.max(
      1024,
      window.screen.availWidth || window.innerWidth || 1024,
    );
    const height = Math.max(
      700,
      window.screen.availHeight || window.innerHeight || 700,
    );

    const examPopup = window.open(
      "about:blank",
      "student-exam-window",
      [
        "popup=yes",
        `width=${width}`,
        `height=${height}`,
        "left=0",
        "top=0",
        "menubar=no",
        "toolbar=no",
        "location=no",
        "status=no",
        "scrollbars=yes",
        "resizable=yes",
      ].join(","),
    );

    if (!examPopup) {
      toast.error(
        "Please allow pop-ups for this website and click Start Exam again.",
      );
      return;
    }

    try {
      examPopup.document.title = "Ready to Start Examination";
      examPopup.document.body.innerHTML = `
        <div style="font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;color:#0f172a">
          <div style="text-align:center">
            <div style="font-size:20px;font-weight:700">Preparing examination...</div>
            <div style="margin-top:8px;font-size:14px;color:#64748b">Please wait.</div>
          </div>
        </div>`;
      examPopup.focus();
      try {
        examPopup.moveTo(0, 0);
        examPopup.resizeTo(width, height);
      } catch {
        // Browser may block move/resize.
      }
    } catch {
      // Ignore popup document access errors.
    }

    const examUrl = new URL(
      `${window.location.origin}/student/exam/${assessmentId}`,
    );
    examUrl.searchParams.set("examWindow", "1");
    examUrl.searchParams.set("launchGate", "1");
    examUrl.searchParams.set(
      "assessmentTitle",
      assessment?.title || "Assessment",
    );

    /*
     * Navigate the already-open popup. The popup now contains only the
     * fullscreen gate; startAssessment() is deliberately NOT called here.
     */
    examPopup.location.replace(examUrl.toString());
    examPopup.focus();
  };

  /* ------------------------------------------------------------------------ */
  /* Fullscreen gate / actual attempt start                                   */
  /* ------------------------------------------------------------------------ */

  const handleFullscreenAndStart = async () => {
    if (!examWindow || !gateRequired || examData || startingExam) return;

    setStartingExam(true);

    try {
      /*
       * This request is intentionally the first async-sensitive operation in
       * the click handler. It is therefore still tied to the student's direct
       * click and Chrome/Edge can grant fullscreen.
       */
      if (!document.fullscreenElement) {
        if (!document.fullscreenEnabled) {
          throw new Error(
            "Fullscreen is not available in this browser window.",
          );
        }

        await document.documentElement.requestFullscreen();
      }

      setStep("loading");

      const existingAttemptId = getLaunchAttemptId();
      const result = existingAttemptId
        ? await resumeAssessment(assessmentId, existingAttemptId)
        : await startAssessment(assessmentId);

      if (!result?.attemptId || !result?.question) {
        throw new Error(
          "Assessment started but the first question could not be loaded.",
        );
      }

      const attemptId = String(result.attemptId);
      const totalQuestions = Math.max(0, Number(result.totalQuestions || 0));
      const currentQuestion = Math.max(1, Number(result.currentQuestion || 1));
      const remaining = Math.max(0, Number(result.remainingSeconds || 0));

      const launchData: ExamLaunchData = {
        attemptId,
        totalQuestions,
        currentQuestion,
        remainingSeconds: remaining,
        question: result.question,
        assessmentTitle: assessment?.title || getLaunchTitle(),
        sessionId: (result as any).sessionId,
      };

      localStorage.setItem(
        `studentExamLaunch:${attemptId}`,
        JSON.stringify(launchData),
      );
      localStorage.setItem("studentAttemptId", attemptId);
      localStorage.setItem(
        `studentCurrentQuestion:${attemptId}`,
        String(currentQuestion),
      );

      if ((result as any).sessionId) {
        sessionStorage.setItem(
          `quiz_session_${attemptId}`,
          String((result as any).sessionId),
        );
        localStorage.setItem(
          `quiz_session_${attemptId}`,
          String((result as any).sessionId),
        );
      }

      onStartExam(assessmentId);

      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("launchGate");
      cleanUrl.searchParams.set("attemptId", attemptId);
      window.history.replaceState({}, "", cleanUrl.toString());

      setAssessment(
        (current) =>
          current || {
            id: assessmentId,
            title: getLaunchTitle(),
            total_questions: totalQuestions,
            duration_minutes: Math.ceil(remaining / 60),
            is_active: true,
            is_published: true,
          },
      );

      setExamData({
        attemptId,
        totalQuestions,
        currentQuestion,
        remainingSeconds: remaining,
        question: result.question,
      });

      setExamStatus("LIVE");
      setStep("instructions");
    } catch (error: any) {
      console.error("[EXAM PORTAL] Fullscreen/start error:", error);

      /* If the fullscreen request succeeded but starting failed, leave the
       * gate usable and don't create a half-started exam UI. */
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
      } catch {
        // Ignore exit errors.
      }

      setStep("launch-gate");
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to start assessment.",
      );
    } finally {
      setStartingExam(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Load portal                                                              */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      /*
       * ==============================================================
       * EXAM POPUP
       * ==============================================================
       */
      if (examWindow) {
        const currentAttemptId = urlAttemptId;

        /*
         * A newly opened exam window starts at the fullscreen gate. No
         * attempt is created until the student clicks the gate button.
         * This is what makes the fullscreen request browser-compliant and
         * ensures the real exam timer starts only after that click.
         *
         * A refresh of an already-started exam also returns to this gate.
         * That prevents the timer/anti-cheat UI from restarting outside
         * fullscreen after a browser refresh.
         */
        if (launchGate || currentAttemptId) {
          if (!mounted) return;
          setAssessment(
            (current) =>
              current || {
                id: assessmentId,
                title: getLaunchTitle(),
                total_questions: 0,
                duration_minutes: 0,
                is_active: true,
                is_published: true,
              },
          );
          setExamStatus("LIVE");
          setStep("launch-gate");
          return;
        }

        const attemptId = getLaunchAttemptId();

        if (!attemptId) {
          console.error("[EXAM PORTAL] No attempt ID in exam window.");
          toast.error("Exam session could not be found.");
          setStep("submitted");
          return;
        }

        const rawLaunch = localStorage.getItem(
          `studentExamLaunch:${attemptId}`,
        );

        if (!rawLaunch) {
          /* A refresh can lose in-memory React state. Put the window back on
           * the fullscreen gate so the user can explicitly re-establish
           * fullscreen before we resume the server-side attempt. */
          if (!mounted) return;
          setAssessment(
            (current) =>
              current || {
                id: assessmentId,
                title: getLaunchTitle(),
                total_questions: 0,
                duration_minutes: 0,
                is_active: true,
                is_published: true,
              },
          );
          setExamStatus("LIVE");
          setStep("launch-gate");
          return;
        }

        try {
          const launch = JSON.parse(rawLaunch) as ExamLaunchData;

          if (launch.sessionId) {
            sessionStorage.setItem(
              `quiz_session_${attemptId}`,
              launch.sessionId,
            );
            localStorage.setItem(`quiz_session_${attemptId}`, launch.sessionId);
          }

          const popupAssessment: StudentAssessment = {
            id: assessmentId,
            title: launch.assessmentTitle || "Assessment",
            total_questions: launch.totalQuestions,
            duration_minutes: Math.ceil(launch.remainingSeconds / 60),
            is_active: true,
            is_published: true,
            start_time: new Date().toISOString(),
            end_time: new Date(
              Date.now() + launch.remainingSeconds * 1000,
            ).toISOString(),
          };

          if (!mounted) return;

          setAssessment(popupAssessment);
          setExamStatus("LIVE");
          setExamData({
            attemptId: launch.attemptId,
            totalQuestions: launch.totalQuestions,
            currentQuestion: launch.currentQuestion,
            remainingSeconds: launch.remainingSeconds,
            question: launch.question,
          });
          setStep("instructions");
          return;
        } catch (error) {
          console.error("[EXAM PORTAL] Invalid launch data:", error);
          toast.error("Invalid examination session.");
          setStep("submitted");
          return;
        }
      }

      /*
       * ==============================================================
       * ORIGINAL / PARENT WINDOW
       * ==============================================================
       */

      try {
        const result = await checkAssessment(assessmentId);

        if (!mounted) {
          return;
        }

        const loaded = result?.assessment as StudentAssessment | undefined;

        if (!loaded) {
          throw new Error("Assessment information could not be loaded.");
        }

        setAssessment(loaded);

        const now = Date.now();

        const start = loaded.start_time
          ? new Date(loaded.start_time).getTime()
          : NaN;

        const end = loaded.end_time ? new Date(loaded.end_time).getTime() : NaN;

        /*
         * If dates are invalid, don't crash the page.
         */
        if (Number.isNaN(start) || Number.isNaN(end)) {
          console.error("[EXAM PORTAL] Invalid assessment schedule.");

          setExamStatus("CLOSED");

          setCountdown(0);
          setStep("login");

          return;
        }

        if (now < start) {
          setExamStatus("NOT_STARTED");

          setCountdown(Math.max(0, Math.floor((start - now) / 1000)));
        } else if (now < end) {
          setExamStatus("LIVE");

          setCountdown(0);
        } else {
          setExamStatus("CLOSED");

          setCountdown(0);
        }

        setStep("login");
      } catch (error: any) {
        console.error("[EXAM PORTAL] Assessment load error:", error);

        if (!mounted) {
          return;
        }

        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load assessment.",
        );

        setStep("login");
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [assessmentId, examWindow]);

  /* ------------------------------------------------------------------------ */
  /* Parent countdown                                                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (examWindow || !assessment) {
      return;
    }

    const update = () => {
      const now = Date.now();

      const start = assessment.start_time
        ? new Date(assessment.start_time).getTime()
        : NaN;

      const end = assessment.end_time
        ? new Date(assessment.end_time).getTime()
        : NaN;

      if (Number.isNaN(start) || Number.isNaN(end)) {
        setExamStatus("CLOSED");

        setCountdown(0);

        return;
      }

      if (now < start) {
        setExamStatus("NOT_STARTED");

        setCountdown(Math.max(0, Math.floor((start - now) / 1000)));

        return;
      }

      if (now < end) {
        setExamStatus("LIVE");

        setCountdown(0);

        return;
      }

      setExamStatus("CLOSED");

      setCountdown(0);
    };

    update();

    const interval = window.setInterval(update, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [assessment, examWindow]);

  /* ------------------------------------------------------------------------ */
  /* Submitted                                                                */
  /* ------------------------------------------------------------------------ */

  if (step === "submitted") {
    return <SubmittedPage />;
  }

  /* ------------------------------------------------------------------------ */
  /* Exam popup fullscreen gate                                               */
  /* ------------------------------------------------------------------------ */

  if (examWindow && gateRequired && step === "launch-gate") {
    return (
      <FullscreenStartGate
        assessmentTitle={assessment?.title || getLaunchTitle()}
        onStart={handleFullscreenAndStart}
      />
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Exam popup                                                               */
  /* ------------------------------------------------------------------------ */

  if (examWindow && examData && assessment) {
    return (
      <StudentExam
        assessmentId={assessmentId}
        attemptId={examData.attemptId}
        assessmentTitle={assessment.title}
        studentName={getStudentName()}
        totalQuestions={examData.totalQuestions}
        firstQuestion={examData.question}
        remainingSeconds={examData.remainingSeconds}
        onSubmitted={() => {
          const attemptId = examData.attemptId;

          /*
           * Notify parent using localStorage.
           */
          localStorage.setItem(
            `assessmentCompleted:${assessmentId}`,
            attemptId,
          );

          /*
           * Notify parent directly as well.
           */
          try {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(
                {
                  type: "ASSESSMENT_SUBMITTED",

                  assessmentId,

                  attemptId,
                },
                window.location.origin,
              );
            }
          } catch (error) {
            console.warn("[EXAM PORTAL] Parent notification failed:", error);
          }

          /*
           * Clean temporary exam data.
           */
          localStorage.removeItem("studentAttemptId");

          localStorage.removeItem(`studentCurrentQuestion:${attemptId}`);

          localStorage.removeItem(`studentExamLaunch:${attemptId}`);

          sessionStorage.removeItem(`quiz_session_${attemptId}`);

          localStorage.removeItem(`quiz_session_${attemptId}`);

          /*
           * Give the parent a short time to process
           * postMessage/storage before closing.
           */
          window.setTimeout(() => {
            try {
              window.close();
            } catch {
              /*
               * Ignore browser close restrictions.
               */
            }
          }, 300);
        }}
      />
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#00629B]" />

          <p className="mt-4 text-sm text-slate-500">Loading assessment...</p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Assessment unavailable                                                   */
  /* ------------------------------------------------------------------------ */

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Assessment unavailable.
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Login                                                                    */
  /* ------------------------------------------------------------------------ */

  if (step === "login") {
    return (
      <StudentLogin
        assessmentId={assessmentId}
        assessmentTitle={assessment.title}
        loginMethod={assessment.login_method === "OTP" ? "OTP" : "PASSWORD"}
        onLoggedIn={() => {
          setStep("instructions");
        }}
        onOtpSent={(studentEmail) => {
          setEmail(studentEmail);

          setStep("otp");
        }}
      />
    );
  }

  /* ------------------------------------------------------------------------ */
  /* OTP                                                                      */
  /* ------------------------------------------------------------------------ */

  if (step === "otp") {
    return (
      <VerifyOtp
        assessmentId={assessmentId}
        email={email}
        onVerified={() => {
          setStep("instructions");
        }}
        onBack={() => {
          setStep("login");
        }}
      />
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Instructions / Start Exam                                                */
  /* ------------------------------------------------------------------------ */

  return (
    <ExamInstructions
      assessment={assessment as any}
      onStart={handleStartExam}
      examStatus={examStatus}
      countdown={countdown}
    />
  );
}
