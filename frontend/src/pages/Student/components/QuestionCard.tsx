import { Check } from "lucide-react";
import type { AttemptQuestion } from "../types";

interface Props {
  question: AttemptQuestion | null | undefined;
  selectedAnswers: string[];
  onChange: (answers: string[]) => void;
}

type NormalizedOption = { key: string; text: string };

type QuestionKind =
  | "MCQ"
  | "MULTIPLE_CORRECT"
  | "TRUE_FALSE"
  | "FILL_IN_THE_BLANK";

function questionTypeLabel(type: QuestionKind) {
  if (type === "TRUE_FALSE") return "True / False";
  if (type === "MULTIPLE_CORRECT")
    return "Multiple Choice — Multiple Correct Answers";
  if (type === "FILL_IN_THE_BLANK")
    return "Fill in the Blank — Type Your Answer";
  return "MCQ — One Correct Answer";
}

function inferType(rawType: string): QuestionKind {
  const normalized = rawType.toUpperCase().replace(/[\s-]+/g, "_");
  if (normalized === "TRUE_FALSE") return "TRUE_FALSE";
  if (["MULTIPLE_CORRECT", "MULTIPLE_CHOICE", "MULTIPLE"].includes(normalized))
    return "MULTIPLE_CORRECT";
  if (["FILL_IN_THE_BLANK", "FILL_IN_BLANK", "FILL_BLANK"].includes(normalized))
    return "FILL_IN_THE_BLANK";
  return "MCQ";
}

export default function QuestionCard({
  question,
  selectedAnswers,
  onChange,
}: Props) {
  if (!question)
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
        <p className="font-semibold text-red-600">
          Unable to load this question.
        </p>
      </div>
    );

  const raw: any = question;
  const data =
    raw.question && typeof raw.question === "object" ? raw.question : raw;
  const inferredType = inferType(
    String(data.question_type ?? data.questionType ?? data.type ?? "MCQ"),
  );
  const questionText =
    data.question_text ?? data.questionText ?? data.text ?? "";
  const questionOrder =
    raw.question_order ??
    raw.questionOrder ??
    data.question_order ??
    data.questionOrder ??
    "";
  const marks = Number(data.marks ?? raw.marks ?? 1);

  let rawOptions: any =
    data.options ??
    data.question_options ??
    data.answer_options ??
    raw.options ??
    raw.question_options ??
    null;

  if (typeof rawOptions === "string") {
    try {
      rawOptions = JSON.parse(rawOptions);
    } catch {
      rawOptions = null;
    }
  }

  const optionEntries: NormalizedOption[] = [];
  const addOption = (key: unknown, value: unknown) => {
    if (key == null || value == null) return;
    const k = String(key).trim().toUpperCase();
    const text = String(value).trim();
    if (k && text && !optionEntries.some((option) => option.key === k)) {
      optionEntries.push({ key: k, text });
    }
  };

  if (Array.isArray(rawOptions)) {
    rawOptions.forEach((option, index) => {
      if (option && typeof option === "object") {
        addOption(
          option.key ??
            option.label ??
            option.option_key ??
            String.fromCharCode(65 + index),
          option.text ??
            option.value ??
            option.option_text ??
            option.content ??
            "",
        );
      } else {
        addOption(String.fromCharCode(65 + index), option);
      }
    });
  } else if (rawOptions && typeof rawOptions === "object") {
    ["A", "B", "C", "D"].forEach((key) =>
      addOption(key, rawOptions[key] ?? rawOptions[key.toLowerCase()]),
    );
  }

  if (!optionEntries.length && inferredType !== "TRUE_FALSE") {
    ["A", "B", "C", "D"].forEach((key) =>
      addOption(
        key,
        data[`option_${key.toLowerCase()}`] ??
          data[`option${key}`] ??
          raw[`option_${key.toLowerCase()}`],
      ),
    );
  }

  if (inferredType === "TRUE_FALSE" && !optionEntries.length) {
    addOption("A", "True");
    addOption("B", "False");
  }

  optionEntries.sort((a, b) => a.key.localeCompare(b.key));

  const isMultipleCorrect = inferredType === "MULTIPLE_CORRECT";

  const toggleOption = (key: string) => {
    if (isMultipleCorrect) {
      onChange(
        selectedAnswers.includes(key)
          ? selectedAnswers.filter((answer) => answer !== key)
          : [...selectedAnswers, key],
      );
      return;
    }
    onChange([key]);
  };

  const textAnswer = selectedAnswers[0] ?? "";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6 lg:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#00629B]">
            Question {questionOrder}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {questionTypeLabel(inferredType)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {isMultipleCorrect
              ? "Select all correct answers."
              : inferredType === "TRUE_FALSE"
                ? "Select True or False."
                : inferredType === "FILL_IN_THE_BLANK"
                  ? "Type your answer in the field below."
                  : "Select one correct answer."}{" "}
            · {marks} mark{marks === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-7 whitespace-pre-wrap text-[17px] font-medium leading-8 text-slate-900">
          {questionText || (
            <span className="text-red-500">Question text unavailable.</span>
          )}
        </div>

        {inferredType === "FILL_IN_THE_BLANK" ? (
          <div className="mt-8">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Your Answer
            </label>
            <input
              type="text"
              value={textAnswer}
              onChange={(event) => {
                const value = event.target.value.toUpperCase();
                onChange(value ? [value] : []);
              }}
              placeholder="Type your answer here..."
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#00629B] focus:ring-4 focus:ring-[#00629B]/10"
            />
            <p className="mt-2 text-xs text-slate-400">
              Your answer is automatically converted to CAPITAL LETTERS.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {optionEntries.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                No answer options are available for this question.
              </div>
            ) : (
              optionEntries.map(({ key, text }) => {
                const selected = selectedAnswers.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleOption(key)}
                    className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-[#00629B] bg-[#00629B]/5 ring-2 ring-[#00629B]/10"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${
                        selected
                          ? "border-[#00629B] bg-[#00629B] text-white"
                          : "border-slate-300 bg-white text-slate-500"
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
        )}
      </div>
    </div>
  );
}
