import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  UploadCloud,
  X,
} from "lucide-react";
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

interface PreviewQuestion {
  question_text: string;
  question_type: string;
  difficulty: string;
  marks: number;
  negative_marks?: number;
  options?: string[];
  correct_answers?: string[];
  explanation?: string;
}

type ImportStep = "upload" | "preview" | "validation" | "summary";

const STEPS: { id: ImportStep; label: string; helper: string }[] = [
  { id: "upload", label: "Upload", helper: "Choose file" },
  { id: "preview", label: "Preview", helper: "Review questions" },
  { id: "validation", label: "Validate", helper: "Check errors" },
  { id: "summary", label: "Complete", helper: "Import finished" },
];

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

function normalizeQuestionType(value: unknown) {
  const raw = String(value || "MCQ")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (
    ["MULTIPLE_CHOICE", "MULTIPLE_CHOICE_QUESTION", "MULTIPLE"].includes(raw)
  ) {
    return "MULTIPLE_CORRECT";
  }
  if (["TRUEFALSE", "TRUE_OR_FALSE", "TRUE_FALSE_QUESTION"].includes(raw)) {
    return "TRUE_FALSE";
  }
  if (
    [
      "FILL_BLANK",
      "FILL_IN_BLANK",
      "FILL_IN_THE_BLANK",
      "FILLINTHEBLANK",
    ].includes(raw)
  ) {
    return "FILL_IN_THE_BLANK";
  }
  return raw;
}

function getValidationStatus(item: any) {
  const status = String(item?.status || item?.type || "").toLowerCase();
  return status === "valid" || status === "success" || status === "ok";
}

