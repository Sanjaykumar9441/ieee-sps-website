import { useState } from "react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { CheckCircle, Download, FileUp, X } from "lucide-react";
import {
  validateImportedQuestions,
  checkQuestionDuplicates,
  finalImportQuestions,
} from "../../../Assessment/assessmentApi";

type QuestionType =
  | "MCQ"
  | "MULTIPLE_CORRECT"
  | "TRUE_FALSE"
  | "FILL_IN_THE_BLANK";
type ImportQuestion = {
  question_text: string;
  question_type: QuestionType;
  options: string[];
  correct_answers: number[];
};

interface Props {
  open: boolean;
  bankId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const cleanHeader = (v: unknown) =>
  String(v ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
const aliases: Record<string, string[]> = {
  question_text: ["question_text", "question"],
  question_type: ["question_type", "type"],
  option_a: ["option_a", "option_a_text", "a", "option1", "option_1"],
  option_b: ["option_b", "option_b_text", "b", "option2", "option_2"],
  option_c: ["option_c", "option_c_text", "c", "option3", "option_3"],
  option_d: ["option_d", "option_d_text", "d", "option4", "option_4"],
  correct_answers: [
    "correct_answers",
    "correct_answer",
    "correct",
    "answer",
    "answers",
  ],
};
const get = (row: Record<string, string>, key: string) =>
  (aliases[key] || [key])
    .map((name) => row[name])
    .find((value) => value !== undefined) || "";

const typeOf = (value: string): QuestionType => {
  const x = cleanHeader(value);
  if (
    [
      "multiple_correct",
      "multiple_choice",
      "multiple",
      "multiple_choice_question",
    ].includes(x)
  )
    return "MULTIPLE_CORRECT";
  if (
    [
      "true_false",
      "truefalse",
      "true_or_false",
      "true_false_question",
    ].includes(x)
  )
    return "TRUE_FALSE";
  if (
    [
      "fill_in_the_blank",
      "fill_in_blank",
      "fill_blank",
      "fill_in_the_blank_with_options",
    ].includes(x)
  )
    return "FILL_IN_THE_BLANK";
  return "MCQ";
};

const parseCorrect = (value: string, type: QuestionType, options: string[]) => {
  const values = String(value ?? "")
    .split(/[|;,]/)
    .map((v) => v.trim())
    .filter(Boolean);
  return [
    ...new Set(
      values
        .map((v) => {
          const x = v.toUpperCase();
          if (type === "TRUE_FALSE")
            return ["TRUE", "A", "1"].includes(x)
              ? 0
              : ["FALSE", "B", "2"].includes(x)
                ? 1
                : -1;
          if (/^[A-D]$/.test(x)) return x.charCodeAt(0) - 65;
          if (/^[1-4]$/.test(v)) return Number(v) - 1;
          if (/^0$/.test(v)) return 0;
          return options.findIndex(
            (option) => option.toLowerCase() === v.toLowerCase(),
          );
        })
        .filter(
          (index) =>
            Number.isInteger(index) && index >= 0 && index < options.length,
        ),
    ),
  ];
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
      "True",
    ],
    [
      "The output of an AND gate with all inputs HIGH is ___.",
      "FILL_IN_THE_BLANK",
      "HIGH",
      "LOW",
      "Z",
      "X",
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
  const a = document.createElement("a");
  a.href = url;
  a.download = "assessment-question-template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export default function ImportQuestionsModal({
  open,
  bankId,
  onClose,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<ImportQuestion[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState(0);
  const [validated, setValidated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<any>(null);
  if (!open) return null;

  const reset = () => {
    setFile(null);
    setQuestions([]);
    setErrors([]);
    setDuplicates(0);
    setValidated(false);
    setDone(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  const read = async () => {
    if (!file) return toast.error("Choose a CSV or Excel file.");
    try {
      setBusy(true);
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) throw new Error("No worksheet found.");
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        defval: "",
        raw: false,
      });
      if (!rows.length) throw new Error("The file is empty.");
      const parsed = rows
        .map((row) => {
          const record: Record<string, string> = {};
          Object.keys(row).forEach((key) => {
            record[cleanHeader(key)] = String(row[key] ?? "").trim();
          });
          const type = typeOf(get(record, "question_type"));
          const options =
            type === "TRUE_FALSE"
              ? ["True", "False"]
              : [
                  get(record, "option_a"),
                  get(record, "option_b"),
                  get(record, "option_c"),
                  get(record, "option_d"),
                ];
          return {
            question_text: get(record, "question_text"),
            question_type: type,
            options,
            correct_answers: parseCorrect(
              get(record, "correct_answers"),
              type,
              options,
            ),
          };
        })
        .filter((question) => question.question_text.trim());
      if (!parsed.length) throw new Error("No question rows were found.");
      setQuestions(parsed);
      setErrors([]);
      setDuplicates(0);
      setValidated(false);
      toast.success(`${parsed.length} questions loaded.`);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Unable to read file.");
    } finally {
      setBusy(false);
    }
  };

  const validate = async () => {
    if (!questions.length) return toast.error("Load a question file first.");
    try {
      setBusy(true);
      setValidated(false);
      const result = await validateImportedQuestions(bankId, questions);
      const validationErrors =
        result.errors ||
        (result.results || [])
          .filter((item: any) => item.status === "invalid")
          .map((item: any) => item.message);
      setErrors(validationErrors);
      if (validationErrors.length) {
        toast.error(`${validationErrors.length} validation error(s).`);
        return;
      }
      const duplicateResult = await checkQuestionDuplicates(bankId, questions);
      const count = Number(duplicateResult.duplicateCount || 0);
      setDuplicates(count);
      setValidated(true);
      toast.success(
        count
          ? `${count} duplicate(s) will be skipped.`
          : "File is valid and ready to import.",
      );
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Validation failed.");
    } finally {
      setBusy(false);
    }
  };

  const importNow = async () => {
    if (!validated || errors.length)
      return toast.error("Validate the file successfully before importing.");
    try {
      setBusy(true);
      const result = await finalImportQuestions(bankId, questions);
      setDone(result);
      toast.success(result.message || "Questions imported successfully.");
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Import failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-bold">Import Questions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use the template. Marks and negative marking are configured at
              assessment level.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-lg border p-2"
          >
            <X size={18} />
          </button>
        </div>
        {done ? (
          <div className="p-10 text-center">
            <CheckCircle className="mx-auto text-emerald-600" size={64} />
            <h3 className="mt-4 text-2xl font-bold">Import Completed</h3>
            <p className="mt-2 text-slate-500">
              Imported {done.imported ?? 0} question(s). Duplicates skipped:{" "}
              {done.duplicates ?? duplicates}.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-6 rounded-xl bg-[#00629B] px-6 py-3 text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-6 p-6">
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="font-semibold">CSV / Excel columns</p>
              <p className="mt-1 font-mono text-xs leading-6">
                question_text, question_type, option_a, option_b, option_c,
                option_d, correct_answers
              </p>
              <p className="mt-1 text-xs text-slate-500">
                MCQ: one answer. Multiple Correct: two or more. True/False: True
                or False. Fill in the Blank: one correct option. Use A-D or 1-4
                for correct answers.
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
                Choose File
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              <button
                type="button"
                onClick={() => void read()}
                disabled={!file || busy}
                className="rounded-xl border px-4 py-3 font-semibold disabled:opacity-50"
              >
                Load File
              </button>
              <button
                type="button"
                onClick={() => void validate()}
                disabled={!questions.length || busy}
                className="rounded-xl border px-4 py-3 font-semibold disabled:opacity-50"
              >
                Validate
              </button>
              <button
                type="button"
                onClick={() => void importNow()}
                disabled={!validated || busy}
                className="rounded-xl bg-[#00629B] px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Working..." : "Import Questions"}
              </button>
            </div>
            {file && (
              <p className="text-sm font-medium text-slate-600">
                Selected: {file.name}
              </p>
            )}
            {questions.length > 0 && (
              <div className="overflow-x-auto rounded-xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">#</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Question</th>
                      <th className="p-3 text-left">Correct</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.slice(0, 100).map((q, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-3">{i + 1}</td>
                        <td className="p-3">
                          {q.question_type === "MULTIPLE_CORRECT"
                            ? "Multiple Correct"
                            : q.question_type === "TRUE_FALSE"
                              ? "True / False"
                              : q.question_type === "FILL_IN_THE_BLANK"
                                ? "Fill in the Blank"
                                : "MCQ"}
                        </td>
                        <td className="p-3">{q.question_text}</td>
                        <td className="p-3">
                          {q.correct_answers
                            .map((index) => String.fromCharCode(65 + index))
                            .join(", ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {errors.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="font-semibold">Validation errors</p>
                <ul className="mt-2 list-disc pl-5">
                  {errors.slice(0, 50).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {duplicates > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {duplicates} duplicate question(s) will be skipped
                automatically.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
