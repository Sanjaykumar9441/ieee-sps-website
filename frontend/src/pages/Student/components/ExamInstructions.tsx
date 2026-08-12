import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  FileQuestion,
  ShieldCheck,
} from "lucide-react";

import type { Assessment } from "../types";

interface Props {
  assessment: Assessment;
  onStart: () => void;
}

export default function ExamInstructions({ assessment, onStart }: Props) {
  const duration = Number(assessment.duration_minutes || 0);

  const questions = Number(assessment.total_questions || 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#00629B]">
              Student Examination Portal
            </p>

            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {assessment.title}
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-sm text-emerald-600 font-medium">
            <ShieldCheck size={18} />
            Verified
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-8 md:p-10">
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50">
                <Clock3 size={19} className="text-[#00629B]" />

                <div>
                  <p className="text-xs text-slate-500">Duration</p>

                  <p className="font-semibold text-slate-900">
                    {duration} minutes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50">
                <FileQuestion size={19} className="text-[#00629B]" />

                <div>
                  <p className="text-xs text-slate-500">Questions</p>

                  <p className="font-semibold text-slate-900">{questions}</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900">Instructions</h2>

            <div className="mt-6 space-y-4">
              {assessment.instructions ? (
                <div className="text-slate-600 whitespace-pre-line leading-7">
                  {assessment.instructions}
                </div>
              ) : (
                <>
                  <Instruction>
                    Make sure you have a stable internet connection before
                    starting.
                  </Instruction>

                  <Instruction>
                    The assessment timer starts when you begin the examination.
                  </Instruction>

                  <Instruction>
                    Your answers are saved during the examination.
                  </Instruction>

                  <Instruction>
                    Do not close the examination window unnecessarily.
                  </Instruction>

                  <Instruction>
                    Do not attempt to access another assessment or use
                    unauthorized resources.
                  </Instruction>
                </>
              )}
            </div>

            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 flex gap-4">
              <AlertTriangle
                size={21}
                className="text-amber-600 shrink-0 mt-0.5"
              />

              <div>
                <p className="font-semibold text-amber-900">Before you begin</p>

                <p className="text-sm text-amber-800 mt-1 leading-6">
                  Once you start the assessment, your attempt and timer will be
                  created. Make sure you are ready before continuing.
                </p>
              </div>
            </div>

            <button
              onClick={onStart}
              className="mt-8 w-full sm:w-auto px-8 h-13 rounded-xl bg-[#00629B] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#00527f] transition"
            >
              Start Assessment
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Instruction({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-slate-600">
      <span className="w-2 h-2 rounded-full bg-[#00629B] mt-2.5 shrink-0" />

      <p className="leading-7">{children}</p>
    </div>
  );
}
