import { Check, Image as ImageIcon } from "lucide-react";

import type { AttemptQuestion } from "../types";

interface Props {
  question: AttemptQuestion | null | undefined;
  selectedAnswers: string[];
  onChange: (answers: string[]) => void;
}

type NormalizedOption = {
  key: string;
  text: string;
};

export default function QuestionCard({
  question,
  selectedAnswers,
  onChange,
}: Props) {
  /*
   * ------------------------------------------------------------
   * SAFETY
   * ------------------------------------------------------------
   */

  if (!question) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm">
        <div className="p-8 text-center">
          <p className="text-red-600 font-semibold">
            Unable to load this question.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            The question data was not received from the server.
          </p>
        </div>
      </div>
    );
  }

  /*
   * ------------------------------------------------------------
   * SUPPORT BOTH:
   *
   * 1. Direct backend object
   *    {
   *      question_type,
   *      question_text,
   *      options
   *    }
   *
   * 2. Nested backend object
   *    {
   *      question: {
   *        question_type,
   *        question_text,
   *        options
   *      }
   *    }
   * ------------------------------------------------------------
   */

  const rawQuestion = question as any;

  const data =
    rawQuestion.question &&
    typeof rawQuestion.question === "object"
      ? rawQuestion.question
      : rawQuestion;

  /*
   * ------------------------------------------------------------
   * QUESTION TYPE
   * ------------------------------------------------------------
   */

  const type =
    data.question_type ??
    data.type ??
    rawQuestion.question_type ??
    "";

  /*
   * ------------------------------------------------------------
   * QUESTION TEXT
   * ------------------------------------------------------------
   */

  const questionText =
    data.question_text ??
    data.questionText ??
    data.text ??
    rawQuestion.question_text ??
    "";

  /*
   * ------------------------------------------------------------
   * QUESTION ORDER
   * ------------------------------------------------------------
   */

  const questionOrder =
    rawQuestion.question_order ??
    data.question_order ??
    "";

  /*
   * ------------------------------------------------------------
   * MARKS
   * ------------------------------------------------------------
   */

  const marks = Number(
    rawQuestion.marks ??
      data.marks ??
      1,
  );

  /*
   * ------------------------------------------------------------
   * MULTIPLE CORRECT
   * ------------------------------------------------------------
   */

  const multiple =
    type === "MULTIPLE_CORRECT" ||
    type === "MULTIPLE_CHOICE_MULTIPLE" ||
    type === "MULTIPLE";

  /*
   * ------------------------------------------------------------
   * NORMALIZE OPTIONS
   *
   * Supported:
   *
   * {
   *   A: "Option 1",
   *   B: "Option 2"
   * }
   *
   * [
   *   { key: "A", text: "Option 1" },
   *   { key: "B", text: "Option 2" }
   * ]
   *
   * [
   *   "Option 1",
   *   "Option 2"
   * ]
   *
   * JSON string
   * ------------------------------------------------------------
   */

  let rawOptions =
    data.options ??
    data.question_options ??
    data.answer_options ??
    rawQuestion.options ??
    rawQuestion.question_options ??
    {};

  /*
   * If options are JSONB returned as a string
   */
  if (typeof rawOptions === "string") {
    try {
      rawOptions = JSON.parse(rawOptions);
    } catch {
      console.error(
        "[QUESTION CARD] Unable to parse options:",
        rawOptions,
      );

      rawOptions = {};
    }
  }

  const optionEntries: NormalizedOption[] = [];

  /*
   * Object:
   *
   * {
   *   A: "...",
   *   B: "..."
   * }
   */
  if (
    rawOptions &&
    typeof rawOptions === "object" &&
    !Array.isArray(rawOptions)
  ) {
    Object.entries(rawOptions).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }

      optionEntries.push({
        key,
        text: String(value),
      });
    });
  }

  /*
   * Array:
   *
   * [
   *   { key: "A", text: "..." }
   * ]
   */
  if (Array.isArray(rawOptions)) {
    rawOptions.forEach((option: any, index: number) => {
      if (option === null || option === undefined) {
        return;
      }

      if (typeof option === "string") {
        optionEntries.push({
          key: String.fromCharCode(65 + index),
          text: option,
        });

        return;
      }

      const key =
        option.key ??
        option.id ??
        option.label ??
        String.fromCharCode(65 + index);

      const text =
        option.text ??
        option.value ??
        option.option_text ??
        option.content ??
        "";

      optionEntries.push({
        key: String(key),
        text: String(text),
      });
    });
  }

  /*
   * ------------------------------------------------------------
   * DEBUG
   * ------------------------------------------------------------
   */

  console.log("[QUESTION CARD]", {
    question,
    data,
    type,
    questionText,
    rawOptions,
    optionEntries,
  });

  /*
   * ------------------------------------------------------------
   * SELECT OPTION
   * ------------------------------------------------------------
   */

  const toggleOption = (key: string) => {
    if (multiple) {
      if (selectedAnswers.includes(key)) {
        onChange(
          selectedAnswers.filter(
            (item) => item !== key,
          ),
        );
      } else {
        onChange([
          ...selectedAnswers,
          key,
        ]);
      }

      return;
    }

    onChange([key]);
  };

  /*
   * ------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------
   */

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-6 lg:p-8">

        {/* HEADER */}
        <div className="flex items-start justify-between gap-5">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#00629B]">
              Question {questionOrder}
            </p>

            <p className="text-xs text-slate-400 mt-1">
              {multiple
                ? "Select all correct answers"
                : "Select one answer"}
            </p>
          </div>

          <div className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-50 text-xs font-semibold text-slate-600">
            {marks} {marks === 1 ? "Mark" : "Marks"}
          </div>

        </div>

        {/* QUESTION */}
        <div className="mt-7 text-[17px] leading-8 font-medium text-slate-900">
          {questionText || (
            <span className="text-red-500">
              Question text unavailable.
            </span>
          )}
        </div>

        {/* IMAGE */}
        {(rawQuestion.question_image_id ||
          data.question_image_id) && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 flex items-center justify-center">
            <ImageIcon
              size={30}
              className="text-slate-300"
            />
          </div>
        )}

        {/* OPTIONS */}
        <div className="mt-8 space-y-3">

          {optionEntries.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

              <p className="text-sm font-semibold text-amber-800">
                No options available for this question.
              </p>

              <p className="mt-1 text-xs text-amber-700">
                Question type: {type || "unknown"}
              </p>

              <p className="mt-1 text-xs text-amber-700">
                Check the browser console for the question response.
              </p>

            </div>
          ) : (
            optionEntries.map(({ key, text }) => {

              const selected =
                selectedAnswers.includes(key);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    toggleOption(key)
                  }
                  className={`w-full text-left rounded-xl border p-4 flex items-start gap-4 transition ${
                    selected
                      ? "border-[#00629B] bg-[#00629B]/5 ring-2 ring-[#00629B]/10"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >

                  {/* OPTION LETTER */}
                  <span
                    className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold border ${
                      selected
                        ? "bg-[#00629B] text-white border-[#00629B]"
                        : "bg-white text-slate-500 border-slate-300"
                    }`}
                  >
                    {selected ? (
                      <Check size={16} />
                    ) : (
                      key
                    )}
                  </span>

                  {/* OPTION TEXT */}
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