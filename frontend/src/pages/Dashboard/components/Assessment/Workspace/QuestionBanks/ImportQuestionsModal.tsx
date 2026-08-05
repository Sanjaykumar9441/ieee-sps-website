import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Copy,
  Download,
  X,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

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

  const handleUpload = async () => {
    if (!file) {
      toast.error("Choose a file");
      return;
    }

    try {
      setUploading(true);

      const token = localStorage.getItem("token");

      const formData = new FormData();

      formData.append("file", file);

      const { data } = await axios.post(
        `${API}/api/question-banks/${bankId}/import`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setPreview(data.questions || []);

      setStep("preview");

      toast.success("Upload successful");
    } catch (err) {
      console.error(err);

      toast.error("Import failed");
    } finally {
      setUploading(false);
    }
  };

  const handleValidate = async () => {
    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.post(
        `${API}/api/question-banks/${bankId}/validate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setValidation(data.results || []);

      setStep("validation");

      toast.success("Validation completed");
    } catch (err) {
      console.error(err);

      toast.error("Validation failed");
    }
  };

  const handleDuplicateCheck = async () => {
    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.post(
        `${API}/api/question-banks/${bankId}/duplicates`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setDuplicates(data.duplicates || []);

      toast.success("Duplicate check completed");
    } catch (err) {
      console.error(err);

      toast.error("Unable to detect duplicates");
    }
  };

  const handleImport = async () => {
    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.post(
        `${API}/api/question-banks/${bankId}/final-import`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setSummary(data);

      setStep("summary");

      toast.success("Questions imported");

      onSuccess();
      handleClose();
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

                <h2 className="mt-6 text-2xl font-bold">Drag CSV Here</h2>

                <p className="mt-2 text-gray-500">or choose a file below</p>

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
                    "Difficulty",
                    "Marks",
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
                  {uploading ? "Uploading..." : "Upload CSV"}
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

                    <div className="mt-3 flex gap-4 text-sm text-gray-500">
                      <span>{question.question_type}</span>

                      <span>{question.difficulty}</span>

                      <span>{question.marks} Marks</span>
                    </div>
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
          {duplicates.length > 0 && step === "validation" && (
            <div className="mt-10">
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

                        <p className="mt-1 text-red-600 text-sm">
                          Similarity: {item.similarity}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button
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
