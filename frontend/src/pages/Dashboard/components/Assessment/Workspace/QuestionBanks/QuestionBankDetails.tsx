import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  ArrowLeft,
  Copy,
  Download,
  Edit3,
  Eye,
  FileUp,
  Plus,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { socket } from "../../../../../../lib/socket";
import {
  getQuestions,
  deleteQuestion,
  duplicateQuestion,
  validateImportedQuestions,
  checkQuestionDuplicates,
  finalImportQuestions,
} from "../../../Assessment/assessmentApi";
import { QuestionBank } from "./QuestionBanks";
import QuestionEditor from "./QuestionEditor";

interface Props {
  bank: QuestionBank;
  onBack: () => void;
}
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
  options: string[];
  correct_answers: number[];
  is_active?: boolean;
}
interface ImportQuestion {
  question_text: string;
  question_type: QuestionType;
  options: string[];
  correct_answers: number[];
}

const parseCSV = (text: string) => {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const ch = source[i],
      next = source[i + 1];
    if (ch === '"' && quoted && next === '"') {
      cell += '"';
      i++;
      continue;
    }
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
};
const cleanHeader = (value: string) =>
  String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
const normalizeType = (value: string): QuestionType => {
  const type = cleanHeader(value);
  if (
    [
      "multiple_correct",
      "multiple_choice",
      "multiple_choice_question",
      "multiple",
    ].includes(type)
  )
    return "MULTIPLE_CORRECT";
  if (
    [
      "fill_in_the_blank",
      "fill_in_blank",
      "fill_blank",
      "fill_in_the_blank_with_options",
    ].includes(type)
  )
    return "FILL_IN_THE_BLANK";
  if (
    [
      "true_false",
      "truefalse",
      "true_or_false",
      "true_false_question",
    ].includes(type)
  )
    return "TRUE_FALSE";
  return "MCQ";
};
const normalizeCorrect = (
  value: string,
  type: QuestionType,
  options: string[] = [],
) => {
  const values = String(value ?? "")
    .split(/[|;,]/)
    .map((v) => v.trim())
    .filter(Boolean);
  if (type === "TRUE_FALSE") {
    const v = (values[0] || "").toLowerCase();
    if (["true", "a", "1"].includes(v)) return [0];
    if (["false", "b", "2"].includes(v)) return [1];
    return [];
  }
  return values
    .map((v) => {
      const upper = v.toUpperCase();
      if (/^[A-D]$/.test(upper)) return upper.charCodeAt(0) - 65;
      if (/^[1-4]$/.test(v)) return Number(v) - 1;
      const match = options.findIndex(
        (o) => o.toLowerCase() === v.toLowerCase(),
      );
      return match;
    })
    .filter((v) => Number.isInteger(v) && v >= 0 && v < options.length)
    .filter((v, i, a) => a.indexOf(v) === i);
};
const normalizeOptions = (options: any): string[] =>
  Array.isArray(options)
    ? options.map((v) => String(v ?? "").trim())
    : ["A", "B", "C", "D"].map((k) =>
        String(options?.[k] ?? options?.[k.toLowerCase()] ?? "").trim(),
      );
const fieldAliases: Record<string, string[]> = {
  question_text: ["question_text", "question", "question_text_"],
  question_type: ["question_type", "question_type_", "type"],
  option_a: [
    "option_a",
    "option_a_",
    "option_a_text",
    "a",
    "option1",
    "option_1",
  ],
  option_b: [
    "option_b",
    "option_b_",
    "option_b_text",
    "b",
    "option2",
    "option_2",
  ],
  option_c: [
    "option_c",
    "option_c_",
    "option_c_text",
    "c",
    "option3",
    "option_3",
  ],
  option_d: [
    "option_d",
    "option_d_",
    "option_d_text",
    "d",
    "option4",
    "option_4",
  ],
  correct_answers: [
    "correct_answers",
    "correct_answer",
    "correct",
    "answer",
    "answers",
  ],
};
const getField = (record: Record<string, string>, name: string) => {
  for (const alias of fieldAliases[name] || [name]) {
    if (record[alias] !== undefined) return record[alias];
  }
  return "";
};

