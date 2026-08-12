import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  FileQuestion,
  ShieldCheck,
} from "lucide-react";

import type { Assessment } from "../types";

interface ExamInstructionsProps {
  assessment: Assessment;
  onStart: () => void;
  examStatus: "NOT_STARTED" | "LIVE" | "CLOSED";
  countdown: number;
}

export default function ExamInstructions({
  assessment,
  onStart,
  examStatus,
  countdown,
}: ExamInstructionsProps) {
  const duration = Number(assessment.duration_minutes || 0);
  const questions = Number(assessment.total_questions || 0);

  const formatCountdown = (seconds: number) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;

    return [hours, minutes, secs]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  };

  const formattedStartTime = assessment.start_time
    ? new Date(assessment.start_time).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "--";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-white px-6 py-6 sm:px-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00629B]/10">
                <FileQuestion className="h-6 w-6 text-[#00629B]" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
                  Examination
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                  {assessment.title}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Your identity has been verified. Please follow the
                  instructions below.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-b border-slate-200 bg-slate-50 p-6 sm:grid-cols-2 sm:p-8">
            <InfoCard
              icon={<FileQuestion className="h-5 w-5" />}
              label="Questions"
              value={String(questions)}
            />
            <InfoCard
              icon={<Clock3 className="h-5 w-5" />}
              label="Duration"
              value={`${duration} minutes`}
            />
          </div>

          <div className="p-6 text-center sm:p-8">
            {examStatus === "NOT_STARTED" && (
              <>
                <div className="mb-6">
                  <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                    Exam Starts At
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {formattedStartTime}
                  </p>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-500">
                    Time Remaining
                  </p>
                  <p className="mt-2 font-mono text-5xl font-bold tracking-wider text-[#00629B] sm:text-6xl">
                    {formatCountdown(countdown)}
                  </p>
                </div>

                <div className="mx-auto flex max-w-xl items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-left">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#00629B]" />
                  <div>
                    <p className="font-semibold text-slate-800">Please wait</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Your identity has been verified. The examination will open
                      automatically at the scheduled start time.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="mt-8 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-300 px-6 py-4 font-semibold text-slate-500"
                >
                  START EXAM
                  <ArrowRight className="h-5 w-5" />
                </button>
              </>
            )}

            {examStatus === "LIVE" && (
              <>
                <div className="mb-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <ShieldCheck className="h-9 w-9 text-green-600" />
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-green-700 sm:text-3xl">
                    EXAM IS LIVE
                  </h2>
                  <p className="mt-2 text-slate-500">
                    Your identity has been verified. You may now begin the
                    examination.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onStart}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00629B] px-6 py-4 font-semibold text-white transition hover:bg-[#004f7d] focus:outline-none focus:ring-2 focus:ring-[#00629B]/40"
                >
                  START EXAM
                  <ArrowRight className="h-5 w-5" />
                </button>
              </>
            )}

            {examStatus === "CLOSED" && (
              <div className="py-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="mt-5 text-2xl font-bold text-red-600">
                  EXAM CLOSED
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-slate-500">
                  The examination window has ended. You can no longer start this
                  examination.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 px-6 py-6 sm:px-8">
            <h2 className="text-lg font-bold text-slate-900">
              Before You Start
            </h2>
            <div className="mt-5 space-y-4">
              <Instruction>
                Make sure you have a stable internet connection before starting
                the examination.
              </Instruction>
              <Instruction>
                Do not close or refresh the examination page while the exam is
                in progress.
              </Instruction>
              <Instruction>
                The examination timer starts when your attempt is created.
              </Instruction>
              <Instruction>
                Follow all examination and anti-cheating rules displayed by the
                examination system.
              </Instruction>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-[#00629B]">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="mt-1 font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function Instruction({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-slate-600">
      <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-[#00629B]" />
      <p className="leading-7">{children}</p>
    </div>
  );
}
