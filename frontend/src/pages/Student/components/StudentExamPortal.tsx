import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import StudentExam from "./StudentExam";
import StudentLogin from "../components/StudentLogin";
import VerifyOtp from "../components/VerifyOtp";
import ExamInstructions from "../components/ExamInstructions";

import {
  checkAssessment,
  resumeAssessment,
  startAssessment,
} from "../api/studenExamApi";

import type { Assessment } from "../types";

interface Props {
  assessmentId: string;
  onStartExam: (assessmentId: string) => void;
}

type Step = "loading" | "login" | "otp" | "instructions";
type ExamStatus = "NOT_STARTED" | "LIVE" | "CLOSED";

interface ExamData {
  attemptId: string;
  totalQuestions: number;
  currentQuestion: number;
  remainingSeconds: number;
  question: any;
}

const isExamWindow = () =>
  new URLSearchParams(window.location.search).get("examWindow") === "1";

export default function StudentExamPortal({
  assessmentId,
  onStartExam,
}: Props) {
  const [step, setStep] = useState<Step>("loading");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [examStatus, setExamStatus] = useState<ExamStatus>("NOT_STARTED");
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState("");
  const [examData, setExamData] = useState<ExamData | null>(null);

  const handleStartExam = async () => {
    if (examStatus !== "LIVE") {
      toast.error("The examination has not started yet.");
      return;
    }

    // Open synchronously from the user click so Edge treats it as a user-initiated
    // popup instead of blocking it after the asynchronous API request.
    const width = Math.max(1024, window.screen.availWidth || window.innerWidth);
    const height = Math.max(700, window.screen.availHeight || window.innerHeight);
    const examWindow = window.open(
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
        "location=yes",
        "status=no",
        "scrollbars=yes",
        "resizable=yes",
      ].join(","),
    );

    if (!examWindow) {
      toast.error(
        "The exam window was blocked. Please allow pop-ups for this site and click Start Exam again.",
      );
      return;
    }

    examWindow.document.title = "Examination";
    examWindow.document.body.innerHTML =
      '<div style="font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#334155"><div style="text-align:center"><div style="font-size:18px;font-weight:600">Opening examination...</div><div style="margin-top:8px;color:#64748b">Please wait.</div></div></div>';

    try {
      const result = await startAssessment(assessmentId);

      if (!result?.attemptId) {
        throw new Error("Assessment started but no attempt was created.");
      }

      // The exam is intentionally rendered only in the dedicated window.
      // The original instructions window must never render StudentExam.
      onStartExam(assessmentId);
      examWindow.location.replace(
        `${window.location.origin}/student/exam/${assessmentId}?examWindow=1`,
      );
      examWindow.focus();
    } catch (err: any) {
      console.error("[EXAM] Unable to start:", err);
      try {
        examWindow.close();
      } catch {
        // Ignore browsers that prevent scripts from closing a window.
      }

      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to start assessment.",
      );
    }
  };

  useEffect(() => {
    if (!assessment) return;

    const startTime = new Date(assessment.start_time).getTime();
    const endTime = new Date(assessment.end_time).getTime();

    const updateExamStatus = () => {
      const now = Date.now();

      if (now < startTime) {
        const remaining = Math.max(
          0,
          Math.floor((startTime - now) / 1000),
        );

        setCountdown(remaining);
        setExamStatus("NOT_STARTED");
        return;
      }

      if (now >= startTime && now < endTime) {
        setCountdown(0);
        setExamStatus("LIVE");
        return;
      }

      setCountdown(0);
      setExamStatus("CLOSED");
    };

    updateExamStatus();

    const interval = window.setInterval(updateExamStatus, 1000);

    return () => window.clearInterval(interval);
  }, [assessment]);

  useEffect(() => {
    let mounted = true;

    const loadAssessment = async () => {
      try {
        const result = await checkAssessment(assessmentId);

        if (!mounted) return;

        const loadedAssessment = result.assessment;
        setAssessment(loadedAssessment);

        const now = Date.now();
        const startTime = new Date(loadedAssessment.start_time).getTime();
        const endTime = new Date(loadedAssessment.end_time).getTime();

        if (now < startTime) {
          setExamStatus("NOT_STARTED");
          setCountdown(
            Math.max(0, Math.floor((startTime - now) / 1000)),
          );
        } else if (now < endTime) {
          setExamStatus("LIVE");
          setCountdown(0);
        } else {
          setExamStatus("CLOSED");
          setCountdown(0);
        }

        // Only the dedicated exam window may resume/render an active attempt.
        // This prevents the original login/instructions tab from also opening
        // the exam after Start Exam has created the attempt.
        if (isExamWindow()) {
          const savedAttemptId = localStorage.getItem("studentAttemptId");

          if (savedAttemptId && now >= startTime && now < endTime) {
            try {
              const resumed = await resumeAssessment(
                assessmentId,
                savedAttemptId,
              );

              if (!mounted) return;

              setExamData(resumed);
              return;
            } catch (resumeError) {
              console.log("[EXAM] No active attempt to resume.", resumeError);

              localStorage.removeItem("studentAttemptId");
              localStorage.removeItem(
                `studentCurrentQuestion:${savedAttemptId}`,
              );
            }
          }
        }

        setStep("login");
      } catch (err: any) {
        console.error("[EXAM] Unable to load assessment:", err);

        if (!mounted) return;

        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load assessment.",
        );

        setStep("login");
      }
    };

    loadAssessment();

    return () => {
      mounted = false;
    };
  }, [assessmentId]);

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

  if (!assessment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Assessment unavailable
          </h1>
          <p className="mt-2 text-slate-500">
            This assessment could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  if (step === "login") {
    return (
      <StudentLogin
        assessmentId={assessmentId}
        assessmentTitle={assessment.title}
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

  if (step === "otp") {
    return (
      <VerifyOtp
        assessmentId={assessmentId}
        email={email}
        onVerified={() => setStep("instructions")}
        onBack={() => setStep("login")}
      />
    );
  }

  if (examData) {
    const student = JSON.parse(localStorage.getItem("student") || "{}");

    return (
      <StudentExam
        assessmentId={assessmentId}
        attemptId={examData.attemptId}
        assessmentTitle={assessment.title}
        studentName={student.name || "Student"}
        totalQuestions={examData.totalQuestions}
        firstQuestion={examData.question}
        remainingSeconds={examData.remainingSeconds}
        onSubmitted={() => {
          const attemptId = examData.attemptId;

          localStorage.removeItem("studentAttemptId");
          localStorage.removeItem(`studentCurrentQuestion:${attemptId}`);

          window.location.href = "/student/exam/completed";
        }}
      />
    );
  }

  return (
    <ExamInstructions
      assessment={assessment}
      onStart={handleStartExam}
      examStatus={examStatus}
      countdown={countdown}
    />
  );
}
