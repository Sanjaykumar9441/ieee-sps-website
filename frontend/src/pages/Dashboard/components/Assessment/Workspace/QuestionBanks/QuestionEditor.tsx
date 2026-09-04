import { useEffect, useState } from "react";
import { ArrowLeft, Eye, CheckCircle, Save, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import {
  createQuestion,
  updateQuestion,
} from "../../../Assessment/assessmentApi";

type QuestionType =
  | "MCQ"
  | "MULTIPLE_CORRECT"
  | "TRUE_FALSE"
  | "FILL_IN_THE_BLANK";

interface InitialQuestion {
  id?: string;
  bank_id?: string;
  question_text: string;
  question_type: QuestionType;
  options: string[] | Record<string, unknown>;
  correct_answers: unknown;
}

interface Props {
  bankId: string;
  initialQuestion?: InitialQuestion | null;
  onBack: () => void;
  onSaved: () => void;
}

interface Question {
  id?: string;
  bank_id?: string;
  question_text: string;
  question_type: QuestionType;
  options: string[];
  correct_answers: number[];
}

const blankQuestion: Question = {
  question_text: "",
  question_type: "MCQ",
  options: ["", "", "", ""],
  correct_answers: [],
};

function normalizeOptions(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item ?? ""));
  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    return ["A", "B", "C", "D"].map((key) =>
      String(objectValue[key] ?? objectValue[key.toLowerCase()] ?? ""),
    );
  }
  return [];
}