function getValidationErrorCount(items: any[]) {
  return items.filter((item) => !getValidationStatus(item)).length;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImportQuestionsModal({
  open,
  bankId,
  onClose,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<PreviewQuestion[]>([]);
  const [validation, setValidation] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [duplicateChecked, setDuplicateChecked] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPreview, setSelectedPreview] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validationErrors = useMemo(
    () => getValidationErrorCount(validation),
    [validation],
  );

  const filteredPreview = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return preview;
    return preview.filter(
      (question) =>
        question.question_text.toLowerCase().includes(query) ||
        question.question_type.toLowerCase().includes(query),
    );
  }, [preview, search]);

  const reset = () => {
    setStep("upload");
    setFile(null);
    setUploading(false);
    setPreview([]);
    setValidation([]);
    setDuplicates([]);
    setSummary(null);
    setDuplicateChecked(false);
    setDragActive(false);
    setSearch("");
    setSelectedPreview(0);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const readFile = async (selectedFile: File) => {
    const extension = selectedFile.name
      .slice(selectedFile.name.lastIndexOf("."))
      .toLowerCase();

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      toast.error("Please upload a CSV, XLS, or XLSX file.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 10 MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Choose a CSV or Excel file first.");
      return;
    }

    try {
      setUploading(true);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) throw new Error("No worksheet found.");

      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        defval: "",
      });

      if (!rows.length) throw new Error("The uploaded file is empty.");

      const questions: PreviewQuestion[] = rows.map((row) => {
        const questionType = normalizeQuestionType(row["Question Type"]);
        const isFillInTheBlank = questionType === "FILL_IN_THE_BLANK";

        const options = isFillInTheBlank
          ? []
          : [row["Option A"], row["Option B"], row["Option C"], row["Option D"]]
              .map((value) => String(value || "").trim())
              .filter(Boolean);

        const correctAnswer = String(
          row["Correct Answer"] ?? row["Accepted Answers"] ?? "",
        ).trim();

        return {
          question_text: String(row["Question"] || "").trim(),
          question_type: questionType,
          difficulty: String(row["Difficulty"] || "MEDIUM")
            .trim()
            .toUpperCase(),
          marks: Number(row["Marks"] || 1),
          negative_marks: Number(row["Negative Marks"] || 0),
          options,
          correct_answers: correctAnswer
            ? correctAnswer
                .split(isFillInTheBlank ? "|" : ",")
                .map((answer: string) =>
                  isFillInTheBlank
                    ? answer
                        .normalize("NFKC")
                        .trim()
                        .replace(/\s+/g, " ")
                        .toUpperCase()
                    : answer.trim(),
                )
                .filter(Boolean)
            : [],
          explanation: String(row["Explanation"] || "").trim() || undefined,
        };
      });

      setPreview(questions);
      setSelectedPreview(0);
      setSearch("");
      setStep("preview");
      toast.success(`${questions.length} questions loaded`);
    } catch (err) {
      console.error("Question file parsing error:", err);
      toast.error(
        err instanceof Error ? err.message : "Unable to read question file",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleValidate = async () => {
    if (!preview.length) return;

    try {
      setUploading(true);
      const data = await validateImportedQuestions(bankId, preview);
      setValidation(data.results || data.errors || []);
      setStep("validation");
      toast.success("Validation completed");
    } catch (err) {
      console.error(err);
      toast.error("Validation failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDuplicateCheck = async () => {
    try {
      setUploading(true);
      const data = await checkQuestionDuplicates(bankId, preview);
      setDuplicates(data.duplicates || []);
      setDuplicateChecked(true);
      toast.success("Duplicate check completed");
    } catch (err) {
      console.error(err);
      toast.error("Unable to detect duplicates");
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    try {
      setUploading(true);
      const data = await finalImportQuestions(bankId, preview);
      setSummary(data);
      setStep("summary");
      toast.success("Questions imported successfully");
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Import failed");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const rows = [
      {
        Question: "What is a multiplexer?",
        "Question Type": "MCQ",
        "Option A": "MUX",
        "Option B": "Encoder",
        "Option C": "Decoder",
        "Option D": "Register",
        "Correct Answer": "A",
        Explanation: "A multiplexer selects one input from multiple inputs.",
        Difficulty: "MEDIUM",
        Marks: 1,
        "Negative Marks": 0,
      },
      {
        Question: "Which are programming languages?",
        "Question Type": "MULTIPLE_CORRECT",
        "Option A": "C",
        "Option B": "Python",
        "Option C": "HTML",
        "Option D": "JavaScript",
        "Correct Answer": "A,B,D",
        Explanation: "C, Python and JavaScript are programming languages.",
        Difficulty: "MEDIUM",
        Marks: 1,
        "Negative Marks": 0,
      },
      {
        Question: "The Earth is the third planet from the Sun.",
        "Question Type": "TRUE_FALSE",
        "Option A": "True",
        "Option B": "False",
        "Option C": "",
        "Option D": "",
        "Correct Answer": "TRUE",
        Explanation: "Earth is the third planet from the Sun.",
        Difficulty: "MEDIUM",
        Marks: 1,
        "Negative Marks": 0,
      },
      {
        Question: "The SI unit of frequency is ___",
        "Question Type": "FILL_IN_THE_BLANK",
        "Option A": "",
        "Option B": "",
        "Option C": "",
        "Option D": "",
        "Correct Answer": "HERTZ | HZ",
        Explanation: "Frequency is measured in hertz.",
        Difficulty: "MEDIUM",
        Marks: 1,
        "Negative Marks": 0,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
    XLSX.writeFile(workbook, "question-import-template.csv", {
      bookType: "csv",
    });
    toast.success("CSV template downloaded");
  };

  if (!open) return null;

  const currentQuestion =
    filteredPreview[
      Math.min(selectedPreview, Math.max(filteredPreview.length - 1, 0))
    ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-5 md:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#00629B]/10 text-[#00629B]">
              <FileSpreadsheet size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900">
                Import Questions
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Upload, review and safely add questions to this question bank.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <X size={21} />
          </button>
        </header>

        {/* Stepper */}
        <div className="shrink-0 border-b border-slate-200 bg-slate-50/80 px-5 py-4 md:px-8">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            {STEPS.map((item, index) => {
              const active = item.id === step;
              const completed =
                STEPS.findIndex((entry) => entry.id === step) > index;

              return (
                <div key={item.id} className="flex min-w-0 flex-1 items-center">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition ${
                        active
                          ? "border-[#00629B] bg-[#00629B] text-white shadow-sm"
                          : completed
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-300 bg-white text-slate-500"
                      }`}
                    >
                      {completed ? <Check size={17} /> : index + 1}
                    </div>
                    <div className="hidden min-w-0 sm:block">
                      <p
                        className={`truncate text-sm font-semibold ${
                          active ? "text-slate-900" : "text-slate-600"
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        {item.helper}
                      </p>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`mx-3 h-px flex-1 ${
                        completed ? "bg-emerald-400" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {step === "upload" && (
            <div className="mx-auto max-w-5xl p-6 md:p-8">
              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <InfoCard
                  icon={<FileText size={18} />}
                  title="Supported files"
                  value="CSV, XLS, XLSX"
                />
                <InfoCard
                  icon={<UploadCloud size={18} />}
                  title="Maximum size"
                  value="10 MB per file"
                />
                <InfoCard
                  icon={<CheckCircle2 size={18} />}
                  title="Safe workflow"
                  value="Preview → Validate → Import"
                />
              </div>

              <div
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                  const dropped = event.dataTransfer.files?.[0];
                  if (dropped) void readFile(dropped);
                }}
                className={`rounded-3xl border-2 border-dashed p-8 text-center transition md:p-12 ${
                  dragActive
                    ? "border-[#00629B] bg-blue-50"
                    : "border-slate-300 bg-slate-50/60 hover:border-slate-400 hover:bg-slate-50"
                }`}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#00629B] shadow-sm ring-1 ring-slate-200">
                  <UploadCloud size={31} />
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-900">
                  Drop your question file here
                </h3>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Or choose a file from your computer. The file is read locally
                  first so you can review the questions before anything is
                  imported.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#00629B] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00527f]"
                  >
                    <UploadCloud size={18} />
                    Choose File
                  </button>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Download size={18} />
                    Download Template
                  </button>
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(event) => {
                    const selected = event.target.files?.[0];
                    if (selected) void readFile(selected);
                    event.target.value = "";
                  }}
                />
              </div>

              {file && (
                <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#00629B] ring-1 ring-blue-100">
                      <FileSpreadsheet size={21} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {file.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-red-600"
                    title="Remove file"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-[#00629B]">
                    <Info size={19} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      File format
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Use the downloaded template for the exact column names.
                      For Multiple Correct, separate answers with commas
                      (A,B,D). For Fill in the Blank, separate accepted answers
                      with a vertical bar (HERTZ | HZ).
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    "Question",
                    "Question Type",
                    "Option A–D",
                    "Correct Answer",
                    "Explanation",
                    "Difficulty",
                    "Marks",
                    "Negative Marks",
                  ].map((column) => (
                    <div
                      key={column}
                      className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-600"
                    >
                      {column}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="p-6 md:p-8">
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900">
                      Review imported questions
                    </h3>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#00629B]">
                      {preview.length} questions
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Nothing is imported yet. Check the parsed content before
                    validation.
                  </p>
                </div>

                <div className="relative w-full md:w-80">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search questions..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#00629B] focus:ring-2 focus:ring-[#00629B]/10"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="max-h-[500px] overflow-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                        <th className="w-14 px-4 py-3 font-semibold">#</th>
                        <th className="px-4 py-3 font-semibold">Question</th>
                        <th className="w-44 px-4 py-3 font-semibold">Type</th>
                        <th className="w-28 px-4 py-3 font-semibold">
                          Difficulty
                        </th>
                        <th className="w-24 px-4 py-3 font-semibold">Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPreview.map((question, index) => (
                        <tr
                          key={`${question.question_text}-${index}`}
                          onClick={() => setSelectedPreview(index)}
                          className={`cursor-pointer border-b border-slate-100 transition last:border-0 ${
                            selectedPreview === index
                              ? "bg-blue-50/70"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-4 py-4 text-sm font-semibold text-slate-400">
                            {index + 1}
                          </td>
                          <td className="max-w-xl px-4 py-4">
                            <p className="line-clamp-2 text-sm font-medium text-slate-800">
                              {question.question_text || "Untitled question"}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <Badge>{question.question_type}</Badge>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-medium text-slate-600">
                              {question.difficulty}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                            {question.marks}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {!filteredPreview.length && (
                    <div className="p-10 text-center text-sm text-slate-500">
                      No questions match your search.
                    </div>
                  )}
                </div>
              </div>

              {currentQuestion && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{currentQuestion.question_type}</Badge>
                      <Badge>{currentQuestion.difficulty}</Badge>
                      <span className="text-xs font-semibold text-slate-500">
                        {currentQuestion.marks} mark
                        {currentQuestion.marks === 1 ? "" : "s"}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                      Selected question
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-900">
                    {currentQuestion.question_text}
                  </p>
                  {currentQuestion.options?.length ? (
                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {currentQuestion.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
                        >
                          <span className="mr-2 font-bold text-[#00629B]">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          {option}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
                      Accepted answers:{" "}
                      <span className="font-semibold">
                        {currentQuestion.correct_answers?.join(" · ") || "None"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === "validation" && (
            <div className="p-6 md:p-8">
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Validation results
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Fix every invalid row before importing.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatPill label="Questions" value={preview.length} neutral />
                  <StatPill
                    label="Valid"
                    value={Math.max(preview.length - validationErrors, 0)}
                    success
                  />
                  <StatPill
                    label="Issues"
                    value={validationErrors}
                    danger={validationErrors > 0}
                  />
                </div>
              </div>

              {validation.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle2
                      className="mt-0.5 text-emerald-600"
                      size={26}
                    />
                    <div>
                      <h4 className="font-bold text-emerald-900">
                        All questions passed validation
                      </h4>
                      <p className="mt-1 text-sm leading-6 text-emerald-700">
                        No validation issues were returned. You can continue to
                        duplicate checking.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="max-h-[500px] overflow-y-auto">
                    {validation.map((item, index) => {
                      const valid = getValidationStatus(item);
                      return (
                        <div
                          key={index}
                          className={`flex gap-4 border-b p-5 last:border-0 ${
                            valid ? "bg-white" : "bg-red-50/50"
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {valid ? (
                              <CheckCircle2
                                className="text-emerald-600"
                                size={21}
                              />
                            ) : (
                              <AlertCircle className="text-red-600" size={21} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">
                                {item.question || `Question ${index + 1}`}
                              </p>
                              <Badge tone={valid ? "green" : "red"}>
                                {valid ? "Valid" : "Needs attention"}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {item.message ||
                                item.error ||
                                item.reason ||
                                "No additional details provided."}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "summary" && (
            <div className="mx-auto max-w-3xl p-8 text-center md:p-12">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="mt-6 text-2xl font-bold text-slate-900">
                Questions imported successfully
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                The question bank has been updated. You can close this window
                and continue managing the question bank.
              </p>

              <div className="mx-auto mt-7 grid max-w-lg grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Submitted
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {preview.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-medium text-emerald-700">Result</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-800">
                    {summary?.imported ??
                      summary?.importedCount ??
                      preview.length}
                  </p>
                </div>
              </div>

              {duplicates.length > 0 && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
                  <div className="flex gap-3">
                    <AlertTriangle
                      className="mt-0.5 shrink-0 text-amber-600"
                      size={20}
                    />
                    <div>
                      <p className="text-sm font-bold text-amber-900">
                        {duplicates.length} duplicate match
                        {duplicates.length === 1 ? "" : "es"} detected
                      </p>
                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        Review the duplicate results in the question bank if you
                        need to remove or edit existing questions.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex shrink-0 flex-col-reverse justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4 md:flex-row md:items-center md:px-8">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {step === "summary" ? "Close" : "Cancel"}
          </button>

          <div className="flex flex-wrap justify-end gap-2">
            {step === "preview" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreview([]);
                    setStep("upload");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft size={17} />
                  Choose another file
                </button>
                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={uploading || !preview.length}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00629B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#00527f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" size={17} />
                  ) : (
                    <Check size={17} />
                  )}
                  Validate Questions
                  <ArrowRight size={17} />
                </button>
              </>
            )}

            {step === "validation" && (
              <>
                <button
                  type="button"
                  onClick={() => setStep("preview")}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft size={17} />
                  Back to Preview
                </button>
                <button
                  type="button"
                  onClick={handleDuplicateCheck}
                  disabled={uploading || validationErrors > 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#00629B] bg-white px-5 py-2.5 text-sm font-semibold text-[#00629B] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" size={17} />
                  ) : (
                    <RefreshCw size={17} />
                  )}
                  Check Duplicates
                </button>
                {duplicateChecked && (
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={uploading || validationErrors > 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#00629B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#00527f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="animate-spin" size={17} />
                    ) : (
                      <Check size={17} />
                    )}
                    Import Questions
                  </button>
                )}
              </>
            )}

            {step === "summary" && (
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-2 rounded-xl bg-[#00629B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#00527f]"
              >
                Done
                <Check size={17} />
              </button>
            )}

            {step === "upload" && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || !file}
                className="inline-flex items-center gap-2 rounded-xl bg-[#00629B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#00527f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <UploadCloud size={17} />
                )}
                {uploading ? "Reading file..." : "Upload & Continue"}
                <ArrowRight size={17} />
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-[#00629B]">
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {title}
          </p>
          <p className="mt-0.5 text-sm font-bold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "red";
}) {
  const classes = {
    blue: "bg-blue-50 text-[#00629B]",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${classes[tone]}`}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

function StatPill({
  label,
  value,
  neutral,
  success,
  danger,
}: {
  label: string;
  value: number;
  neutral?: boolean;
  success?: boolean;
  danger?: boolean;
}) {
  const classes = danger
    ? "border-red-200 bg-red-50 text-red-700"
    : success
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : neutral
        ? "border-slate-200 bg-slate-50 text-slate-700"
        : "border-slate-200 bg-white text-slate-700";

  return (
    <div className={`rounded-xl border px-3 py-2 ${classes}`}>
      <span className="text-[11px] font-medium">{label}</span>
      <span className="ml-1.5 text-sm font-bold">{value}</span>
    </div>
  );
}
