import { useState } from "react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Copy,
  Download,
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
  question_type: "MCQ" | "MULTIPLE_CORRECT" | "TRUE_FALSE";
  options: string[];
  correct_answers: string[];
}


type ImportStep = "upload" | "preview" | "validation" | "summary";

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

  const handleUpload = async () => {
    if (!file) {
      toast.error("Choose a file");
      return;
    }

    try {
      setUploading(true);

      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
      });

      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        throw new Error("No worksheet found.");
      }

      const worksheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        defval: "",
      });

      if (!rows.length) {
        throw new Error("The uploaded file is empty.");
      }

      const questions: PreviewQuestion[] = rows.map((row) => {
        const rawType = String(row["Question Type"] || "MCQ").trim().toUpperCase().replace(/[ -]+/g, "_");
        const questionType: PreviewQuestion["question_type"] =
          ["TRUE_FALSE", "TRUEFALSE", "TRUE_OR_FALSE"].includes(rawType)
            ? "TRUE_FALSE"
            : ["MULTIPLE_CORRECT", "MULTIPLE_CHOICE", "MULTIPLE"].includes(rawType)
              ? "MULTIPLE_CORRECT"
              : "MCQ";
        const options = questionType === "TRUE_FALSE"
          ? ["True", "False"]
          : [row["Option A"], row["Option B"], row["Option C"], row["Option D"]]
              .map((value) => String(value || "").trim())
              .filter(Boolean);
        const correctAnswer = String(row["Correct Answer"] || "").trim();
        const correctAnswers = correctAnswer ? correctAnswer.split(/[|,;]/).map((answer: string) => answer.trim()) : [];
        return {
          question_text: String(row["Question"] || "").trim(),
          question_type: questionType,
          options,
          correct_answers: correctAnswers.map((answer: string) => {
            const normalized = answer.toUpperCase();
            if (questionType === "TRUE_FALSE") return normalized === "TRUE" ? 0 : normalized === "FALSE" ? 1 : -1;
            if (/^[A-D]$/.test(normalized)) return "ABCD".indexOf(normalized);
            if (/^[1-4]$/.test(normalized)) return Number(normalized) - 1;
            return -1;
          }).filter((index: number) => index >= 0),
        };
      });

      if (!questions.length) {
        throw new Error("No questions found in the file.");
      }

      setPreview(questions);

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
    try {
      const data = await validateImportedQuestions(bankId, preview);

      setValidation(data.results || data.errors || []);
      setStep("validation");

      toast.success("Validation completed");
    } catch (err) {
      console.error(err);
      toast.error("Validation failed");
    }
  };

  const handleDuplicateCheck = async () => {
    try {
      const data = await checkQuestionDuplicates(bankId, preview);

      setDuplicates(data.duplicates || []);
      setDuplicateChecked(true);

      toast.success("Duplicate check completed");
    } catch (err) {
      console.error(err);
      toast.error("Unable to detect duplicates");
    }
  };

  const handleImport = async () => {
    try {
      const data = await finalImportQuestions(bankId, preview);

      setSummary(data);
      setStep("summary");

      toast.success("Questions imported");

      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Import failed");
    }
  };

  const handleClose = () => {
    setStep("upload");
    setFile(null);
    setUploading(false);
    setPreview([]);
    setValidation([]);
    setDuplicates([]);
    setSummary(null);
    setDuplicateChecked(false);

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-6xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-2xl font-bold">Import Questions</h2>

            <p className="mt-1 text-gray-500">
              Import questions from CSV or Excel.
            </p>
          </div>

          <button
            onClick={handleClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={22} />
          </button>
        </div>
        <div className="flex items-center justify-center gap-8 border-b py-5">
          {["upload", "preview", "validation", "summary"].map((item, index) => {
            const active = item === step;

            return (
              <div key={item} className="flex items-center gap-2">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center
      ${active ? "bg-[#00629B] text-white" : "bg-gray-200 text-gray-600"}`}
                >
                  {index + 1}
                </div>

                <span className="capitalize font-medium">{item}</span>
              </div>
            );
          })}
        </div>
        <div className="p-8">
          {step === "upload" && (
            <div>
              <div className="rounded-2xl border-2 border-dashed p-16 text-center">
                <FileText size={60} className="mx-auto text-[#00629B]" />

                <h2 className="mt-6 text-2xl font-bold">
                  Select Questions File
                </h2>

                <p className="mt-2 text-gray-500">
                  Upload a CSV or Excel file containing your questions.
                </p>

                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="mt-8"
                  onChange={(e) => {
                    if (e.target.files) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
              </div>

              <div className="mt-8">
                <h3 className="font-semibold text-lg">Supported Columns</h3>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    "Question",
                    "Option A",
                    "Option B",
                    "Option C",
                    "Option D",
                    "Correct Answer",
                  ].map((column) => (
                    <div
                      key={column}
                      className="rounded-xl border p-3 text-center"
                    >
                      {column}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  className="rounded-xl border px-6 py-3"
                >
                  Cancel
                </button>

                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="rounded-xl bg-[#00629B] px-6 py-3 text-white"
                >
                  {uploading ? "Uploading..." : "Upload Questions"}
                </button>
              </div>
            </div>
          )}
          {step === "preview" && (
            <div>
              <h2 className="text-2xl font-bold">Preview Questions</h2>

              <p className="mt-2 text-gray-500">Review before validation.</p>

              <div className="mt-8 space-y-4 max-h-[450px] overflow-y-auto">
                {preview.map((question, index) => (
                  <div key={index} className="rounded-xl border p-5">
                    <h3 className="font-semibold">Question {index + 1}</h3>

                    <p className="mt-2">{question.question_text}</p>

                    <div className="mt-3 text-sm text-gray-500">MCQ · 4 options · 1 mark</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep("upload")}
                  className="rounded-xl border px-6 py-3"
                >
                  Back
                </button>

                <button
                  onClick={handleValidate}
                  className="rounded-xl bg-[#00629B] px-6 py-3 text-white"
                >
                  Validate Questions
                </button>
              </div>
            </div>
          )}
          {step === "validation" && (
            <div>
              <h2 className="text-2xl font-bold">Validation Results</h2>

              <p className="mt-2 text-gray-500">
                Review warnings and errors before importing.
              </p>

              <div className="mt-8 space-y-4 max-h-[450px] overflow-y-auto">
                {validation.length === 0 ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-green-700">
                    <CheckCircle className="mb-3" size={28} />
                    All questions passed validation.
                  </div>
                ) : (
                  validation.map((item, index) => (
                    <div
                      key={index}
                      className={`rounded-xl border p-5 ${
                        item.status === "valid"
                          ? "border-green-200 bg-green-50"
                          : "border-yellow-200 bg-yellow-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.status === "valid" ? (
                          <CheckCircle className="text-green-600" size={22} />
                        ) : (
                          <AlertTriangle
                            className="text-yellow-600"
                            size={22}
                          />
                        )}

                        <div>
                          <h3 className="font-semibold">{item.question}</h3>

                          <p className="text-sm text-gray-600">
                            {item.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep("preview")}
                  className="rounded-xl border px-6 py-3"
                >
                  Back
                </button>

                <button
                  onClick={handleDuplicateCheck}
                  className="rounded-xl bg-[#00629B] px-6 py-3 text-white"
                >
                  Find Duplicates
                </button>
              </div>
            </div>
          )}
          {step === "validation" && (
            <div className="mt-10">
              {duplicates.length > 0 && (
                <>
                  <h2 className="text-xl font-bold">Duplicate Detection</h2>

                  <div className="mt-5 space-y-4">
                    {duplicates.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-red-200 bg-red-50 p-5"
                      >
                        <div className="flex items-center gap-3">
                          <Copy className="text-red-600" size={22} />

                          <div>
                            <p className="font-semibold">{item.question}</p>

                            <p className="text-sm text-gray-600">
                              Similar to: {item.match}
                            </p>

                            <p className="mt-1 text-sm text-red-600">
                              Similarity: {item.similarity}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {duplicateChecked && duplicates.length === 0 && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-green-700">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={22} />
                    <div>
                      <p className="font-semibold">No duplicates detected.</p>
                      <p className="text-sm">
                        The questions are ready to be imported.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={handleImport}
                  className="rounded-xl bg-green-600 px-6 py-3 text-white"
                >
                  Import Questions
                </button>
              </div>
            </div>
          )}
          {step === "summary" && (
            <div>
              <div className="text-center">
                <CheckCircle className="mx-auto text-green-600" size={70} />

                <h2 className="mt-6 text-3xl font-bold">Import Completed</h2>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
                <div className="rounded-xl border p-5 text-center">
                  <p>Imported</p>

                  <h2 className="mt-2 text-3xl font-bold">
                    {summary?.imported ?? 0}
                  </h2>
                </div>

                <div className="rounded-xl border p-5 text-center">
                  <p>Duplicates</p>

                  <h2 className="mt-2 text-3xl font-bold">
                    {summary?.duplicates ?? 0}
                  </h2>
                </div>

                <div className="rounded-xl border p-5 text-center">
                  <p>Warnings</p>

                  <h2 className="mt-2 text-3xl font-bold">
                    {summary?.warnings ?? 0}
                  </h2>
                </div>

                <div className="rounded-xl border p-5 text-center">
                  <p>Errors</p>

                  <h2 className="mt-2 text-3xl font-bold">
                    {summary?.errors ?? 0}
                  </h2>
                </div>
              </div>

              <div className="mt-10 flex justify-center gap-4">
                <button className="rounded-xl border px-6 py-3 flex items-center gap-2">
                  <Download size={18} />
                  Download Error Report
                </button>

                <button
                  onClick={handleClose}
                  className="rounded-xl bg-[#00629B] px-6 py-3 text-white"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
