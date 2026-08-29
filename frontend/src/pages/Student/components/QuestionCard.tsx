import { Check } from "lucide-react";
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
   * RAW QUESTION
   * ============================================================
   */

  const rawQuestion = question as any;

  /*
   * Some API responses may contain:
   *
   * question: {
   *   ...
   * }
   *
   * Others directly contain the fields.
   */

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
   * RAW OPTIONS
   *
   * Support:
   *
   * options
   * question_options
   * answer_options
   * rawOptions
   * nested rawOptions
   * ============================================================
   */

  let rawOptions =
    data.options ??
    data.question_options ??
    data.answer_options ??
    data.rawOptions ??
    rawQuestion.options ??
    rawQuestion.question_options ??
    rawQuestion.answer_options ??
    rawQuestion.rawOptions ??
    null;

  /*
   * ============================================================
   * PARSE JSON STRING
   * ============================================================
   */

  if (typeof rawOptions === "string") {
    try {
      rawOptions = JSON.parse(rawOptions);
    } catch (error) {
      console.error(
        "[QUESTION CARD] Failed to parse options:",
        error,
      );

      rawOptions = null;
    }
  }

  /*
   * ============================================================
   * OPTION ARRAY
   * ============================================================
   */

  const optionEntries: NormalizedOption[] = [];

  /*
   * Prevent duplicate A/B/C/D entries.
   */

  const addOption = (
    key: unknown,
    value: unknown,
  ) => {
    if (
      key === null ||
      key === undefined ||
      value === null ||
      value === undefined
    ) {
      return;
    }

    const normalizedKey =
      String(key)
        .trim()
        .toUpperCase();

    const normalizedText =
      String(value).trim();

    if (
      !normalizedKey ||
      !normalizedText
    ) {
      return;
    }

    const exists =
      optionEntries.some(
        (option) =>
          option.key ===
          normalizedKey,
      );

    if (exists) {
      return;
    }

    optionEntries.push({
      key: normalizedKey,
      text: normalizedText,
    });
  };

  /*
   * ============================================================
   * FUNCTION TO READ OPTION OBJECT
   * ============================================================
   */

  const readOptionObject = (
    object: Record<string, any>,
  ) => {
    /*
     * A / B / C / D
     */

    addOption("A", object.A);
    addOption("B", object.B);
    addOption("C", object.C);
    addOption("D", object.D);

    /*
     * a / b / c / d
     */

    addOption("A", object.a);
    addOption("B", object.b);
    addOption("C", object.c);
    addOption("D", object.d);

    /*
     * option_a / option_b / option_c / option_d
     */

    addOption(
      "A",
      object.option_a ??
        object.optionA,
    );

    addOption(
      "B",
      object.option_b ??
        object.optionB,
    );

    addOption(
      "C",
      object.option_c ??
        object.optionC,
    );

    addOption(
      "D",
      object.option_d ??
        object.optionD,
    );

    /*
     * option1 / option2 / option3 / option4
     */

    addOption(
      "A",
      object.option1,
    );

    addOption(
      "B",
      object.option2,
    );

    addOption(
      "C",
      object.option3,
    );

    addOption(
      "D",
      object.option4,
    );

    /*
     * Nested options
     */

    if (
      object.options &&
      typeof object.options === "object"
    ) {
      readOptionValue(
        object.options,
      );
    }

    /*
     * Nested rawOptions
     */

    if (
      object.rawOptions &&
      typeof object.rawOptions ===
        "object"
    ) {
      readOptionValue(
        object.rawOptions,
      );
    }
  };

  /*
   * ============================================================
   * READ ANY OPTION FORMAT
   * ============================================================
   */

  const readOptionValue = (
    value: any,
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return;
    }

    /*
     * ARRAY
     */

    if (Array.isArray(value)) {
      value.forEach(
        (
          option: any,
          index: number,
        ) => {
          if (
            option === null ||
            option === undefined
          ) {
            return;
          }

          /*
           * ["Mars", "Earth", ...]
           */

          if (
            typeof option ===
            "string"
          ) {
            addOption(
              String.fromCharCode(
                65 + index,
              ),
              option,
            );

            return;
          }

          /*
           * [
           *   {
           *     key: "A",
           *     text: "Mars"
           *   }
           * ]
           */

          if (
            typeof option ===
            "object"
          ) {
            const key =
              option.key ??
              option.id ??
              option.label ??
              option.option_key ??
              option.optionKey ??
              String.fromCharCode(
                65 + index,
              );

            const text =
              option.text ??
              option.value ??
              option.option_text ??
              option.optionText ??
              option.content ??
              option.name ??
              "";

            addOption(
              key,
              text,
            );
          }
        },
      );

      return;
    }

    /*
     * OBJECT
     */

    if (
      typeof value === "object"
    ) {
      readOptionObject(value);
    }
  };

  /*
   * ============================================================
   * READ RAW OPTIONS
   * ============================================================
   */

  readOptionValue(rawOptions);

  /*
   * ============================================================
   * FALLBACK:
   *
   * DIRECT DATABASE FIELDS
   *
   * option_a
   * option_b
   * option_c
   * option_d
   * ============================================================
   */

  if (
    optionEntries.length === 0
  ) {
    addOption(
      "A",
      data.option_a ??
        data.optionA ??
        rawQuestion.option_a ??
        rawQuestion.optionA,
    );

    addOption(
      "B",
      data.option_b ??
        data.optionB ??
        rawQuestion.option_b ??
        rawQuestion.optionB,
    );

    addOption(
      "C",
      data.option_c ??
        data.optionC ??
        rawQuestion.option_c ??
        rawQuestion.optionC,
    );

    addOption(
      "D",
      data.option_d ??
        data.optionD ??
        rawQuestion.option_d ??
        rawQuestion.optionD,
    );
  }

  /*
   * ============================================================
   * FALLBACK:
   *
   * COMMON DATABASE COLUMN NAMES
   * ============================================================
   */

  if (
    optionEntries.length === 0
  ) {
    addOption(
      "A",
      data.optionA ??
        data.choice_a ??
        data.choiceA,
    );

    addOption(
      "B",
      data.optionB ??
        data.choice_b ??
        data.choiceB,
    );

    addOption(
      "C",
      data.optionC ??
        data.choice_c ??
        data.choiceC,
    );

    addOption(
      "D",
      data.optionD ??
        data.choice_d ??
        data.choiceD,
    );
  }

  /*
   * ============================================================
   * SORT A → B → C → D
   * ============================================================
   */

  const optionOrder: Record<
    string,
    number
  > = {
    A: 0,
    B: 1,
    C: 2,
    D: 3,
  };

  optionEntries.sort(
    (a, b) =>
      (optionOrder[a.key] ??
        99) -
      (optionOrder[b.key] ??
        99),
  );

  /*
   * ============================================================
   * DEBUG
   * ============================================================
   */

  console.log(
    "[QUESTION CARD]",
    {
      question,
      data,
      type,
      questionText,
      rawOptions,
      optionEntries,
      directOptions: {
        option_a: data.option_a,
        option_b: data.option_b,
        option_c: data.option_c,
        option_d: data.option_d,
      },
    },
  );

  /*
   * ============================================================
   * SELECT OPTION
   * ============================================================
   */

  const toggleOption = (key: string) => {
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
            <p className="text-xs text-slate-400 mt-1">Select one answer</p>
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

        {/* OPTIONS */}

        <div className="mt-8 space-y-3">

          {optionEntries.length ===
          0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

              <p className="text-sm font-semibold text-amber-800">
                No options available
                for this question.
              </p>

              <p className="mt-1 text-xs text-amber-700">
                Question type:{" "}
                {type ||
                  "unknown"}
              </p>

              <p className="mt-1 text-xs text-amber-700">
                Check the browser
                console for the
                question response.
              </p>

            </div>
          ) : (
            optionEntries.map(
              ({
                key,
                text,
              }) => {
                const selected =
                  selectedAnswers.includes(
                    key,
                  );

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      toggleOption(
                        key,
                      )
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
                        <Check
                          size={16}
                        />
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
              },
            )
          )}

        </div>

      </div>
    </div>
  );
}