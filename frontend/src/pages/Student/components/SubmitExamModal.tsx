import { AlertTriangle, X } from "lucide-react";

interface Props {
  open: boolean;
  answered: number;
  total: number;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SubmitExamModal({
  open,
  answered,
  total,
  submitting,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  const unanswered = Math.max(total - answered, 0);

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>

            <button
              onClick={onClose}
              disabled={submitting}
              className="text-slate-400 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-5">
            Submit Assessment?
          </h2>

          <p className="text-sm text-slate-500 mt-2 leading-6">
            Once submitted, you cannot return to the assessment.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs text-emerald-700">Answered</p>

              <p className="text-2xl font-bold text-emerald-800 mt-1">
                {answered}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Unanswered</p>

              <p className="text-2xl font-bold text-slate-700 mt-1">
                {unanswered}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-7">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-11 rounded-xl border border-slate-200 font-semibold text-slate-700 disabled:opacity-50"
            >
              Continue Exam
            </button>

            <button
              onClick={onConfirm}
              disabled={submitting}
              className="flex-1 h-11 rounded-xl bg-[#00629B] text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
