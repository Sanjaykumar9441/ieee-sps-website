import { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle,
  Download,
  FileUp,
  X,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;
interface Props {
  open: boolean;
  assessmentId: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}
interface Student {
  name: string;
  rollNo: string;
  email: string;
  department: string;
}
interface RowError extends Student {
  row: number;
  reason: string;
}
const cleanHeader = (v: any) =>
  String(v ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
const aliases: Record<string, string[]> = {
  name: ["name", "student_name", "full_name"],
  rollNo: ["roll_no", "roll_number", "rollnumber", "roll_no_", "roll"],
  email: ["email", "email_id", "email_address"],
  department: ["department", "branch", "branch_name", "dept"],
};
const get = (row: Record<string, any>, key: string) => {
  for (const a of aliases[key] || [key])
    if (row[a] !== undefined) return String(row[a] ?? "").trim();
  return "";
};
const downloadTemplate = () => {
  const csv = [
    ["Name", "Roll No", "Email", "Department"],
    ["Sanjay Kumar", "24A81A0001", "sanjay@example.com", "ECE"],
  ]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "assessment-student-template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export default function ImportStudentsModal({
  open,
  assessmentId,
  onClose,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [duplicates, setDuplicates] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<any>(null);
  if (!open) return null;
  const reset = () => {
    setFile(null);
    setStudents([]);
    setErrors([]);
    setDuplicates(0);
    setBusy(false);
    setDone(null);
  };
  const close = () => {
    reset();
    onClose();
  };
  const read = async () => {
    if (!file) {
      toast.error("Choose a CSV or Excel file.");
      return;
    }
    try {
      setBusy(true);
      const wb = XLSX.read(await file.arrayBuffer(), {
        type: "array",
        raw: false,
      });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) throw new Error("No worksheet found.");
      const raw = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
        defval: "",
        raw: false,
      });
      if (!raw.length) throw new Error("The file is empty.");
      const parsed: Student[] = raw.map((row) => {
        const r: Record<string, any> = {};
        Object.keys(row).forEach((k) => (r[cleanHeader(k)] = row[k]));
        return {
          name: get(r, "name"),
          rollNo: get(r, "rollNo"),
          email: get(r, "email").toLowerCase(),
          department: get(r, "department"),
        };
      });
      const rowErrors: RowError[] = [];
      const seenRoll = new Set<string>(),
        seenEmail = new Set<string>();
      parsed.forEach((s, i) => {
        const reasons: string[] = [];
        if (!s.name) reasons.push("Name is required");
        if (!s.rollNo) reasons.push("Roll No is required");
        if (!s.email) reasons.push("Email is required");
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email))
          reasons.push("Invalid email");
        const rk = s.rollNo.toLowerCase(),
          ek = s.email.toLowerCase();
        if (rk && seenRoll.has(rk)) reasons.push("Duplicate Roll No in file");
        if (ek && seenEmail.has(ek)) reasons.push("Duplicate Email in file");
        if (rk) seenRoll.add(rk);
        if (ek) seenEmail.add(ek);
        if (reasons.length)
          rowErrors.push({ ...s, row: i + 2, reason: reasons.join("; ") });
      });
      setStudents(parsed);
      setErrors(rowErrors);
      setDuplicates(
        rowErrors.filter((e) => e.reason.toLowerCase().includes("duplicate"))
          .length,
      );
      toast.success(`${parsed.length} student row(s) loaded.`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Unable to read file");
    } finally {
      setBusy(false);
    }
  };
  const importNow = async () => {
    const valid = students.filter(
      (s) =>
        s.name &&
        s.rollNo &&
        s.email &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email),
    );
    if (!valid.length) {
      toast.error("No valid student rows to import.");
      return;
    }
    try {
      setBusy(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${API}/api/student-auth/import`,
        { assessmentId, students: valid },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setDone(data);
      if (Number(data.imported || 0) > 0) {
        toast.success(`${data.imported} students imported.`);
        await onSuccess();
      } else toast.error(data.message || "No students were imported.");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Unable to import students.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-bold">Import Students</h2>
            <p className="mt-1 text-sm text-slate-500">
              CSV or Excel. Name, Roll No and Email are required; Department is
              optional.
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
              Imported {done.imported ?? 0} student(s). Duplicates:{" "}
              {done.duplicates ?? 0}. Errors:{" "}
              {done.errors ?? done.errorRows?.length ?? 0}.
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
              <p className="font-semibold">Required CSV columns</p>
              <p className="mt-1 font-mono text-xs">
                Name, Roll No, Email, Department
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Department can be empty. The importer also accepts snake_case
                headers such as roll_no.
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
            {students.length > 0 && (
              <div className="overflow-x-auto rounded-xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">#</th>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Roll No</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.slice(0, 100).map((s, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-3">{i + 1}</td>
                        <td className="p-3">{s.name || "—"}</td>
                        <td className="p-3">{s.rollNo || "—"}</td>
                        <td className="p-3">{s.email || "—"}</td>
                        <td className="p-3">{s.department || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length > 100 && (
                  <p className="p-3 text-xs text-slate-500">
                    Showing first 100 of {students.length}.
                  </p>
                )}
              </div>
            )}
            {errors.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle size={17} />
                  Invalid rows: {errors.length}
                </div>
                <ul className="mt-2 list-disc pl-5">
                  {errors.slice(0, 50).map((e, i) => (
                    <li key={i}>
                      Row {e.row}: {e.reason}
                    </li>
                  ))}
                </ul>
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
                onClick={() => void importNow()}
                disabled={!students.length || busy}
                className="rounded-xl bg-[#00629B] px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                {busy
                  ? "Importing..."
                  : `Import ${students.length - errors.length} Valid Students`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
