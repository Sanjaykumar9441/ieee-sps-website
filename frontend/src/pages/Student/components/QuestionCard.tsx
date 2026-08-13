import { Check, Image as ImageIcon } from "lucide-react";

import type { AttemptQuestion } from "../types";

interface Props {
  question: AttemptQuestion;
  selectedAnswers: string[];
  onChange: (answers: string[]) => void;
}

export default function QuestionCard({
  question,
  selectedAnswers,
  onChange,
}: Props) {
  // Backend returns these fields directly.
  const type = question.question_type;

  // Backend returns shuffled options as an object:
  // { A: "Option 1", B: "Option 2", ... }
  const options = question.options || {};

  const optionEntries = Object.entries(options);

  const multiple = type === "MULTIPLE_CORRECT";

  const toggleOption = (key: string) => {
    if (multiple) {
      if (selectedAnswers.includes(key)) {
        onChange(selectedAnswers.filter((item) => item !== key));
      } else {
        onChange([...selectedAnswers, key]);
      }

      return;
    }

    onChange([key]);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-6 lg:p-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#00629B]">
              Question {question.question_order}
            </p>

            <p className="text-xs text-slate-400 mt-1">
              {multiple
                ? "Select all correct answers"
                : "Select one answer"}
            </p>
          </div>

          <div className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-50 text-xs font-semibold text-slate-600">
            {question.marks}{" "}
            {question.marks === 1 ? "Mark" : "Marks"}
          </div>
        </div>

        {/* Question */}
        <div className="mt-7 text-[17px] leading-8 font-medium text-slate-900">
          {question.question_text}
        </div>

        {/* Image */}
        {question.question_image_id && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 flex items-center justify-center">
            <ImageIcon size={30} className="text-slate-300" />
          </div>
        )}

        {/* Options */}
        <div className="mt-8 space-y-3">
          {optionEntries.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              No options available for this question.
            </div>
          ) : (
            optionEntries.map(([key, text]) => {
              const selected = selectedAnswers.includes(key);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleOption(key)}
                  className={`w-full text-left rounded-xl border p-4 flex items-start gap-4 transition ${
                    selected
                      ? "border-[#00629B] bg-[#00629B]/5 ring-2 ring-[#00629B]/10"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold border ${
                      selected
                        ? "bg-[#00629B] text-white border-[#00629B]"
                        : "bg-white text-slate-500 border-slate-300"
                    }`}
                  >
                    {selected ? <Check size={16} /> : key}
                  </span>

                  <span className="pt-1 text-sm leading-6 text-slate-700">
                    {text}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}