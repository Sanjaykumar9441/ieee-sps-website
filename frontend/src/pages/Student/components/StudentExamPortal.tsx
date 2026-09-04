import { useCallback, useEffect, useState } from "react";
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

type Step = "loading" | "login" | "otp" | "instructions" | "submitted";

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

const getLaunchAttemptId = (): string | null => {
  try {
    const params = new URLSearchParams(window.location.search);

    return params.get("attemptId") || localStorage.getItem("studentAttemptId");
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

  const [step, setStep] = useState<Step>("loading");

  const [assessment, setAssessment] = useState<StudentAssessment | null>(null);

  const [examStatus, setExamStatus] = useState<ExamStatus>("NOT_STARTED");

  const [countdown, setCountdown] = useState<number>(0);

  const [email, setEmail] = useState<string>("");

  const [examData, setExamData] = useState<ExamData | null>(null);

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

  const handleStartExam = async () => {
    if (examStatus !== "LIVE") {
      toast.error("The examination is not live yet.");

      return;
    }

    /*
     * Open popup immediately from the user's click.
     *
     * If we wait for the API request first,
     * Chrome/Edge may block the popup.
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
        "fullscreen=yes",
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

    /*
     * Show loading state inside popup immediately.
     */
    try {
      examPopup.document.title = "Opening Examination...";

      examPopup.document.body.innerHTML = `
        <div
          style="
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f8fafc;
            color: #334155;
          "
        >
          <div style="text-align:center">
            <div
              style="
                font-size:20px;
                font-weight:600;
              "
            >
              Opening examination...
            </div>

            <div
              style="
                margin-top:8px;
                font-size:14px;
                color:#64748b;
              "
            >
              Please wait.
            </div>
          </div>
        </div>
      `;

      examPopup.focus();

      /*
       * Ask the newly opened exam window to enter fullscreen immediately.
       * This is the earliest possible point after the user's Start Exam
       * click. Browser security may still reject it; the exam page keeps
       * an explicit Enter Fullscreen button as the standards-compliant
       * fallback.
       */
      try {
        const popupDocument = examPopup.document;
        if (
          popupDocument.fullscreenEnabled &&
          typeof popupDocument.documentElement.requestFullscreen === "function"
        ) {
          void popupDocument.documentElement
            .requestFullscreen({ navigationUI: "hide" })
            .catch(() => undefined);
        }
      } catch {
        // Browser may deny fullscreen for a newly opened window.
      }

      try {
        examPopup.moveTo(0, 0);
        examPopup.resizeTo(width, height);
      } catch {
        /*
         * Browser may block move/resize.
         */
      }
    } catch {
      /*
       * Ignore popup document errors.
       */
    }

    try {
      /*
       * Create server-side attempt.
       */
      const result = await startAssessment(assessmentId);

      if (!result?.success || !result?.attemptId || !result?.question) {
        throw new Error(
          result?.message ||
            "Assessment started but the first question could not be loaded.",
        );
      }

      const attemptId = String(result.attemptId);

      const launchData: ExamLaunchData = {
        attemptId,

        totalQuestions: Math.max(0, Number(result.totalQuestions || 0)),

        currentQuestion: Math.max(1, Number(result.currentQuestion || 1)),

        remainingSeconds: Math.max(0, Number(result.remainingSeconds || 0)),

        question: result.question,

        assessmentTitle: assessment?.title || "Assessment",

        sessionId: result.sessionId,
      };

      /*
       * Save all launch information before loading
       * the exam application in the popup.
       */
      localStorage.setItem(
        `studentExamLaunch:${attemptId}`,
        JSON.stringify(launchData),
      );

      localStorage.setItem("studentAttemptId", attemptId);

      localStorage.setItem(
        `studentCurrentQuestion:${attemptId}`,
        String(launchData.currentQuestion),
      );

      /*
       * startAssessment() already saves sessionId,
       * but save it again here to guarantee the popup
       * can restore the session.
       */
      if (result.sessionId) {
        sessionStorage.setItem(
          `quiz_session_${attemptId}`,
          String(result.sessionId),
        );

        localStorage.setItem(
          `quiz_session_${attemptId}`,
          String(result.sessionId),
        );
      }

      /*
       * Notify the parent application.
       */
      onStartExam(assessmentId);

      /*
       * Navigate ONLY the popup.
       *
       * The original Start Exam page stays open.
       */
      const examUrl = new URL(
        `${window.location.origin}/student/exam/${assessmentId}`,
      );

      examUrl.searchParams.set("examWindow", "1");

      examUrl.searchParams.set("attemptId", attemptId);

      examPopup.location.replace(examUrl.toString());

      examPopup.focus();
    } catch (error: any) {
      console.error("[EXAM PORTAL] Start error:", error);

      try {
        examPopup.close();
      } catch {
        /*
         * Ignore close errors.
         */
      }

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to start assessment.",
      );
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
          console.error("[EXAM PORTAL] Launch data missing.");

          toast.error("Exam session could not be restored.");

          setStep("submitted");

          return;
        }

        try {
          const launch = JSON.parse(rawLaunch) as ExamLaunchData;

          /*
           * Restore session token.
           */
          if (launch.sessionId) {
            sessionStorage.setItem(
              `quiz_session_${attemptId}`,
              launch.sessionId,
            );

            localStorage.setItem(`quiz_session_${attemptId}`, launch.sessionId);
          }

          /*
           * Create the minimal assessment object
           * needed by StudentExam/ExamInstructions.
           *
           * The actual exam timer is controlled by StudentExam.
           */
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

          if (!mounted) {
            return;
          }

          setAssessment(popupAssessment);

          setExamStatus("LIVE");

          setExamData({
            attemptId: launch.attemptId,

            totalQuestions: launch.totalQuestions,

            currentQuestion: launch.currentQuestion,

            remainingSeconds: launch.remainingSeconds,

            question: launch.question,
          });

          /*
           * StudentExam is rendered from examData.
           *
           * Do not send popup through login/instructions.
           */
          setStep("instructions");

          /*
           * Restore the latest question/answer from the server.
           *
           * IMPORTANT:
           *
           * resumeAssessment() returns:
           * attemptId
           * totalQuestions
           * currentQuestion
           * remainingSeconds
           * question
           *
           * It does NOT return status/sessionId.
           */
          try {
            const resumed = await resumeAssessment(assessmentId, attemptId);

            if (!mounted) {
              return;
            }

            setExamData({
              attemptId: String(resumed.attemptId),

              totalQuestions: Math.max(
                0,
                Number(resumed.totalQuestions || launch.totalQuestions || 0),
              ),

              currentQuestion: Math.max(
                1,
                Number(resumed.currentQuestion || launch.currentQuestion || 1),
              ),

              remainingSeconds: Math.max(
                0,
                Number(resumed.remainingSeconds || 0),
              ),

              question: resumed.question,
            });
          } catch (error) {
            /*
             * Do NOT immediately destroy the launch data.
             *
             * StudentExam performs its own status synchronization.
             */
            console.warn(
              "[EXAM PORTAL] Resume request failed; using launch data.",
              error,
            );
          }

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
