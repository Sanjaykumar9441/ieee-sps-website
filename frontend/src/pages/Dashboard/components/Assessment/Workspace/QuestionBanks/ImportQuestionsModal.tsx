import { useState } from "react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { CheckCircle, Download, FileUp, X } from "lucide-react";
import {
  validateImportedQuestions,
  checkQuestionDuplicates,
  finalImportQuestions,
} from "../../../Assessment/assessmentApi";

interface Props {
  open: boolean;
  bankId: string;
  onClose: () => void;
  onSuccess: () => void;
}
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

const cleanHeader = (v: any) =>
  String(v ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
const aliases: Record<string, string[]> = {
  question_text: ["question_text", "question"],
  question_type: ["question_type", "type"],
  option_a: ["option_a", "option_a_text", "a"],
  option_b: ["option_b", "option_b_text", "b"],
  option_c: ["option_c", "option_c_text", "c"],
  option_d: ["option_d", "option_d_text", "d"],
  correct_answers: ["correct_answers", "correct_answer", "correct", "answer"],
};
const get = (row: Record<string, any>, key: string) => {
  for (const a of aliases[key] || [key])
    if (row[a] !== undefined) return String(row[a] ?? "").trim();
  return "";
};
const typeOf = (v: string): QuestionType => {
  const x = cleanHeader(v);
  if (
    [
      "multiple_correct",
      "multiple_choice",
      "multiple",
      "multiple_choice_question",
    ].includes(x)
  )
    return "MULTIPLE_CORRECT";
  if (["true_false", "truefalse", "true_or_false"].includes(x))
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
const parseCorrect = (value: string, type: QuestionType, options: string[]) =>
  String(value ?? "")
    .split(/[|;,]/)
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => {
      const x = v.toUpperCase();
      if (type === "TRUE_FALSE")
        return ["TRUE", "A", "1"].includes(x)
          ? 0
          : ["FALSE", "B", "2"].includes(x)
            ? 1
            : -1;
      if (/^[A-D]$/.test(x)) return x.charCodeAt(0) - 65;
      if (/^[0-3]$/.test(v)) return Number(v);
      if (/^[1-4]$/.test(v)) return Number(v) - 1;
      return options.findIndex((o) => o.toLowerCase() === v.toLowerCase());
    })
    .filter((i) => i >= 0 && i < options.length)
    .filter((i, n, a) => a.indexOf(i) === n);
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
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
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
    if (!file) {
      toast.error("Choose a CSV file.");
      return;
    }
    try {
      setBusy(true);
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) throw new Error("No worksheet found.");
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
        defval: "",
        raw: false,
      });
      if (!rows.length) throw new Error("The CSV is empty.");
      const parsed = rows
        .map((row) => {
          const record: Record<string, any> = {};
          Object.keys(row).forEach((k) => (record[cleanHeader(k)] = row[k]));
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
        .filter((q) => q.question_text);
      if (!parsed.length) throw new Error("No question rows were found.");
      setQuestions(parsed);
      setValidated(false);
      setErrors([]);
      setDuplicates(0);
      toast.success(`${parsed.length} questions loaded.`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Unable to read CSV");
    } finally {
      setBusy(false);
    }
  };
  const validate = async () => {
    try {
      setBusy(true);
      const r = await validateImportedQuestions(bankId, questions);
      const errs =
        r.errors ||
        (r.results || [])
          .filter((x: any) => x.status === "invalid")
          .map((x: any) => x.message);
      setErrors(errs);
      if (errs.length) {
        setValidated(false);
        toast.error(`${errs.length} validation error(s).`);
        return;
      }
      const d = await checkQuestionDuplicates(bankId, questions);
      const n = Number(d.duplicateCount || 0);
      setDuplicates(n);
      setValidated(true);
      toast.success(
        n
          ? `${n} duplicate(s) will be skipped.`
          : "CSV is valid and ready to import.",
      );
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Validation failed");
    } finally {
      setBusy(false);
    }
  };
  const importNow = async () => {
    if (!validated || errors.length) return;
    try {
      setBusy(true);
      const r = await finalImportQuestions(bankId, questions);
      setDone(r);
      toast.success(r.message || "Questions imported successfully.");
      onSuccess();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Import failed");
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
              CSV format is compatible with the downloadable template.
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
              <p className="font-semibold">Required columns</p>
              <p className="mt-1 font-mono text-xs leading-6">
                question_text, question_type, option_a, option_b, option_c,
                option_d, correct_answers
              </p>
              <p className="mt-1 text-xs text-slate-500">
                MCQ: one answer (A). Multiple Correct: two or more (A|C|D).
                True/False: True or False. Fill in the Blank: one correct option
                (A).
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
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }}
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
                              : "MCQ"}
                        </td>
                        <td className="p-3">{q.question_text}</td>
                        <td className="p-3">
                          {q.correct_answers
                            .map((i) => String.fromCharCode(65 + i))
                            .join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {questions.length > 100 && (
                  <p className="p-3 text-xs text-slate-500">
                    Showing first 100 of {questions.length} questions.
                  </p>
                )}
              </div>
            )}
            {errors.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="font-semibold">Validation errors</p>
                <ul className="mt-2 list-disc pl-5">
                  {errors.slice(0, 50).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {duplicates > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {duplicates} duplicate(s) found. They will be skipped
                automatically.
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={close}
                className="rounded-xl border px-5 py-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void validate()}
                disabled={!questions.length || busy}
                className="rounded-xl border px-5 py-3 font-semibold disabled:opacity-50"
              >
                Validate
              </button>
              <button
                type="button"
                onClick={() => void importNow()}
                disabled={!validated || !!errors.length || busy}
                className="rounded-xl bg-[#00629B] px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Working..." : "Import Questions"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
