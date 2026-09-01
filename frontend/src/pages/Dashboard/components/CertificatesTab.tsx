import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Award,
  Download,
  Edit,
  FileSpreadsheet,
  Plus,
  Search,
  Upload,
  X,
  Save,
  Trash2,
  RefreshCw,
} from "lucide-react";

const API = "https://ieee-sps-website.onrender.com";

const CERTIFICATE_TYPES = [
  { value: "PARTICIPATION", label: "Participation" },
  { value: "MERIT", label: "Merit" },
  { value: "VOLUNTEER", label: "Volunteer" },
];

interface CertificateEvent {
  _id: string | null;
  eventCode: string;
  eventName?: string;
  createdAt?: string | null;
}

interface Certificate {
  _id: string;
  certificateId: string;
  eventCode: string;
  certificateType: string;
  name: string;
  rollNo: string;
  branch?: string;
  college?: string;
  city?: string;
  team?: string;
  position?: string;
  event?: string;
  eventDate?: string;
  downloadCount?: number;
  lastDownloadedAt?: string;
}

export default function CertificatesTab() {
  const [events, setEvents] = useState<CertificateEvent[]>([]);
  const [selectedEventCode, setSelectedEventCode] = useState("");
  const [certificateType, setCertificateType] = useState("PARTICIPATION");

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingCertificates, setLoadingCertificates] = useState(false);

  const [search, setSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEventCode, setNewEventCode] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);

  const [editing, setEditing] = useState<Certificate | null>(null);
  const [saving, setSaving] = useState(false);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [bulkDownloading, setBulkDownloading] = useState(false);

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const response = await axios.get(
        `${API}/api/certificates/events`,
        authConfig,
      );

      const nextEvents: CertificateEvent[] = response.data.events || [];
      setEvents(nextEvents);

      const savedEvent = localStorage.getItem("certificateEventCode");
      const savedExists = nextEvents.some(
        (event) => event.eventCode === savedEvent,
      );

      if (savedExists) {
        setSelectedEventCode(savedEvent || "");
      } else if (nextEvents.length > 0) {
        setSelectedEventCode(nextEvents[0].eventCode);
        localStorage.setItem("certificateEventCode", nextEvents[0].eventCode);
      } else {
        setSelectedEventCode("");
        localStorage.removeItem("certificateEventCode");
      }
    } catch (error) {
      console.error("Certificate events fetch error:", error);
      alert("Unable to load certificate events.");
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchCertificates = async () => {
    if (!selectedEventCode) {
      setCertificates([]);
      return;
    }

    try {
      setLoadingCertificates(true);
      const response = await axios.get(`${API}/api/certificates/admin`, {
        params: {
          eventCode: selectedEventCode,
          certificateType,
        },
        ...authConfig,
      });

      setCertificates(response.data.certificates || []);
    } catch (error) {
      console.error("Certificate fetch error:", error);
      alert("Unable to load certificate records.");
    } finally {
      setLoadingCertificates(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    setFile(null);
    setImportResult(null);
    setSearch("");
    fetchCertificates();
  }, [selectedEventCode, certificateType]);

  const filteredCertificates = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return certificates;

    return certificates.filter((certificate) =>
      [
        certificate.name,
        certificate.rollNo,
        certificate.certificateId,
        certificate.college,
        certificate.city,
        certificate.branch,
        certificate.team,
        certificate.position,
        certificate.event,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [certificates, search]);

  const handleCreateEvent = async () => {
    const eventCode = newEventCode.trim().toUpperCase();

    if (!eventCode) {
      alert("Event code is required.");
      return;
    }

    try {
      setCreatingEvent(true);

      // certificateEventController requires eventName.
      // The UI intentionally uses only Event Code, so use the code as the name.
      const response = await axios.post(
        `${API}/api/certificates/events`,
        { eventCode, eventName: eventCode },
        authConfig,
      );

      const created: CertificateEvent = response.data.event;
      setEvents((previous) => [created, ...previous]);
      setSelectedEventCode(created.eventCode);
      localStorage.setItem("certificateEventCode", created.eventCode);
      setNewEventCode("");
      setShowCreateEvent(false);
      setCertificateType("PARTICIPATION");
    } catch (error: any) {
      console.error("Create certificate event error:", error);
      alert(
        error?.response?.data?.message || "Failed to create certificate event.",
      );
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEventCode) return;

    const confirmed = window.confirm(
      `Delete event ${selectedEventCode}?\n\nThis will permanently delete the event and ALL certificates belonging to it.`,
    );

    if (!confirmed) return;

    try {
      setDeletingEvent(true);

      await axios.delete(
        `${API}/api/certificates/events/${encodeURIComponent(
          selectedEventCode,
        )}`,
        authConfig,
      );

      const remaining = events.filter(
        (event) => event.eventCode !== selectedEventCode,
      );
      setEvents(remaining);

      const nextEvent = remaining[0]?.eventCode || "";
      setSelectedEventCode(nextEvent);

      if (nextEvent) {
        localStorage.setItem("certificateEventCode", nextEvent);
      } else {
        localStorage.removeItem("certificateEventCode");
      }

      setCertificates([]);
      alert("Event and its certificates were deleted successfully.");
    } catch (error: any) {
      console.error("Delete certificate event error:", error);
      alert(
        error?.response?.data?.message || "Failed to delete certificate event.",
      );
    } finally {
      setDeletingEvent(false);
    }
  };

  const handleImport = async () => {
    if (!selectedEventCode) {
      alert("Please create or select an event first.");
      return;
    }

    if (!file) {
      alert("Please select an Excel file.");
      return;
    }

    try {
      setImporting(true);
      setImportResult(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventCode", selectedEventCode);
      formData.append("certificateType", certificateType);

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

  const saveBlobAsFile = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  };

  const handleDownload = async (certificate: Certificate) => {
    if (downloadingId) return;

    try {
      setDownloadingId(certificate.certificateId);

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

      saveBlobAsFile(
        new Blob([response.data], { type: "application/pdf" }),
        `${certificate.certificateId}.pdf`,
      );
    } catch (error) {
      console.error("Certificate download error:", error);
      alert("Unable to download certificate.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleBulkDownload = async () => {
    if (!selectedEventCode || bulkDownloading) return;

    try {
      setBulkDownloading(true);

      // No certificateType means ALL certificate types for this event.
      // The backend places Merit and Participation PDFs in separate folders.
      const response = await axios.get(
        `${API}/api/certificates/admin/export-pdfs`,
        {
          params: {
            eventCode: selectedEventCode,
          },
          ...authConfig,
          responseType: "blob",
        },
      );

      saveBlobAsFile(
        new Blob([response.data], { type: "application/zip" }),
        `${selectedEventCode}_Certificates_ALL.zip`,
      );
    } catch (error: any) {
      console.error("Certificate ZIP export error:", error);

      // If the server returned JSON while responseType is blob, read it.
      let message = "Unable to export certificates.";
      try {
        if (error?.response?.data instanceof Blob) {
          const text = await error.response.data.text();
          const parsed = JSON.parse(text);
          message = parsed?.message || message;
        }
      } catch (_) {
        // Keep the default message.
      }

      alert(message);
    } finally {
      setBulkDownloading(false);
    }
  };

  const handleDownloadCurrentType = async () => {
    if (!selectedEventCode || bulkDownloading) return;

    try {
      setBulkDownloading(true);

      const response = await axios.get(
        `${API}/api/certificates/admin/export-pdfs`,
        {
          params: {
            eventCode: selectedEventCode,
            certificateType,
          },
          ...authConfig,
          responseType: "blob",
        },
      );

      saveBlobAsFile(
        new Blob([response.data], { type: "application/zip" }),
        `${selectedEventCode}_Certificates_${certificateType}.zip`,
      );
    } catch (error: any) {
      console.error("Certificate ZIP export error:", error);
      alert("Unable to export certificates.");
    } finally {
      setBulkDownloading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editing || saving) return;

    try {
      setSaving(true);

      const payload =
        editing.certificateType === "MERIT"
          ? {
              name: editing.name,
              rollNo: editing.rollNo,
              team: editing.team,
              college: editing.college,
              position: editing.position,
              event: editing.event,
            }
          : {
              name: editing.name,
              rollNo: editing.rollNo,
              branch: editing.branch,
              college: editing.college,
              city: editing.city,
            };

      await axios.put(
        `${API}/api/certificates/admin/${encodeURIComponent(
          editing.certificateId,
        )}`,
        payload,
        authConfig,
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

  const requiredColumns =
    certificateType === "MERIT"
      ? "Name, RollNo, Team, College, Position, Event"
      : "Name, RollNo, Branch, College, City, Date";

  const typeLabel =
    CERTIFICATE_TYPES.find((type) => type.value === certificateType)?.label ||
    certificateType;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <Award size={28} className="text-[#6C5FE0]" />
          <h1 className="text-2xl font-bold">Certificates</h1>
        </div>
        <p className="mt-2 text-gray-500">
          Create or select an event, then import, edit and download
          certificates.
        </p>
      </div>

      {/* EVENT */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Certificate Event</h2>
            <p className="mt-1 text-sm text-gray-500">
              Select an existing event or create a new event. Deleting an event
              also deletes all certificates under that event.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateEvent(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#6C5FE0] px-4 py-3 font-semibold text-white hover:bg-[#594BD0]"
          >
            <Plus size={18} />
            Create Event
          </button>
        </div>

        {loadingEvents ? (
          <div className="rounded-xl border bg-gray-50 px-4 py-4 text-sm text-gray-500">
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-gray-50 px-4 py-8 text-center text-gray-500">
            No certificate events yet. Create an event to begin.
          </div>
        ) : (
          <div className="flex flex-col gap-3 md:flex-row">
            <select
              value={selectedEventCode}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedEventCode(value);
                localStorage.setItem("certificateEventCode", value);
              }}
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#6C5FE0]"
            >
              {events.map((event) => (
                <option key={event.eventCode} value={event.eventCode}>
                  {event.eventName && event.eventName !== event.eventCode
                    ? `${event.eventCode} — ${event.eventName}`
                    : event.eventCode}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchEvents}
              disabled={loadingEvents}
              className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-medium hover:bg-gray-50 disabled:opacity-50"
              title="Refresh events"
            >
              <RefreshCw size={17} />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleDeleteEvent}
              disabled={!selectedEventCode || deletingEvent}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={17} />
              {deletingEvent ? "Deleting..." : "Delete Event"}
            </button>
          </div>
        )}
      </div>

      {selectedEventCode && (
        <>
          {/* IMPORT */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <FileSpreadsheet className="text-[#6C5FE0]" />
              <div>
                <h2 className="text-xl font-bold">Import Certificate Data</h2>
                <p className="text-sm text-gray-500">
                  Import Excel data for <strong>{selectedEventCode}</strong>.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Certificate Type
                </label>
                <select
                  value={certificateType}
                  onChange={(e) => setCertificateType(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 outline-none"
                >
                  {CERTIFICATE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <div className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  Event: <strong>{selectedEventCode}</strong>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium">
                Excel File
              </label>
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
                Required columns: {requiredColumns}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Certificate date is not entered here; it is already part of the
                certificate template.
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
                    <p className="text-xl font-bold">
                      {importResult.skipped || 0}
                    </p>
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

          {/* RECORDS */}
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Certificate Records</h2>
                  <p className="text-sm text-gray-500">
                    {selectedEventCode} · {typeLabel} ·{" "}
                    {filteredCertificates.length} records
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative w-full sm:w-80">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name, roll no, team, event..."
                      className="w-full rounded-xl border py-3 pl-10 pr-4 outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadCurrentType}
                    disabled={
                      bulkDownloading || filteredCertificates.length === 0
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download size={17} />
                    {bulkDownloading
                      ? "Downloading..."
                      : `Download ${typeLabel}`}
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkDownload}
                    disabled={bulkDownloading}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#00629B] px-4 py-3 font-semibold text-white hover:bg-[#00527F] disabled:cursor-not-allowed disabled:opacity-50"
                    title="Downloads both Participation and Merit certificates for this event"
                  >
                    <Download size={17} />
                    {bulkDownloading ? "Downloading..." : "Download All"}
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loadingCertificates ? (
                <div className="py-16 text-center text-gray-500">
                  Loading certificates...
                </div>
              ) : filteredCertificates.length === 0 ? (
                <div className="py-16 text-center text-gray-500">
                  No certificate records found for this event and certificate
                  type.
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
                          <th className="p-4 text-left">Position</th>
                          <th className="p-4 text-left">Event</th>
                        </>
                      ) : (
                        <>
                          <th className="p-4 text-left">Branch</th>
                          <th className="p-4 text-left">College</th>
                          <th className="p-4 text-left">City</th>
                        </>
                      )}
                      <th className="p-4 text-left">Certificate ID</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCertificates.map((certificate) => {
                      const isDownloading =
                        downloadingId === certificate.certificateId;

                      return (
                        <tr
                          key={certificate._id}
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="p-4 font-medium">
                            {certificate.name}
                          </td>
                          <td className="p-4">{certificate.rollNo}</td>

                          {certificateType === "MERIT" ? (
                            <>
                              <td className="p-4">{certificate.team || "—"}</td>
                              <td className="p-4">
                                {certificate.college || "—"}
                              </td>
                              <td className="p-4">
                                {certificate.position || "—"}
                              </td>
                              <td className="p-4">
                                {certificate.event || "—"}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-4">
                                {certificate.branch || "—"}
                              </td>
                              <td className="p-4">
                                {certificate.college || "—"}
                              </td>
                              <td className="p-4">{certificate.city || "—"}</td>
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
                                disabled={Boolean(downloadingId)}
                                className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>

                              <button
                                onClick={() => handleDownload(certificate)}
                                disabled={Boolean(downloadingId)}
                                className="flex min-w-24 items-center justify-center gap-2 rounded-lg bg-[#00629B] px-3 py-2 text-sm font-medium text-white hover:bg-[#00527F] disabled:cursor-not-allowed disabled:opacity-60"
                                title="Download"
                              >
                                <Download size={16} />
                                {isDownloading ? "Downloading..." : "Download"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* CREATE EVENT MODAL */}
      {showCreateEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-6">
              <div>
                <h2 className="text-xl font-bold">Create Event</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter a unique event code.
                </p>
              </div>
              <button
                onClick={() => setShowCreateEvent(false)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="mb-2 block text-sm font-medium">
                Event Code
              </label>
              <input
                autoFocus
                value={newEventCode}
                onChange={(e) => setNewEventCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !creatingEvent) handleCreateEvent();
                }}
                placeholder="NSD2027"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#6C5FE0]"
              />

              <p className="mt-2 text-xs text-gray-500">
                The event code is also used as the event name internally. No
                date is entered here.
              </p>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateEvent(false)}
                  className="rounded-xl border px-4 py-3 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEvent}
                  disabled={creatingEvent}
                  className="rounded-xl bg-[#6C5FE0] px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {creatingEvent ? "Creating..." : "Create Event"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-6">
              <div>
                <h2 className="text-xl font-bold">Edit Certificate</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {editing.certificateId} · {editing.eventCode}
                </p>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Name</label>
                <input
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                  className="w-full rounded-xl border px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Roll No
                </label>
                <input
                  value={editing.rollNo}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      rollNo: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full rounded-xl border px-4 py-3 outline-none"
                />
              </div>

              {editing.certificateType === "MERIT" ? (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Team
                    </label>
                    <input
                      value={editing.team || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, team: e.target.value })
                      }
                      className="w-full rounded-xl border px-4 py-3 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      College
                    </label>
                    <input
                      value={editing.college || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, college: e.target.value })
                      }
                      className="w-full rounded-xl border px-4 py-3 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Position
                    </label>
                    <input
                      value={editing.position || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, position: e.target.value })
                      }
                      className="w-full rounded-xl border px-4 py-3 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Event
                    </label>
                    <input
                      value={editing.event || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, event: e.target.value })
                      }
                      className="w-full rounded-xl border px-4 py-3 outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Branch
                    </label>
                    <input
                      value={editing.branch || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, branch: e.target.value })
                      }
                      className="w-full rounded-xl border px-4 py-3 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      College
                    </label>
                    <input
                      value={editing.college || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, college: e.target.value })
                      }
                      className="w-full rounded-xl border px-4 py-3 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      City
                    </label>
                    <input
                      value={editing.city || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, city: e.target.value })
                      }
                      className="w-full rounded-xl border px-4 py-3 outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t p-6">
              <button
                onClick={() => setEditing(null)}
                className="rounded-xl border px-4 py-3 font-medium hover:bg-gray-50"
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
