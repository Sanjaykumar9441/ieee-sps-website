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

    try {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (fullscreenError) {
        console.warn("Fullscreen request was not allowed:", fullscreenError);
      }

      const result = await startAssessment(assessmentId);
      setExamData(result);
      onStartExam(assessmentId);
    } catch (err: any) {
      console.error("[EXAM] Unable to start:", err);

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
        const remaining = Math.max(0, Math.floor((startTime - now) / 1000));

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
          setCountdown(Math.max(0, Math.floor((startTime - now) / 1000)));
        } else if (now < endTime) {
          setExamStatus("LIVE");
          setCountdown(0);
        } else {
          setExamStatus("CLOSED");
          setCountdown(0);
        }

        const savedAttemptId = localStorage.getItem("studentAttemptId");

        // Do not resume before the official exam start time.
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
            localStorage.removeItem(`studentCurrentQuestion:${savedAttemptId}`);
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
