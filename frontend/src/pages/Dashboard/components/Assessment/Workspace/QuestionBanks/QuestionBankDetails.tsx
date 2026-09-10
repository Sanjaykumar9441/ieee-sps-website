import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Edit3,
  Eye,
  FileUp,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { socket } from "../../../../../../lib/socket";
import {
  deleteQuestion,
  duplicateQuestion,
  getQuestions,
} from "../../../Assessment/assessmentApi";
import type { QuestionBank } from "./QuestionBanks";
import QuestionEditor from "./QuestionEditor";
import ImportQuestionsModal from "./ImportQuestionsModal";

type QuestionType =
  | "MCQ"
  | "MULTIPLE_CORRECT"
  | "TRUE_FALSE"
  | "FILL_IN_THE_BLANK";

interface Question {
  id: string;
  bank_id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[] | Record<string, string>;
  correct_answers: Array<number | string> | number | string | null;
  marks?: number;
  negative_marks?: number;
  is_active?: boolean;
}

interface Props {
  bank: QuestionBank;
  onBack: () => void;
}

function normalizeType(value: unknown): QuestionType {
  const type = String(value || "MCQ")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (["MULTIPLE_CORRECT", "MULTIPLE_CHOICE", "MULTIPLE"].includes(type))
    return "MULTIPLE_CORRECT";
  if (["TRUE_FALSE", "TRUEFALSE", "TRUE_OR_FALSE"].includes(type))
    return "TRUE_FALSE";
  if (
    [
      "FILL_IN_THE_BLANK",
      "FILL_IN_BLANK",
      "FILL_BLANK",
      "FILL_IN_THE_BLANK_WITH_OPTIONS",
    ].includes(type)
  )
    return "FILL_IN_THE_BLANK";
  return "MCQ";
}

function normalizeOptions(value: unknown): string[] {
  if (Array.isArray(value))
    return value.map((item) => String(item ?? "").trim());
  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    return ["A", "B", "C", "D"].map((key) =>
      String(objectValue[key] ?? objectValue[key.toLowerCase()] ?? "").trim(),
    );
  }
  return [];
}

function normalizeAnswers(value: unknown): Array<number | string> {
  if (Array.isArray(value)) return value;
  if (value == null || value === "") return [];
  return [value as number | string];
}

function normalizeFillAnswers(value: unknown): string[] {
  return normalizeAnswers(value)
    .map((answer) =>
      String(answer ?? "")
        .normalize("NFKC")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase(),
    )
    .filter(Boolean);
}

function optionLabel(index: number) {
  return String.fromCharCode(65 + index);
}