export default function QuestionBankDetails({ bank, onBack }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importQuestions, setImportQuestions] = useState<ImportQuestion[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [importBusy, setImportBusy] = useState(false);
  const [validated, setValidated] = useState(false);
  const [preview, setPreview] = useState<Question | null>(null);
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const rows = await getQuestions(bank.id);
      setQuestions(
        (rows || [])
          .filter((q: any) => q?.is_active !== false)
          .map((q: any) => ({
            ...q,
            options: normalizeOptions(q.options),
            correct_answers: (Array.isArray(q.correct_answers)
              ? q.correct_answers
              : [q.correct_answers].filter((v) => v != null)
            )
              .map((v: any) => {
                if (typeof v === "number") return v;
                const s = String(v).trim().toUpperCase();
                return /^[A-D]$/.test(s) ? s.charCodeAt(0) - 65 : Number(s);
              })
              .filter((v: number) => Number.isInteger(v) && v >= 0 && v < 4),
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
      questions.filter((q) =>
        q.question_text.toLowerCase().includes(search.toLowerCase()),
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
  const downloadTemplate = () => {
    const rows = [
      [
        "question_text",
        "question_type",
        "option_a",
        "option_b",
        "option_c",
        "option_d",
        "correct_answers",
      ],
      [
        "What is a multiplexer?",
        "MCQ",
        "MUX",
        "Encoder",
        "Decoder",
        "Register",
        "A",
      ],
      [
        "Which are programming languages?",
        "MULTIPLE_CORRECT",
        "C",
        "Python",
        "HTML",
        "JavaScript",
        "A|B|D",
      ],
      [
        "The Earth is the third planet from the Sun.",
        "TRUE_FALSE",
        "True",
        "False",
        "",
        "",
        "A",
      ],
    ];
    const csv = rows
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "assessment-question-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  const handleCSV = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a CSV file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCSV(String(reader.result || ""));
        if (rows.length < 2)
          throw new Error(
            "CSV must contain a header and at least one question.",
          );
        const headers = rows[0].map(cleanHeader);
        const missing = Object.entries(fieldAliases)
          .filter(
            ([, aliases]) => !aliases.some((alias) => headers.includes(alias)),
          )
          .map(([name]) => name);
        if (missing.length)
          throw new Error(
            `Missing required columns: ${missing.join(", ")}. Use the Download Template button for the exact format.`,
          );
        const parsed = rows
          .slice(1)
          .map((values, rowIndex) => {
            const record: Record<string, string> = {};
            headers.forEach((header, index) => {
              record[header] = String(values[index] ?? "").trim();
            });
            const type = normalizeType(getField(record, "question_type"));
            const options =
              type === "TRUE_FALSE"
                ? ["True", "False"]
                : [
                    getField(record, "option_a"),
                    getField(record, "option_b"),
                    getField(record, "option_c"),
                    getField(record, "option_d"),
                  ];
            return {
              question_text: getField(record, "question_text"),
              question_type: type,
              options,
              correct_answers: normalizeCorrect(
                getField(record, "correct_answers"),
                type,
                options,
              ),
            };
          })
          .filter((q) => q.question_text || q.options.some(Boolean));
        if (!parsed.length) throw new Error("No question rows were found.");
        setImportQuestions(parsed);
        setImportErrors([]);
        setDuplicateCount(0);
        setValidated(false);
        toast.success(
          `${parsed.length} questions loaded. Validate before importing.`,
        );
      } catch (error: any) {
        console.error(error);
        toast.error(error?.message || "Unable to parse CSV");
      }
    };
    reader.readAsText(file);
  };
  const validateImport = async () => {
    if (!importQuestions.length) {
      toast.error("Choose a CSV first.");
      return;
    }
    try {
      setImportBusy(true);
      setValidated(false);
      const validation = await validateImportedQuestions(
        bank.id,
        importQuestions,
      );
      const errors =
        validation.errors ||
        (validation.results || [])
          .filter((item: any) => item.status === "invalid")
          .map((item: any) => item.message);
      setImportErrors(errors);
      if (errors.length) {
        toast.error(`${errors.length} validation error(s).`);
        return;
      }
      const duplicates = await checkQuestionDuplicates(
        bank.id,
        importQuestions,
      );
      const count = Number(duplicates.duplicateCount || 0);
      setDuplicateCount(count);
      if (count) {
        toast(`${count} duplicate question(s) will be skipped automatically.`);
      }
      setValidated(true);
      toast.success("CSV is valid and ready to import.");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Unable to validate CSV");
    } finally {
      setImportBusy(false);
    }
  };
  const importNow = async () => {
    if (!importQuestions.length) {
      toast.error("Choose a CSV first.");
      return;
    }
    if (!validated || importErrors.length) {
      toast.error("Validate the CSV successfully before importing.");
      return;
    }
    try {
      setImportBusy(true);
      const result = await finalImportQuestions(bank.id, importQuestions);
      toast.success(result.message || "Questions imported successfully.");
      setImportOpen(false);
      setImportQuestions([]);
      setDuplicateCount(0);
      setImportErrors([]);
      setValidated(false);
      await fetchQuestions();
      window.dispatchEvent(new CustomEvent("assessment-data-changed"));
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Unable to import questions",
      );
    } finally {
      setImportBusy(false);
    }
  };
  if (loading)
    return (
      <div className="rounded-2xl border bg-white py-24 text-center text-slate-500">
        Loading Questions...
      </div>
    );
  if (editorOpen)
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
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-[#00629B]"
      >
        <ArrowLeft size={18} />
        Back to Question Banks
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
            {questions.length} active questions · 1 mark each
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
            <Plus size={18} />
            Add Question
          </button>
          <button
            type="button"
            onClick={() => {
              setImportOpen(true);
              setImportQuestions([]);
              setImportErrors([]);
              setDuplicateCount(0);
              setValidated(false);
            }}
            className="flex items-center gap-2 rounded-xl border border-[#00629B] px-5 py-3 font-semibold text-[#00629B]"
          >
            <FileUp size={18} />
            Import CSV
          </button>
        </div>
      </div>
      <div className="rounded-2xl border bg-white p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
            Add a question manually or import a CSV.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((q, index) => {
            const opts =
              q.question_type === "TRUE_FALSE" ? ["True", "False"] : q.options;
            const correct = q.correct_answers.map((a) =>
              String.fromCharCode(65 + a),
            );
            return (
              <div
                key={q.id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Q{index + 1}
                      </span>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {q.question_type === "MULTIPLE_CORRECT"
                          ? "Multiple Correct"
                          : q.question_type === "TRUE_FALSE"
                            ? "True / False"
                            : q.question_type === "FILL_IN_THE_BLANK"
                              ? "Fill in the Blank"
                              : "MCQ"}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        1 mark
                      </span>
                    </div>
                    <p className="mt-4 text-base font-medium leading-7 text-slate-900">
                      {q.question_text}
                    </p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {opts.map((opt, i) => (
                        <div
                          key={i}
                          className={`rounded-xl border p-3 text-sm ${correct.includes(String.fromCharCode(65 + i)) ? "border-emerald-300 bg-emerald-50" : "border-slate-200"}`}
                        >
                          <span className="mr-2 font-bold">
                            {String.fromCharCode(65 + i)}.
                          </span>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:w-40 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => setPreview(q)}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      <Eye size={15} className="mr-1 inline" />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestion(q);
                        setEditorOpen(true);
                      }}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      <Edit3 size={15} className="mr-1 inline" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDuplicate(q.id)}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      <Copy size={15} className="mr-1 inline" />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(q.id)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600"
                    >
                      <Trash2 size={15} className="mr-1 inline" />
                      Delete
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
          onMouseDown={(e) => e.target === e.currentTarget && setPreview(null)}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-xl font-bold">Student Preview</h2>
                <p className="text-sm text-slate-500">
                  1 mark ·{" "}
                  {preview.question_type === "MULTIPLE_CORRECT"
                    ? "Select all correct answers."
                    : preview.question_type === "TRUE_FALSE"
                      ? "Select True or False."
                      : "Select one correct answer."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-lg border px-4 py-2"
              >
                Close
              </button>
            </div>
            <div className="p-6">
              <p className="text-lg font-semibold text-slate-900">
                {preview.question_text}
              </p>
              <div className="mt-6 space-y-3">
                {(preview.question_type === "TRUE_FALSE"
                  ? ["True", "False"]
                  : preview.options
                ).map((opt, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border p-4"
                  >
                    <span className="font-bold">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <span>{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {importOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-xl font-bold">Import Questions from CSV</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Supports MCQ, Multiple Correct and True / False. No
                  explanation or tag columns.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !importBusy && setImportOpen(false)}
                className="rounded-lg border px-3 py-2"
              >
                Close
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-semibold">CSV columns</p>
                <p className="mt-1 font-mono text-xs leading-6">
                  question_text, question_type, option_a, option_b, option_c,
                  option_d, correct_answers
                </p>
                <p className="mt-2">
                  MCQ: A · Multiple Correct: A|C|D · True/False: True or False.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 rounded-xl border px-4 py-3"
                >
                  <Download size={17} />
                  Download Template
                </button>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#00629B] px-4 py-3 font-semibold text-white">
                  <FileUp size={17} />
                  Choose CSV
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleCSV}
                  />
                </label>
              </div>
              {importQuestions.length > 0 && (
                <div className="rounded-xl border p-4">
                  <p className="font-semibold">
                    Loaded: {importQuestions.length} questions
                  </p>
                  {importErrors.length > 0 && (
                    <ul className="mt-3 list-disc pl-5 text-sm text-red-600">
                      {importErrors.slice(0, 20).map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  )}
                  {duplicateCount > 0 && (
                    <p className="mt-3 text-sm font-semibold text-amber-700">
                      {duplicateCount} duplicate question(s) found.
                    </p>
                  )}
                  {validated && (
                    <p className="mt-3 text-sm font-semibold text-green-700">
                      CSV validated successfully.
                    </p>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => void validateImport()}
                  disabled={importBusy || !importQuestions.length}
                  className="rounded-xl border px-5 py-3 font-semibold disabled:opacity-50"
                >
                  Validate CSV
                </button>
                <button
                  type="button"
                  onClick={() => void importNow()}
                  disabled={importBusy || !validated}
                  className="rounded-xl bg-[#00629B] px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {importBusy ? "Working..." : "Import Questions"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
