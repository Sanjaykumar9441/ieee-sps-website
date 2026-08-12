import { CheckCircle2 } from "lucide-react";

export default function StudentExamResult() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 size={44} className="text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Assessment Submitted
          </h1>

          <p className="mt-3 text-slate-500 leading-relaxed">
            Your assessment has been submitted successfully.
          </p>

          <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-5">
            <p className="text-sm font-medium text-slate-700">Result Status</p>

            <p className="mt-1 text-lg font-semibold text-[#00629B]">
              Result Not Published
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Your result will be available once the administrator publishes the
              results.
            </p>
          </div>

          <p className="mt-6 text-xs text-slate-400">
            You may close this window now.
          </p>
        </div>
      </div>
    </div>
  );
}