export default function QuestionBankDetails({ bank, onBack }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [preview, setPreview] = useState<Question | null>(null);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const rows = await getQuestions(bank.id);
      setQuestions(
        (rows || [])
          .filter((row: any) => row?.is_active !== false)
          .map((row: any) => ({
            ...row,
            question_type: normalizeType(row.question_type),
            options: normalizeOptions(row.options),
            correct_answers:
              normalizeType(row.question_type) === "FILL_IN_THE_BLANK"
                ? normalizeFillAnswers(row.correct_answers)
                : normalizeAnswers(row.correct_answers),
          })),
      );
    } catch (error) {
      console.error(error);
      toast.error("Unable to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchQuestions();
    const refresh = () => void fetchQuestions();
    socket.on("questionCreated", refresh);
    socket.on("questionUpdated", refresh);
    socket.on("questionDeleted", refresh);
    return () => {
      socket.off("questionCreated", refresh);
      socket.off("questionUpdated", refresh);
      socket.off("questionDeleted", refresh);
    };
  }, [bank.id]);

  const filtered = useMemo(
    () =>
      questions.filter((question) =>
        question.question_text.toLowerCase().includes(search.toLowerCase()),
      ),
    [questions, search],
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await deleteQuestion(id);
      toast.success("Question deleted");
      await fetchQuestions();
      window.dispatchEvent(new CustomEvent("assessment-data-changed"));
    } catch (error) {
      console.error(error);
      toast.error("Unable to delete question");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateQuestion(id);
      toast.success("Question duplicated");
      await fetchQuestions();
      window.dispatchEvent(new CustomEvent("assessment-data-changed"));
    } catch (error) {
      console.error(error);
      toast.error("Unable to duplicate question");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white py-24 text-center text-slate-500">
        Loading Questions...
      </div>
    );
  }

  if (editorOpen) {
    return (
      <QuestionEditor
        bankId={bank.id}
        initialQuestion={editingQuestion}
        onBack={() => {
          setEditorOpen(false);
          setEditingQuestion(null);
        }}
        onSaved={() => {
          setEditorOpen(false);
          setEditingQuestion(null);
          void fetchQuestions();
          window.dispatchEvent(new CustomEvent("assessment-data-changed"));
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-[#00629B]"
      >
        <ArrowLeft size={18} /> Back to Question Banks
      </button>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#00629B]">
            {bank.name}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Question Library
          </h1>
          <p className="mt-1 text-slate-500">
            {questions.length} active question
            {questions.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingQuestion(null);
              setEditorOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-[#00629B] px-5 py-3 font-semibold text-white"
          >
            <Plus size={18} /> Add Question
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-[#00629B] px-5 py-3 font-semibold text-[#00629B]"
          >
            <FileUp size={18} /> Import CSV
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search questions..."
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#00629B]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-14 text-center">
          <p className="text-xl font-semibold text-slate-900">
            {search ? "No matching questions" : "No questions yet"}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Add a question manually or import the updated CSV template.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((question, index) => {
            const type = normalizeType(question.question_type);
            const isFill = type === "FILL_IN_THE_BLANK";
            const options =
              type === "TRUE_FALSE"
                ? ["True", "False"]
                : normalizeOptions(question.options);
            const correct = normalizeAnswers(question.correct_answers);
            const correctIndexes = correct
              .map((answer) => {
                if (typeof answer === "number") return answer;
                const text = String(answer).trim().toUpperCase();
                return /^[A-D]$/.test(text) ? text.charCodeAt(0) - 65 : -1;
              })
              .filter((value) => value >= 0 && value < options.length);
            const accepted = isFill
              ? normalizeFillAnswers(question.correct_answers)
              : [];

            return (
              <div
                key={question.id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Q{index + 1}
                      </span>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {type === "MULTIPLE_CORRECT"
                          ? "Multiple Correct"
                          : type === "TRUE_FALSE"
                            ? "True / False"
                            : isFill
                              ? "Fill in the Blank"
                              : "MCQ"}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {Number(question.marks ?? 1)} mark
                        {Number(question.marks ?? 1) === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-base font-medium leading-7 text-slate-900">
                      {question.question_text}
                    </p>

                    {isFill ? (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Accepted answers
                        </p>
                        <p className="mt-2 font-semibold text-emerald-900">
                          {accepted.join(" / ") || "—"}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {options.filter(Boolean).map((option, optionIndex) => (
                          <div
                            key={`${question.id}-${optionIndex}`}
                            className={`rounded-xl border p-3 text-sm ${correctIndexes.includes(optionIndex) ? "border-emerald-300 bg-emerald-50" : "border-slate-200"}`}
                          >
                            <span className="mr-2 font-bold">
                              {optionLabel(optionIndex)}.
                            </span>
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 lg:w-40 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => setPreview(question)}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      <Eye size={15} className="mr-1 inline" /> Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestion(question);
                        setEditorOpen(true);
                      }}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      <Edit3 size={15} className="mr-1 inline" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDuplicate(question.id)}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      <Copy size={15} className="mr-1 inline" /> Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(question.id)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600"
                    >
                      <Trash2 size={15} className="mr-1 inline" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreview(null);
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Question Preview
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Student-facing question format
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mt-6 whitespace-pre-wrap text-lg leading-8 text-slate-900">
              {preview.question_text}
            </p>
            {normalizeType(preview.question_type) === "FILL_IN_THE_BLANK" ? (
              <div className="mt-6">
                <input
                  disabled
                  placeholder="Student enters answer here"
                  className="w-full rounded-xl border border-slate-300 px-4 py-4 text-slate-500"
                />
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {(normalizeType(preview.question_type) === "TRUE_FALSE"
                  ? ["True", "False"]
                  : normalizeOptions(preview.options)
                )
                  .filter(Boolean)
                  .map((option, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <span className="mr-2 font-bold">
                        {optionLabel(index)}.
                      </span>
                      {option}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ImportQuestionsModal
        open={importOpen}
        bankId={bank.id}
        onClose={() => setImportOpen(false)}
        onSuccess={() => {
          setImportOpen(false);
          void fetchQuestions();
          window.dispatchEvent(new CustomEvent("assessment-data-changed"));
        }}
      />
    </div>
  );
}