function normalizeAnswerInput(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];
    if (
      (text.startsWith("[") && text.endsWith("]")) ||
      (text.startsWith('"') && text.endsWith('"'))
    ) {
      try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // Fall through to separator parsing.
      }
    }
    return text
      .split(/[|;,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [value];
}

function normalizeCorrect(value: unknown, options: string[]): number[] {
  return [
    ...new Set(
      normalizeAnswerInput(value)
        .map((answer) => {
          const text = String(answer ?? "").trim();
          if (!text) return -1;
          if (/^[A-D]$/i.test(text))
            return text.toUpperCase().charCodeAt(0) - 65;
          if (/^[1-4]$/.test(text)) return Number(text) - 1;
          if (/^\d+$/.test(text)) {
            const numeric = Number(text);
            return numeric >= 0 && numeric < options.length ? numeric : -1;
          }
          return options.findIndex(
            (option) => option.trim().toLowerCase() === text.toLowerCase(),
          );
        })
        .filter(
          (index) =>
            Number.isInteger(index) && index >= 0 && index < options.length,
        ),
    ),
  ];
}

export default function QuestionEditor({
  bankId,
  initialQuestion,
  onBack,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<string[]>([]);
  const [question, setQuestion] = useState<Question>({
    ...blankQuestion,
    options: [...blankQuestion.options],
  });
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!initialQuestion) {
      setQuestion({ ...blankQuestion, options: [...blankQuestion.options] });
      setValidation([]);
      return;
    }

    const rawType = String(initialQuestion.question_type || "MCQ")
      .toUpperCase()
      .replace(/[\s-]+/g, "_");
    const type: QuestionType =
      rawType === "TRUE_FALSE"
        ? "TRUE_FALSE"
        : rawType === "MULTIPLE_CORRECT" ||
            rawType === "MULTIPLE_CHOICE" ||
            rawType === "MULTIPLE"
          ? "MULTIPLE_CORRECT"
          : rawType === "FILL_IN_THE_BLANK" ||
              rawType === "FILL_IN_BLANK" ||
              rawType === "FILL_BLANK"
            ? "FILL_IN_THE_BLANK"
            : "MCQ";

    const options =
      type === "TRUE_FALSE"
        ? ["True", "False"]
        : normalizeOptions(initialQuestion.options).slice(0, 4);

    while (type !== "TRUE_FALSE" && options.length < 4) options.push("");

    setQuestion({
      id: initialQuestion.id,
      bank_id: initialQuestion.bank_id,
      question_text: String(initialQuestion.question_text || ""),
      question_type: type,
      options,
      correct_answers: normalizeCorrect(
        initialQuestion.correct_answers,
        options,
      ),
    });
    setValidation([]);
  }, [initialQuestion]);

  const compactOptions = () => {
    const original = question.options;
    const options: string[] = [];
    const indexMap = new Map<number, number>();
    original.forEach((option, index) => {
      const value = option.trim();
      if (!value) return;
      indexMap.set(index, options.length);
      options.push(value);
    });
    const correct = question.correct_answers
      .map((index) => indexMap.get(index))
      .filter((index): index is number => Number.isInteger(index));
    return { options, correct: [...new Set(correct)] };
  };

  const handleValidate = () => {
    const errors: string[] = [];
    if (!question.question_text.trim())
      errors.push("Question text is required.");

    if (question.question_type === "TRUE_FALSE") {
      if (
        question.correct_answers.length !== 1 ||
        ![0, 1].includes(question.correct_answers[0])
      ) {
        errors.push("Correct answer must be True or False.");
      }
    } else {
      const { options, correct } = compactOptions();
      if (options.length < 2 || options.length > 4)
        errors.push("Use between 2 and 4 answer options.");
      if (
        new Set(options.map((option) => option.toLowerCase())).size !==
        options.length
      ) {
        errors.push("Answer options must be different.");
      }
      if (!correct.length) errors.push("Select at least one correct answer.");
      if (
        (question.question_type === "MCQ" ||
          question.question_type === "FILL_IN_THE_BLANK") &&
        correct.length !== 1
      ) {
        errors.push(
          question.question_type === "FILL_IN_THE_BLANK"
            ? "Fill in the Blank requires exactly one correct option."
            : "MCQ requires exactly one correct answer.",
        );
      }
      if (question.question_type === "MULTIPLE_CORRECT" && correct.length < 2) {
        errors.push("Multiple Correct requires at least two correct answers.");
      }
    }

    setValidation(errors);
    if (!errors.length) toast.success("Question is valid.");
    return errors;
  };

  const handleSave = async () => {
    const errors = handleValidate();
    if (errors.length) return;

    try {
      setLoading(true);
      const { options, correct } =
        question.question_type === "TRUE_FALSE"
          ? { options: ["True", "False"], correct: question.correct_answers }
          : compactOptions();

      const payload = {
        question_text: question.question_text.trim(),
        question_type: question.question_type,
        options,
        correct_answers: correct,
      };

      if (question.id) await updateQuestion(question.id, payload);
      else await createQuestion({ ...payload, bank_id: bankId });

      toast.success("Question saved successfully.");
      onSaved();
    } catch (err: any) {
      console.error("Question save error:", err);
      toast.error(err?.response?.data?.message || "Unable to save question.");
    } finally {
      setLoading(false);
    }
  };

  const setType = (type: QuestionType) => {
    setQuestion((current) => ({
      ...current,
      question_type: type,
      options:
        type === "TRUE_FALSE"
          ? ["True", "False"]
          : [
              ...current.options.slice(0, 4),
              ...Array(Math.max(0, 4 - current.options.length)).fill(""),
            ],
      correct_answers:
        type === "MCQ" || type === "FILL_IN_THE_BLANK" || type === "TRUE_FALSE"
          ? current.correct_answers.slice(0, 1)
          : current.correct_answers,
    }));
    setValidation([]);
  };

  const setOption = (index: number, value: string) => {
    setQuestion((current) => {
      const options = [...current.options];
      options[index] = value;
      return { ...current, options };
    });
    setValidation([]);
  };

  const deleteOption = (index: number) => {
    if (question.options.length <= 2)
      return toast.error("At least two options are required.");
    setQuestion((current) => ({
      ...current,
      options: current.options.filter(
        (_, optionIndex) => optionIndex !== index,
      ),
      correct_answers: current.correct_answers
        .filter((answer) => answer !== index)
        .map((answer) => (answer > index ? answer - 1 : answer)),
    }));
  };

  const setCorrectAnswer = (index: number) => {
    setQuestion((current) => {
      if (
        current.question_type === "MCQ" ||
        current.question_type === "FILL_IN_THE_BLANK" ||
        current.question_type === "TRUE_FALSE"
      ) {
        return { ...current, correct_answers: [index] };
      }
      return current.correct_answers.includes(index)
        ? {
            ...current,
            correct_answers: current.correct_answers.filter((i) => i !== index),
          }
        : { ...current, correct_answers: [...current.correct_answers, index] };
    });
    setValidation([]);
  };

  const optionLabel = (index: number) => String.fromCharCode(65 + index);

  return (
    <div className="pb-10">
      <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-[#00629B]"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <h1 className="mt-3 text-3xl font-bold">Question Editor</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create an MCQ, Multiple Correct, True/False or Fill in the Blank
            question.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-2 rounded-xl border px-5 py-3"
          >
            <Eye size={18} />
            Preview
          </button>
          <button
            type="button"
            onClick={handleValidate}
            className="flex items-center gap-2 rounded-xl border px-5 py-3"
          >
            <CheckCircle size={18} />
            Validate
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#00629B] px-5 py-3 text-white disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {validation.length > 0 && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Please fix the following:</p>
          <ul className="mt-2 list-disc pl-5">
            {validation.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="mt-8 rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Question</h2>
        <div className="mt-5 max-w-xl">
          <label className="mb-2 block text-sm font-medium">
            Question Type
          </label>
          <select
            value={question.question_type}
            onChange={(event) => setType(event.target.value as QuestionType)}
            className="w-full rounded-xl border p-3"
          >
            <option value="MCQ">MCQ — One Correct Answer</option>
            <option value="MULTIPLE_CORRECT">
              Multiple Correct — Multiple Answers
            </option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="FILL_IN_THE_BLANK">
              Fill in the Blank with Options
            </option>
          </select>
        </div>
        <textarea
          rows={6}
          value={question.question_text}
          onChange={(event) => {
            setQuestion({ ...question, question_text: event.target.value });
            setValidation([]);
          }}
          placeholder={
            question.question_type === "FILL_IN_THE_BLANK"
              ? "Enter the sentence with a blank (___) here..."
              : "Enter question here..."
          }
          className="mt-5 w-full rounded-xl border p-4"
        />
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Answer Options</h2>
            <p className="mt-1 text-sm text-gray-500">
              {question.question_type === "TRUE_FALSE"
                ? "Choose True or False."
                : question.question_type === "MCQ"
                  ? "Select exactly one correct option."
                  : question.question_type === "FILL_IN_THE_BLANK"
                    ? "Enter the sentence with a blank (___) and select exactly one correct option."
                    : "Select all correct options."}
            </p>
          </div>
          {question.question_type !== "TRUE_FALSE" &&
            question.options.length < 4 && (
              <button
                type="button"
                onClick={() =>
                  setQuestion((current) => ({
                    ...current,
                    options: [...current.options, ""],
                  }))
                }
                className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"
              >
                <Plus size={16} />
                Add Option
              </button>
            )}
        </div>

        <div className="mt-5 space-y-4">
          {question.options.map((option, index) => (
            <div
              key={`${index}-${optionLabel(index)}`}
              className="flex items-center gap-3"
            >
              <input
                type={
                  question.question_type === "MULTIPLE_CORRECT"
                    ? "checkbox"
                    : "radio"
                }
                name="correct-answer"
                checked={question.correct_answers.includes(index)}
                onChange={() => setCorrectAnswer(index)}
                aria-label={`Mark option ${optionLabel(index)} correct`}
              />
              <span className="w-6 font-semibold">{optionLabel(index)}</span>
              <input
                value={option}
                disabled={question.question_type === "TRUE_FALSE"}
                onChange={(event) => setOption(index, event.target.value)}
                placeholder={`Option ${optionLabel(index)}`}
                className="w-full rounded-xl border p-3 disabled:bg-gray-50"
              />
              {question.question_type !== "TRUE_FALSE" && (
                <button
                  type="button"
                  onClick={() => deleteOption(index)}
                  title="Delete option"
                  aria-label={`Delete option ${optionLabel(index)}`}
                  className="rounded-xl border border-red-200 p-3 text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {previewOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-5">
              <h2 className="text-xl font-bold">Student Preview</h2>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-lg border px-3 py-2"
              >
                Close
              </button>
            </div>
            <div className="p-6">
              <p className="text-lg font-semibold">
                {question.question_text || "Question text will appear here."}
              </p>
              <p className="mt-2 text-sm font-medium text-[#00629B]">
                {question.question_type === "MCQ"
                  ? "MCQ — Select one answer"
                  : question.question_type === "MULTIPLE_CORRECT"
                    ? "Multiple Correct — Select all applicable answers"
                    : question.question_type === "TRUE_FALSE"
                      ? "True / False — Select one answer"
                      : "Fill in the Blank — Select one answer"}
              </p>
              <div className="mt-6 space-y-3">
                {question.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-xl border p-4"
                  >
                    <span className="font-bold">{optionLabel(index)}.</span>
                    <span>{option || "Option not filled"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
