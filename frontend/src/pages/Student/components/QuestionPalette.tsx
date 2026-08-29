import { Check } from "lucide-react";

import type { PaletteQuestion } from "../types";

interface Props {
  palette: PaletteQuestion[];
  currentQuestion: number;
  onSelect: (questionNumber: number) => void;
}

export default function QuestionPalette({
  palette,
  currentQuestion,
  onSelect,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900">Question Palette</h3>

          <p className="text-xs text-slate-400 mt-1">
            Navigate between questions
          </p>
        </div>

        <span className="text-xs font-semibold text-slate-500">
          {palette.filter((q) => q.answered).length}/{palette.length}
        </span>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 mt-5">
        {palette.map((item) => {
          const current = item.questionOrder === currentQuestion;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.questionOrder)}
              title={item.answered ? "Answered" : "Not answered"}
              className={`relative h-10 rounded-lg text-sm font-semibold border transition ${
                current
                  ? "bg-[#00629B] text-white border-[#00629B]"
                  : item.answered
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
              }`}
            >
              {item.questionOrder}

              {item.answered && !current && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check size={10} />
                </span>
              )}

            </button>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
        <Legend className="bg-emerald-50 border-emerald-200" label="Answered" />

        <Legend className="bg-white border-slate-200" label="Not Answered" />

        <Legend className="bg-[#00629B]" label="Current" dark />

      </div>
    </div>
  );
}

function Legend({
  className,
  label,
  dark,
}: {
  className: string;
  label: string;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-slate-500">
      <span className={`w-4 h-4 rounded border ${className}`} />

      <span className={dark ? "text-[#00629B]" : undefined}>{label}</span>
    </div>
  );
}
