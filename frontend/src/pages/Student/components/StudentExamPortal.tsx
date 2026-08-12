import { useEffect, useState } from "react";

import toast from "react-hot-toast";
import StudentExam from "./StudentExam";
import { startAssessment, resumeAssessment } from "../api/studenExamApi";

import type { Assessment } from "../types";

import StudentLogin from "../components/StudentLogin";
import VerifyOtp from "../components/VerifyOtp";
import ExamInstructions from "../components/ExamInstructions";
import { checkAssessment } from "../api/studenExamApi";

interface Props {
  assessmentId: string;
  onStartExam: (assessmentId: string) => void;
}

type Step = "loading" | "login" | "otp" | "instructions";

export default function StudentExamPortal({
  assessmentId,
  onStartExam,
}: Props) {
  const [step, setStep] = useState<Step>("loading");

  const [assessment, setAssessment] = useState<Assessment | null>(null);

  const [email, setEmail] = useState("");

  const [examData, setExamData] = useState<{
    attemptId: string;
    totalQuestions: number;
    currentQuestion: number;
    remainingSeconds: number;
    question: any;
  } | null>(null);

  const handleStartExam = async () => {
    try {
      // Request fullscreen while this function is still
      // running from the student's Start Exam click.
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (fullscreenError) {
        console.warn("Fullscreen request was not allowed:", fullscreenError);
      }

      const result = await startAssessment(assessmentId);

      setExamData(result);
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to start assessment.",
      );
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadAssessment = async () => {
      try {
        const result = await checkAssessment(assessmentId);

        if (!mounted) return;

        setAssessment(result.assessment);

        const savedAttemptId = localStorage.getItem("studentAttemptId");

        if (savedAttemptId) {
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
        setStep("login");
      } catch (err: any) {
        console.error(err);

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
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#00629B] rounded-full animate-spin mx-auto" />

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

          <p className="text-slate-500 mt-2">
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
        onVerified={() => {
          setStep("instructions");
        }}
        onBack={() => {
          setStep("login");
        }}
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

          window.location.href = `/student/exam/${attemptId}/result`;
        }}
      />
    );
  }

  return <ExamInstructions assessment={assessment} onStart={handleStartExam} />;
}
