import { useState } from "react";
import axios from "axios";
import {
  Award,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

interface Props {
  cardStyle: React.CSSProperties;
}

export default function CertificatesTab({ cardStyle }: Props) {
  const [eventCode, setEventCode] = useState("");
  const [certificateType, setCertificateType] = useState("PARTICIPATION");
  const [eventDate, setEventDate] = useState("13-08-2026");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleImport = async () => {
    if (!file) {
      setError("Please select an Excel file.");
      return;
    }

    if (!eventCode.trim()) {
      setError("Please enter an event code.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const token = localStorage.getItem("token");

      const formData = new FormData();

      formData.append("file", file);
      formData.append("eventCode", eventCode.trim().toUpperCase());
      formData.append("certificateType", certificateType);
      formData.append("defaultEventDate", eventDate);

      const response = await axios.post(
        `${API}/api/certificates/import`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setResult(response.data);
      setFile(null);

      const input = document.getElementById(
        "certificate-excel",
      ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Certificate import failed. Please check the Excel file.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, #7C6FEF 0%, #5E52D9 100%)",
            }}
          >
            <Award className="text-white" size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-semibold">
              Certificate Management
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Import student details and generate certificates.
            </p>
          </div>
        </div>
      </div>

      {/* IMPORT CARD */}
      <div className="p-6" style={cardStyle}>
        <div className="flex items-center gap-2 mb-5">
          <FileSpreadsheet size={20} />
          <h2 className="text-lg font-semibold">
            Import Certificate Data
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* EVENT CODE */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Event Code
            </label>

            <input
              type="text"
              value={eventCode}
              onChange={(e) => setEventCode(e.target.value.toUpperCase())}
              placeholder="NSD2026"
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-300"
            />

            <p className="text-xs text-gray-500 mt-1">
              Example: NSD2026
            </p>
          </div>

          {/* CERTIFICATE TYPE */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Certificate Type
            </label>

            <select
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 outline-none"
            >
              <option value="PARTICIPATION">
                Participation
              </option>

              <option value="MERIT">
                Merit
              </option>

              <option value="VOLUNTEER">
                Volunteer
              </option>
            </select>
          </div>

          {/* DATE */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Certificate Date
            </label>

            <input
              type="text"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              placeholder="13-08-2026"
              className="w-full border rounded-xl px-4 py-3 outline-none"
            />
          </div>
        </div>

        {/* EXCEL */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-2">
            Excel File
          </label>

          <div className="border-2 border-dashed rounded-xl p-6">
            <input
              id="certificate-excel"
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) =>
                setFile(e.target.files?.[0] || null)
              }
              className="block w-full text-sm"
            />

            {file && (
              <p className="text-sm text-gray-600 mt-3">
                Selected: <strong>{file.name}</strong>
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Required columns: Name, RollNo, Branch, College, City, Date
          </p>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleImport}
          disabled={loading}
          className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-medium disabled:opacity-50"
          style={{
            background:
              "linear-gradient(135deg, #7C6FEF 0%, #5E52D9 100%)",
          }}
        >
          <Upload size={18} />

          {loading
            ? "Importing..."
            : "Import Certificate Data"}
        </button>

        {/* ERROR */}
        {error && (
          <div className="mt-5 flex items-start gap-3 p-4 rounded-xl bg-red-50 text-red-700">
            <AlertCircle size={20} />

            <div>
              <p className="font-medium">Import Failed</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {result && (
          <div className="mt-5 p-4 rounded-xl bg-green-50 text-green-700">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />

              <p className="font-semibold">
                Certificate data imported successfully.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
              <div>
                <p className="text-gray-500">Imported</p>
                <p className="text-xl font-semibold">
                  {result.imported ?? 0}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Skipped</p>
                <p className="text-xl font-semibold">
                  {result.skipped ?? 0}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Total Rows</p>
                <p className="text-xl font-semibold">
                  {result.totalRows ?? 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EXCEL FORMAT */}
      <div className="p-6" style={cardStyle}>
        <h2 className="text-lg font-semibold mb-4">
          Excel Format
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">RollNo</th>
                <th className="text-left p-3">Branch</th>
                <th className="text-left p-3">College</th>
                <th className="text-left p-3">City</th>
                <th className="text-left p-3">Date</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="p-3">Ch. Sanjay Kumar</td>
                <td className="p-3">23A91A0001</td>
                <td className="p-3">ECE</td>
                <td className="p-3">Aditya University</td>
                <td className="p-3">Surampalem</td>
                <td className="p-3">13-08-2026</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}