import { ArrowLeft, ArrowRight, Save } from "lucide-react";

interface Props {
  currentQuestion: number;
  totalQuestions: number;
  saving: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSaveAndNext: () => void;
}

export default function ExamNavigation({
  currentQuestion,
  totalQuestions,
  saving,
  onPrevious,
  onNext,
  onSaveAndNext,
}: Props) {
  const first = currentQuestion === 1;

  const last = currentQuestion === totalQuestions;

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        disabled={first || saving}
        onClick={onPrevious}
        className="h-12 px-5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
      >
        <ArrowLeft size={17} />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <button
        type="button"
        disabled={saving}
        onClick={last ? onSaveAndNext : onSaveAndNext}
        className="h-12 px-6 rounded-xl bg-[#00629B] text-white font-semibold flex items-center gap-2 disabled:opacity-60 hover:bg-[#00527f] transition"
      >
        {saving ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save size={17} />

            {last ? "Save Answer" : "Save & Next"}

            {!last && <ArrowRight size={17} />}
          </>
        )}
      </button>
    </div>
  );
}
