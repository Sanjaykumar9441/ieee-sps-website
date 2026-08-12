import { CheckCircle } from "lucide-react";

export default function StudentExamCompleted() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">

        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle
              size={44}
              className="text-green-600"
            />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          Successfully Submitted
        </h1>

        <p className="mt-3 text-slate-500">
          Your assessment has been submitted successfully.
        </p>

        <p className="mt-2 text-sm text-slate-400">
          Thank you for participating.
        </p>

      </div>
    </div>
  );
}