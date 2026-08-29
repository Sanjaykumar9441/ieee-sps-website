import { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import toast from "react-hot-toast";
import { FileText, CheckCircle, AlertTriangle, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

interface Props {
  open: boolean;
  assessmentId: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

interface ImportStudent {
  name: string;
  rollNo: string;
  email: string;
  department: string;
}

interface DuplicateRow extends ImportStudent {
  row: number;
  reason: string;
}

interface ErrorRow extends ImportStudent {
  row: number;
  reason: string;
}

type Step = "upload" | "preview" | "result";

export default function ImportStudentsModal({
  open,
  assessmentId,
  onClose,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>("upload");

  const [file, setFile] = useState<File | null>(null);

  const [students, setStudents] = useState<ImportStudent[]>([]);

  const [duplicates, setDuplicates] = useState<DuplicateRow[]>([]);

  const [errors, setErrors] = useState<ErrorRow[]>([]);

  const [imported, setImported] = useState(0);

  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep("upload");
    setFile(null);
    setStudents([]);
    setDuplicates([]);
    setErrors([]);
    setImported(0);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const normalizeKey = (value: any) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  const readFile = async (selectedFile: File) => {
    try {
      setLoading(true);

      const buffer = await selectedFile.arrayBuffer();

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

      const mapped: ImportStudent[] = rows.map((row) => ({
        name: String(row["Name"] ?? row["name"] ?? "").trim(),

        rollNo: String(
          row["Roll No"] ?? row["Roll Number"] ?? row["roll_no"] ?? "",
        ).trim(),

        email: String(row["Email"] ?? row["email"] ?? "")
          .trim()
          .toLowerCase(),

        department: String(row["Department"] ?? row["department"] ?? "").trim(),
      }));

      setStudents(mapped);
      setStep("preview");

      toast.success(`${mapped.length} rows loaded.`);
    } catch (err: any) {
      console.error(err);

      toast.error(err?.message || "Unable to read the file.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!students.length) {
      toast.error("No students to import.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const { data } = await axios.post(
        `${API}/api/student-auth/import`,
        {
          assessmentId,
          students,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setImported(data.imported || 0);

      setDuplicates(data.duplicateRows || []);

      setErrors(data.errorRows || []);

      setStep("result");

      if (data.imported > 0) {
        toast.success(`${data.imported} students imported.`);

        await onSuccess();
      } else {
        toast.error("No students were imported.");
      }
    } catch (err: any) {
      console.error("Student import error:", err);

      toast.error(err?.response?.data?.message || "Unable to import students.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}

        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold">Import Students</h2>

            <p className="mt-1 text-sm text-gray-500">
              Upload a CSV or Excel file to add students in bulk.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={22} />
          </button>
        </div>

        {/* STEPS */}

        <div className="flex items-center justify-center gap-8 border-b px-6 py-5">
          {[
            ["upload", "Upload"],
            ["preview", "Preview"],
            ["result", "Result"],
          ].map(([value, label], index) => {
            const active = step === value;

            return (
              <div key={value} className="flex items-center gap-2">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                    active
                      ? "bg-[#00629B] text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>

                <span className="font-medium">{label}</span>
              </div>
            );
          })}
        </div>

        {/* CONTENT */}

        <div className="max-h-[calc(90vh-150px)] overflow-y-auto p-8">
          {/* UPLOAD */}

          {step === "upload" && (
            <div>
              <div className="rounded-2xl border-2 border-dashed p-14 text-center">
                <FileText size={60} className="mx-auto text-[#00629B]" />

                <h3 className="mt-5 text-2xl font-bold">Upload Student CSV</h3>

                <p className="mt-2 text-gray-500">
                  CSV and Excel files are supported.
                </p>

                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="mx-auto mt-8 block"
                  onChange={(e) => {
                    const selected = e.target.files?.[0];

                    if (selected) {
                      setFile(selected);
                      readFile(selected);
                    }
                  }}
                />

                {file && (
                  <p className="mt-4 text-sm font-medium text-gray-600">
                    Selected: {file.name}
                  </p>
                )}
              </div>

              {/* FORMAT */}

              <div className="mt-8 rounded-2xl border p-6">
                <h3 className="text-lg font-bold">Required CSV Format</h3>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left">Name</th>

                        <th className="p-3 text-left">Roll No</th>

                        <th className="p-3 text-left">Email</th>

                        <th className="p-3 text-left">Department</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr className="border-t">
                        <td className="p-3">Sanjay Kumar</td>

                        <td className="p-3">24A81A0001</td>

                        <td className="p-3">sanjay@example.com</td>

                        <td className="p-3">ECE</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="mt-4 text-sm text-gray-500">
                  Name, Roll No and Email are required. Department may be left empty.
                </p>
              </div>
            </div>
          )}

          {/* PREVIEW */}

          {step === "preview" && (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Preview Students</h3>

                  <p className="mt-1 text-gray-500">
                    {students.length} rows found.
                  </p>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto rounded-2xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">#</th>

                      <th className="p-3 text-left">Name</th>

                      <th className="p-3 text-left">Roll No</th>

                      <th className="p-3 text-left">Email</th>

                      <th className="p-3 text-left">Department</th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map((student, index) => (
                      <tr
                        key={`${student.rollNo}-${index}`}
                        className="border-t"
                      >
                        <td className="p-3">{index + 1}</td>

                        <td className="p-3">{student.name || "—"}</td>

                        <td className="p-3">{student.rollNo || "—"}</td>

                        <td className="p-3">{student.email || "—"}</td>

                        <td className="p-3">{student.department || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep("upload")}
                  disabled={loading}
                  className="rounded-xl border px-6 py-3"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleImport}
                  disabled={loading}
                  className="rounded-xl bg-[#00629B] px-6 py-3 text-white disabled:opacity-50"
                >
                  {loading
                    ? "Importing..."
                    : `Import ${students.length} Students`}
                </button>
              </div>
            </div>
          )}

          {/* RESULT */}

          {step === "result" && (
            <div>
              <div className="text-center">
                <CheckCircle size={70} className="mx-auto text-green-600" />

                <h3 className="mt-5 text-3xl font-bold">Import Completed</h3>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="rounded-2xl border p-6 text-center">
                  <p className="text-gray-500">Imported</p>

                  <p className="mt-2 text-4xl font-bold text-green-600">
                    {imported}
                  </p>
                </div>

                <div className="rounded-2xl border p-6 text-center">
                  <p className="text-gray-500">Duplicates</p>

                  <p className="mt-2 text-4xl font-bold text-orange-500">
                    {duplicates.length}
                  </p>
                </div>

                <div className="rounded-2xl border p-6 text-center">
                  <p className="text-gray-500">Errors</p>

                  <p className="mt-2 text-4xl font-bold text-red-600">
                    {errors.length}
                  </p>
                </div>
              </div>

              {/* DUPLICATES */}

              {duplicates.length > 0 && (
                <div className="mt-8">
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    <AlertTriangle size={20} className="text-orange-500" />
                    Duplicate Rows
                  </h3>

                  <div className="mt-4 max-h-60 overflow-y-auto rounded-xl border">
                    {duplicates.map((item, index) => (
                      <div key={index} className="border-b p-4 last:border-b-0">
                        <p className="font-medium">
                          Row {item.row}: {item.name}
                        </p>

                        <p className="text-sm text-gray-500">
                          {item.rollNo} • {item.email}
                        </p>

                        <p className="mt-1 text-sm text-orange-600">
                          {item.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ERRORS */}

              {errors.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-red-600">
                    Invalid Rows
                  </h3>

                  <div className="mt-4 max-h-60 overflow-y-auto rounded-xl border">
                    {errors.map((item, index) => (
                      <div key={index} className="border-b p-4 last:border-b-0">
                        <p className="font-medium">
                          Row {item.row}: {item.name || "Unknown"}
                        </p>

                        <p className="mt-1 text-sm text-red-600">
                          {item.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl bg-[#00629B] px-6 py-3 text-white"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
