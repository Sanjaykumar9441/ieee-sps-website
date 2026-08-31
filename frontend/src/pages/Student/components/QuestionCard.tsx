import { Check } from "lucide-react";
import type { AttemptQuestion } from "../types";

interface Props {
  question: AttemptQuestion | null | undefined;
  selectedAnswers: string[];
  onChange: (answers: string[]) => void;
}

type NormalizedOption = { key: string; text: string };

function questionTypeLabel(type: string) {
  const normalized = String(type || "MCQ").toUpperCase();
  if (normalized === "MULTIPLE_CORRECT") return "Multiple Choice — Multiple Correct Answers";
  if (normalized === "TRUE_FALSE") return "True / False";
  return "MCQ — One Correct Answer";
}

export default function QuestionCard({ question, selectedAnswers, onChange }: Props) {
  if (!question) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
        <p className="font-semibold text-red-600">Unable to load this question.</p>
      </div>
    );
  }

  const raw: any = question;
  const data = raw.question && typeof raw.question === "object" ? raw.question : raw;
  const type = data.question_type ?? data.questionType ?? data.type ?? "MCQ";
  const questionText = data.question_text ?? data.questionText ?? data.text ?? "";
  const questionOrder = raw.question_order ?? raw.questionOrder ?? data.question_order ?? data.questionOrder ?? "";

  let rawOptions: any =
    data.options ?? data.question_options ?? data.answer_options ?? raw.options ?? raw.question_options ?? null;

  if (typeof rawOptions === "string") {
    try { rawOptions = JSON.parse(rawOptions); } catch { rawOptions = null; }
  }

  const optionEntries: NormalizedOption[] = [];
  const addOption = (key: unknown, value: unknown) => {
    if (key == null || value == null) return;
    const normalizedKey = String(key).trim().toUpperCase();
    const normalizedText = String(value).trim();
    if (!normalizedKey || !normalizedText || optionEntries.some((o) => o.key === normalizedKey)) return;
    optionEntries.push({ key: normalizedKey, text: normalizedText });
  };

  const readOptions = (value: any) => {
    if (Array.isArray(value)) {
      value.forEach((option, index) => {
        if (option && typeof option === "object") {
          addOption(
            option.key ?? option.label ?? option.option_key ?? String.fromCharCode(65 + index),
            option.text ?? option.value ?? option.option_text ?? option.content ?? "",
          );
        } else {
          addOption(String.fromCharCode(65 + index), option);
        }
      });
      return;
    }
    if (value && typeof value === "object") {
      ["A", "B", "C", "D"].forEach((key) => {
        addOption(key, value[key] ?? value[key.toLowerCase()]);
      });
    }
  };

  readOptions(rawOptions);

  if (!optionEntries.length && type !== "TRUE_FALSE") {
    ["A", "B", "C", "D"].forEach((key) => {
      addOption(key, data[`option_${key.toLowerCase()}`] ?? data[`option${key}`] ?? raw[`option_${key.toLowerCase()}`]);
    });
  }

  if (String(type).toUpperCase() === "TRUE_FALSE") {
    optionEntries.length = 0;
    addOption("A", "True");
    addOption("B", "False");
  }

  optionEntries.sort((a, b) => a.key.localeCompare(b.key));

  const normalizedType = String(type).toUpperCase();
  const isMultipleCorrect = normalizedType === "MULTIPLE_CORRECT";

  const toggleOption = (key: string) => {
    if (isMultipleCorrect) {
      onChange(selectedAnswers.includes(key) ? selectedAnswers.filter((a) => a !== key) : [...selectedAnswers, key]);
    } else {
      onChange([key]);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6 lg:p-8">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#00629B]">Question {questionOrder}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{questionTypeLabel(type)}</p>
            <p className="mt-1 text-xs text-slate-400">
              {isMultipleCorrect ? "Select all correct answers." : normalizedType === "TRUE_FALSE" ? "Select True or False." : "Select one correct answer."} · 1 mark
            </p>
          </div>
        </div>

        <div className="mt-7 text-[17px] font-medium leading-8 text-slate-900">
          {questionText || <span className="text-red-500">Question text unavailable.</span>}
        </div>

        <div className="mt-8 space-y-3">
          {optionEntries.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">No answer options are available for this question.</div>
          ) : optionEntries.map(({ key, text }) => {
            const selected = selectedAnswers.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleOption(key)}
                className={`w-full rounded-xl border p-4 text-left flex items-start gap-4 transition ${selected ? "border-[#00629B] bg-[#00629B]/5 ring-2 ring-[#00629B]/10" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
              >
                <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold border ${selected ? "bg-[#00629B] text-white border-[#00629B]" : "bg-white text-slate-500 border-slate-300"}`}>
                  {selected ? <Check size={16} /> : key}
                </span>
                <span className="pt-1 text-sm leading-6 text-slate-700">{text}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
