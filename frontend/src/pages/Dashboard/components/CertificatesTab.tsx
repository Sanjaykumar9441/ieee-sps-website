import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Award,
  Download,
  Edit,
  FileSpreadsheet,
  Search,
  Upload,
  X,
  Save,
} from "lucide-react";

const API = "https://ieee-sps-website.onrender.com";

interface Certificate {
  _id: string;
  certificateId: string;
  eventCode: string;
  certificateType: string;
  name: string;
  rollNo: string;
  branch: string;
  college: string;
  city: string;
  eventDate: string;
  teamName?: string;
  place?: string;
  event?: string;
  downloadCount?: number;
  lastDownloadedAt?: string;
}

export default function CertificatesTab() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [certificateType, setCertificateType] = useState("PARTICIPATION");

  const [file, setFile] = useState<File | null>(null);

  const [eventCode, setEventCode] = useState("NSD2026");
  const [defaultEventDate, setDefaultEventDate] = useState("13-08-2026");

  const [importing, setImporting] = useState(false);

  const [importResult, setImportResult] = useState<any>(null);

  const [editing, setEditing] = useState<Certificate | null>(null);

  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  const fetchCertificates = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${API}/api/certificates/admin`, {
        params: {
          eventCode,
          certificateType,
          search,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCertificates(response.data.certificates || []);
    } catch (error) {
      console.error("Certificate fetch error:", error);
      alert("Unable to load certificates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [eventCode, certificateType]);

  const filteredCertificates = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return certificates;

    return certificates.filter((certificate) =>
      [
        certificate.name,
        certificate.rollNo,
        certificate.certificateId,
        certificate.college,
        certificate.teamName,
        certificate.place,
        certificate.event,
      ]
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [certificates, search]);

  const handleImport = async () => {
    if (!file) {
      alert("Please select an Excel file.");
      return;
    }

    if (!eventCode.trim()) {
      alert("Event code is required.");
      return;
    }

    try {
      setImporting(true);
      setImportResult(null);

      const formData = new FormData();

      formData.append("file", file);
      formData.append("eventCode", eventCode.trim());
      formData.append("certificateType", certificateType);

      // Participation uses the selected/default date.
      // Team Merit has the fixed date printed on the certificate template.
      if (certificateType === "PARTICIPATION") {
        formData.append("defaultEventDate", defaultEventDate);
      }

      const response = await axios.post(
        `${API}/api/certificates/import`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setImportResult(response.data);

      setFile(null);

      await fetchCertificates();
    } catch (error: any) {
      console.error("Certificate import error:", error);

      alert(error?.response?.data?.message || "Certificate import failed.");
    } finally {
      setImporting(false);
    }
  };

  const handleDownload = async (certificate: Certificate) => {
    try {
      const response = await axios.get(
        `${API}/api/certificates/download/${encodeURIComponent(
          certificate.rollNo,
        )}`,
        {
          params: {
            eventCode: certificate.eventCode,
            certificateType: certificate.certificateType,
          },
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `${certificate.certificateId}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Certificate download error:", error);

      alert("Unable to download certificate.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;

    try {
      setSaving(true);

      const payload =
        certificateType === "MERIT"
          ? {
              name: editing.name,
              rollNo: editing.rollNo,
              teamName: editing.teamName,
              college: editing.college,
              place: editing.place,
              event: editing.event,
            }
          : {
              name: editing.name,
              rollNo: editing.rollNo,
              branch: editing.branch,
              college: editing.college,
              city: editing.city,
              eventDate: editing.eventDate,
            };

      await axios.put(
        `${API}/api/certificates/admin/${editing.certificateId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setEditing(null);

      await fetchCertificates();

      alert("Certificate details updated successfully.");
    } catch (error: any) {
      console.error("Certificate update error:", error);

      alert(error?.response?.data?.message || "Failed to update certificate.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-3">
          <Award size={28} className="text-[#6C5FE0]" />

          <h1 className="text-2xl font-bold">Certificates</h1>
        </div>

        <p className="mt-2 text-gray-500">
          Import and manage event certificate data.
        </p>
      </div>

      {/* IMPORT */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <FileSpreadsheet className="text-[#6C5FE0]" />

          <div>
            <h2 className="text-xl font-bold">Import Certificate Data</h2>

            <p className="text-sm text-gray-500">
              Upload the Excel file containing certificate recipients.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {/* EVENT CODE */}
          <div>
            <label className="mb-2 block text-sm font-medium">Event Code</label>

            <input
              value={eventCode}
              onChange={(e) => setEventCode(e.target.value.toUpperCase())}
              placeholder="NSD2026"
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#6C5FE0]"
            />
          </div>

          {/* CERTIFICATE TYPE */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Certificate Type
            </label>

            <select
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 outline-none"
            >
              <option value="PARTICIPATION">Participation</option>

              <option value="MERIT">Team Merit</option>

              <option value="VOLUNTEER">Volunteer</option>
            </select>
          </div>

          {/* DATE — PARTICIPATION ONLY */}
          {certificateType === "PARTICIPATION" ? (
            <div>
              <label className="mb-2 block text-sm font-medium">
                Default Event Date
              </label>

              <input
                value={defaultEventDate}
                onChange={(e) => setDefaultEventDate(e.target.value)}
                placeholder="13-08-2026"
                className="w-full rounded-xl border px-4 py-3 outline-none"
              />
            </div>
          ) : (
            <div className="flex items-end">
              <div className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-600">
                Certificate date: <strong>13th August, 2026</strong>
              </div>
            </div>
          )}
        </div>

        {/* FILE */}
        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium">Excel File</label>

          <div className="rounded-xl border-2 border-dashed p-5">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full"
            />

            {file && (
              <p className="mt-3 text-sm text-gray-600">
                Selected: <strong>{file.name}</strong>
              </p>
            )}
          </div>

          <p className="mt-2 text-xs text-gray-500">
            {certificateType === "MERIT"
              ? "Required columns: Name, RollNo, TeamName, College, Place, Event"
              : "Required columns: Name, RollNo, Branch, College, City, Date"}
          </p>
        </div>

        <button
          onClick={handleImport}
          disabled={importing}
          className="mt-5 flex items-center gap-2 rounded-xl bg-[#6C5FE0] px-5 py-3 font-semibold text-white transition hover:bg-[#594BD0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Upload size={18} />

          {importing ? "Importing..." : "Import Certificate Data"}
        </button>

        {importResult && (
          <div className="mt-5 rounded-xl bg-green-50 p-5 text-green-700">
            <p className="font-semibold">
              Certificate data imported successfully.
            </p>

            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Imported</p>
                <p className="text-xl font-bold">
                  {importResult.imported || 0}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Skipped</p>
                <p className="text-xl font-bold">{importResult.skipped || 0}</p>
              </div>

              <div>
                <p className="text-gray-500">Total Rows</p>
                <p className="text-xl font-bold">
                  {importResult.totalRows || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CERTIFICATE TABLE */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold">Certificate Records</h2>

              <p className="text-sm text-gray-500">
                {filteredCertificates.length} records
              </p>
            </div>

            <div className="relative w-full lg:w-96">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, roll no, team, event or certificate ID"
                className="w-full rounded-xl border py-3 pl-10 pr-4 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-gray-500">
              Loading certificates...
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              No certificate records found.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">Roll No</th>

                  {certificateType === "MERIT" ? (
                    <>
                      <th className="p-4 text-left">Team</th>
                      <th className="p-4 text-left">College</th>
                      <th className="p-4 text-left">Place</th>
                      <th className="p-4 text-left">Event</th>
                    </>
                  ) : (
                    <>
                      <th className="p-4 text-left">Branch</th>
                      <th className="p-4 text-left">College</th>
                      <th className="p-4 text-left">City</th>
                      <th className="p-4 text-left">Date</th>
                    </>
                  )}

                  <th className="p-4 text-left">Certificate ID</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCertificates.map((certificate) => (
                  <tr
                    key={certificate._id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-4 font-medium">{certificate.name}</td>
                    <td className="p-4">{certificate.rollNo}</td>

                    {certificateType === "MERIT" ? (
                      <>
                        <td className="p-4">{certificate.teamName || "—"}</td>
                        <td className="p-4">{certificate.college}</td>
                        <td className="p-4">{certificate.place || "—"}</td>
                        <td className="p-4">{certificate.event || "—"}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-4">{certificate.branch}</td>
                        <td className="p-4">{certificate.college}</td>
                        <td className="p-4">{certificate.city}</td>
                        <td className="p-4">{certificate.eventDate}</td>
                      </>
                    )}

                    <td className="p-4">
                      <span className="rounded-lg bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700">
                        {certificate.certificateId}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setEditing(certificate)}
                          className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          onClick={() => handleDownload(certificate)}
                          className="rounded-lg bg-[#00629B] px-3 py-2 text-sm font-medium text-white hover:bg-[#00527F]"
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-6">
              <div>
                <h2 className="text-xl font-bold">Edit Certificate</h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editing.certificateId}
                </p>
              </div>

              <button
                onClick={() => setEditing(null)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                placeholder="Name"
                className="rounded-xl border px-4 py-3"
              />

              <input
                value={editing.rollNo}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    rollNo: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Roll No"
                className="rounded-xl border px-4 py-3"
              />

              {certificateType === "MERIT" ? (
                <>
                  <input
                    value={editing.teamName || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, teamName: e.target.value })
                    }
                    placeholder="Team Name"
                    className="rounded-xl border px-4 py-3"
                  />

                  <input
                    value={editing.college}
                    onChange={(e) =>
                      setEditing({ ...editing, college: e.target.value })
                    }
                    placeholder="College"
                    className="rounded-xl border px-4 py-3"
                  />

                  <input
                    value={editing.place || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, place: e.target.value })
                    }
                    placeholder="Place"
                    className="rounded-xl border px-4 py-3"
                  />

                  <input
                    value={editing.event || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, event: e.target.value })
                    }
                    placeholder="Event"
                    className="rounded-xl border px-4 py-3"
                  />
                </>
              ) : (
                <>
                  <input
                    value={editing.branch}
                    onChange={(e) =>
                      setEditing({ ...editing, branch: e.target.value })
                    }
                    placeholder="Branch"
                    className="rounded-xl border px-4 py-3"
                  />

                  <input
                    value={editing.college}
                    onChange={(e) =>
                      setEditing({ ...editing, college: e.target.value })
                    }
                    placeholder="College"
                    className="rounded-xl border px-4 py-3"
                  />

                  <input
                    value={editing.city}
                    onChange={(e) =>
                      setEditing({ ...editing, city: e.target.value })
                    }
                    placeholder="City"
                    className="rounded-xl border px-4 py-3"
                  />

                  <input
                    value={editing.eventDate}
                    onChange={(e) =>
                      setEditing({ ...editing, eventDate: e.target.value })
                    }
                    placeholder="13-08-2026"
                    className="rounded-xl border px-4 py-3"
                  />
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t p-6">
              <button
                onClick={() => setEditing(null)}
                className="rounded-xl border px-5 py-3 font-medium"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-[#6C5FE0] px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                <Save size={17} />

                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
