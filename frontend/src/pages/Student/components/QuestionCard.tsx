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
   * ============================================================
   * SAFETY
   * ============================================================
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
   * ============================================================
   * SUPPORT BOTH:
   *
   * 1. Direct backend object
   *
   * 2. Nested backend object
   *
   * ============================================================
   */

  const rawQuestion = question as any;

  const data =
    rawQuestion.question &&
    typeof rawQuestion.question === "object"
      ? rawQuestion.question
      : rawQuestion;

  /*
   * ============================================================
   * QUESTION TYPE
   * ============================================================
   */

  const type =
    data.question_type ??
    data.questionType ??
    data.type ??
    rawQuestion.question_type ??
    rawQuestion.questionType ??
    "";

  /*
   * ============================================================
   * QUESTION TEXT
   * ============================================================
   */

  const questionText =
    data.question_text ??
    data.questionText ??
    data.text ??
    rawQuestion.question_text ??
    rawQuestion.questionText ??
    "";

  /*
   * ============================================================
   * QUESTION ORDER
   * ============================================================
   */

  const questionOrder =
    rawQuestion.question_order ??
    rawQuestion.questionOrder ??
    data.question_order ??
    data.questionOrder ??
    "";

  /*
   * ============================================================
   * MARKS
   * ============================================================
   */

  const marks = Number(
    rawQuestion.marks ??
      data.marks ??
      1,
  );

  /*
   * ============================================================
   * MULTIPLE CORRECT
   * ============================================================
   */

  const normalizedType = String(type).toUpperCase();

  const multiple =
    normalizedType === "MULTIPLE_CORRECT" ||
    normalizedType === "MULTIPLE_CHOICE_MULTIPLE" ||
    normalizedType === "MULTIPLE";

  /*
   * ============================================================
   * NORMALIZE OPTIONS
   *
   * IMPORTANT:
   *
   * Your database/CSV format uses:
   *
   * option_a
   * option_b
   * option_c
   * option_d
   *
   * So we explicitly support those fields.
   * ============================================================
   */

  let rawOptions =
    data.options ??
    data.question_options ??
    data.answer_options ??
    rawQuestion.options ??
    rawQuestion.question_options ??
    null;

  /*
   * If options are JSON string
   */
  if (typeof rawOptions === "string") {
    try {
      rawOptions = JSON.parse(rawOptions);
    } catch (error) {
      console.error(
        "[QUESTION CARD] Unable to parse options:",
        rawOptions,
        error,
      );

      rawOptions = null;
    }
  }

  const optionEntries: NormalizedOption[] = [];

  /*
   * ============================================================
   * CASE 1:
   *
   * options = {
   *   A: "...",
   *   B: "...",
   *   C: "...",
   *   D: "..."
   * }
   * ============================================================
   */

  if (
    rawOptions &&
    typeof rawOptions === "object" &&
    !Array.isArray(rawOptions)
  ) {
    Object.entries(rawOptions).forEach(([key, value]) => {
      if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
      ) {
        return;
      }

      optionEntries.push({
        key: String(key).toUpperCase(),
        text: String(value),
      });
    });
  }

  /*
   * ============================================================
   * CASE 2:
   *
   * options = [
   *   { key: "A", text: "..." },
   *   { key: "B", text: "..." }
   * ]
   *
   * OR
   *
   * options = [
   *   "Option A",
   *   "Option B"
   * ]
   * ============================================================
   */

  if (Array.isArray(rawOptions)) {
    rawOptions.forEach((option: any, index: number) => {
      if (
        option === null ||
        option === undefined
      ) {
        return;
      }

      if (typeof option === "string") {
        if (option.trim() === "") return;

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

      if (String(text).trim() === "") return;

      optionEntries.push({
        key: String(key).toUpperCase(),
        text: String(text),
      });
    });
  }

  /*
   * ============================================================
   * CASE 3:
   *
   * YOUR DATABASE FORMAT
   *
   * option_a
   * option_b
   * option_c
   * option_d
   *
   * ============================================================
   *
   * This is the important fix.
   */

  if (optionEntries.length === 0) {
    const databaseOptions = [
      {
        key: "A",
        text:
          data.option_a ??
          data.optionA ??
          rawQuestion.option_a ??
          rawQuestion.optionA,
      },
      {
        key: "B",
        text:
          data.option_b ??
          data.optionB ??
          rawQuestion.option_b ??
          rawQuestion.optionB,
      },
      {
        key: "C",
        text:
          data.option_c ??
          data.optionC ??
          rawQuestion.option_c ??
          rawQuestion.optionC,
      },
      {
        key: "D",
        text:
          data.option_d ??
          data.optionD ??
          rawQuestion.option_d ??
          rawQuestion.optionD,
      },
    ];

    databaseOptions.forEach(({ key, text }) => {
      if (
        text !== null &&
        text !== undefined &&
        String(text).trim() !== ""
      ) {
        optionEntries.push({
          key,
          text: String(text),
        });
      }
    });
  }

  /*
   * ============================================================
   * CASE 4:
   *
   * Some APIs may return:
   *
   * {
   *   options: {
   *     option_a: "...",
   *     option_b: "..."
   *   }
   * }
   *
   * ============================================================
   */

  if (
    optionEntries.length === 0 &&
    rawOptions &&
    typeof rawOptions === "object" &&
    !Array.isArray(rawOptions)
  ) {
    const objectOptions = [
      {
        key: "A",
        text:
          rawOptions.option_a ??
          rawOptions.optionA,
      },
      {
        key: "B",
        text:
          rawOptions.option_b ??
          rawOptions.optionB,
      },
      {
        key: "C",
        text:
          rawOptions.option_c ??
          rawOptions.optionC,
      },
      {
        key: "D",
        text:
          rawOptions.option_d ??
          rawOptions.optionD,
      },
    ];

    objectOptions.forEach(({ key, text }) => {
      if (
        text !== null &&
        text !== undefined &&
        String(text).trim() !== ""
      ) {
        optionEntries.push({
          key,
          text: String(text),
        });
      }
    });
  }

  /*
   * ============================================================
   * SORT OPTIONS
   *
   * Always show:
   *
   * A
   * B
   * C
   * D
   *
   * ============================================================
   */

  const optionOrder: Record<string, number> = {
    A: 0,
    B: 1,
    C: 2,
    D: 3,
  };

  optionEntries.sort(
    (a, b) =>
      (optionOrder[a.key] ?? 99) -
      (optionOrder[b.key] ?? 99),
  );

  /*
   * ============================================================
   * DEBUG
   * ============================================================
   */

  console.log("[QUESTION CARD]", {
    question,
    data,
    type,
    questionText,
    rawOptions,
    optionEntries,
    databaseOptions: {
      option_a: data.option_a,
      option_b: data.option_b,
      option_c: data.option_c,
      option_d: data.option_d,
    },
  });

  /*
   * ============================================================
   * SELECT OPTION
   * ============================================================
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
   * ============================================================
   * RENDER
   * ============================================================
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