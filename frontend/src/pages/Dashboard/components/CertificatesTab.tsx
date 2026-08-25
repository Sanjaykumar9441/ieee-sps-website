import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Award,
  Download,
  Edit,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
  Save,
  CheckSquare,
  Square,
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

type MemberForm = {
  name: string;
  rollNo: string;
  branch: string;
  college: string;
  city: string;
  team: string;
  position: string;
  event: string;
};

const emptyMemberForm: MemberForm = {
  name: "",
  rollNo: "",
  branch: "",
  college: "",
  city: "",
  team: "",
  position: "",
  event: "",
};

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

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [memberForm, setMemberForm] = useState<MemberForm>(emptyMemberForm);
  const [saving, setSaving] = useState(false);

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

      if (nextEvents.length === 0) {
        setSelectedEventCode("");
        localStorage.removeItem("certificateEventCode");
        return;
      }

      const saved = localStorage.getItem("certificateEventCode");
      const exists = nextEvents.some((event) => event.eventCode === saved);
      const nextCode = exists ? saved! : nextEvents[0].eventCode;

      setSelectedEventCode(nextCode);
      localStorage.setItem("certificateEventCode", nextCode);
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
      setSelectedIds([]);
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
      setSelectedIds([]);
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
    setSelectedIds([]);
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

  const allVisibleSelected =
    filteredCertificates.length > 0 &&
    filteredCertificates.every((certificate) => selectedIds.includes(certificate._id));

  const toggleSelect = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredCertificates.map((item) => item._id));
      setSelectedIds((current) => current.filter((id) => !visibleIds.has(id)));
      return;
    }

    setSelectedIds((current) => {
      const next = new Set(current);
      filteredCertificates.forEach((item) => next.add(item._id));
      return Array.from(next);
    });
  };

  const handleCreateEvent = async () => {
    const eventCode = newEventCode.trim().toUpperCase();

    if (!eventCode) {
      alert("Event code is required.");
      return;
    }

    try {
      setCreatingEvent(true);

      const response = await axios.post(
        `${API}/api/certificates/events`,
        { eventCode },
        authConfig,
      );

      const created: CertificateEvent = response.data.event;

      setEvents((current) =>
        [...current.filter((event) => event.eventCode !== created.eventCode), created].sort(
          (a, b) => a.eventCode.localeCompare(b.eventCode),
        ),
      );

      setSelectedEventCode(created.eventCode);
      localStorage.setItem("certificateEventCode", created.eventCode);
      setCertificateType("PARTICIPATION");
      setNewEventCode("");
      setShowCreateEvent(false);
    } catch (error: any) {
      console.error("Create event error:", error);
      alert(error?.response?.data?.message || "Failed to create event.");
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEventCode) return;

    const confirmed = window.confirm(
      `Delete event ${selectedEventCode}?\n\nThis will permanently delete ALL certificates belonging to this event.`,
    );

    if (!confirmed) return;

    try {
      setDeletingEvent(true);

      await axios.delete(
        `${API}/api/certificates/events/${encodeURIComponent(selectedEventCode)}`,
        authConfig,
      );

      const remaining = events.filter(
        (event) => event.eventCode !== selectedEventCode,
      );

      setEvents(remaining);
      setCertificates([]);
      setSelectedIds([]);

      const nextCode = remaining[0]?.eventCode || "";
      setSelectedEventCode(nextCode);

      if (nextCode) localStorage.setItem("certificateEventCode", nextCode);
      else localStorage.removeItem("certificateEventCode");
    } catch (error: any) {
      console.error("Delete event error:", error);
      alert(error?.response?.data?.message || "Failed to delete event.");
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

  const handleDownload = async (certificate: Certificate) => {
    try {
      const response = await axios.get(
        `${API}/api/certificates/download/${encodeURIComponent(certificate.rollNo)}`,
        {
          params: {
            eventCode: certificate.eventCode,
            certificateType: certificate.certificateType,
          },
          ...authConfig,
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
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

  const openAddMember = () => {
    setEditing(null);
    setMemberForm(emptyMemberForm);
    setShowMemberModal(true);
  };

  const openEditMember = (certificate: Certificate) => {
    setEditing(certificate);
    setMemberForm({
      name: certificate.name || "",
      rollNo: certificate.rollNo || "",
      branch: certificate.branch || "",
      college: certificate.college || "",
      city: certificate.city || "",
      team: certificate.team || "",
      position: certificate.position || "",
      event: certificate.event || "",
    });
    setShowMemberModal(true);
  };

  const updateForm = (key: keyof MemberForm, value: string) => {
    setMemberForm((current) => ({ ...current, [key]: value }));
  };

  const handleSaveMember = async () => {
    if (!selectedEventCode) {
      alert("Please select an event first.");
      return;
    }

    if (!memberForm.name.trim() || !memberForm.rollNo.trim()) {
      alert("Name and Roll No are required.");
      return;
    }

    if (certificateType === "MERIT") {
      if (
        !memberForm.team.trim() ||
        !memberForm.college.trim() ||
        !memberForm.position.trim() ||
        !memberForm.event.trim()
      ) {
        alert("Team, College, Position and Event are required for Merit.");
        return;
      }
    } else if (!memberForm.college.trim()) {
      alert("College is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        eventCode: selectedEventCode,
        certificateType,
        name: memberForm.name.trim(),
        rollNo: memberForm.rollNo.trim().toUpperCase(),
        branch: memberForm.branch.trim(),
        college: memberForm.college.trim(),
        city: memberForm.city.trim(),
        team: memberForm.team.trim(),
        position: memberForm.position.trim(),
        event: memberForm.event.trim(),
      };

      if (editing) {
        await axios.put(
          `${API}/api/certificates/admin/member/${editing._id}`,
          payload,
          authConfig,
        );
      } else {
        await axios.post(
          `${API}/api/certificates/admin/member`,
          payload,
          authConfig,
        );
      }

      setShowMemberModal(false);
      setEditing(null);
      setMemberForm(emptyMemberForm);
      await fetchCertificates();
    } catch (error: any) {
      console.error("Save member error:", error);
      alert(error?.response?.data?.message || "Failed to save member.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (certificate: Certificate) => {
    const confirmed = window.confirm(
      `Delete certificate record for ${certificate.name} (${certificate.rollNo})?`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(certificate._id);

      await axios.delete(
        `${API}/api/certificates/admin/member/${certificate._id}`,
        authConfig,
      );

      await fetchCertificates();
    } catch (error: any) {
      console.error("Delete member error:", error);
      alert(error?.response?.data?.message || "Failed to delete member.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) {
      alert("Select at least one member.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedIds.length} selected certificate record(s)?`,
    );

    if (!confirmed) return;

    try {
      setBulkDeleting(true);

      await axios.post(
        `${API}/api/certificates/admin/members/delete`,
        {
          ids: selectedIds,
          eventCode: selectedEventCode,
          certificateType,
        },
        authConfig,
      );

      setSelectedIds([]);
      await fetchCertificates();
    } catch (error: any) {
      console.error("Bulk delete error:", error);
      alert(error?.response?.data?.message || "Failed to delete selected members.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const requiredColumns =
    certificateType === "MERIT"
      ? "Required columns: Name, RollNo, Team, College, Position, Event"
      : "Required columns: Name, RollNo, Branch, College, City, Date";

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-3">
          <Award size={28} className="text-[#6C5FE0]" />
          <h1 className="text-2xl font-bold">Certificates</h1>
        </div>
        <p className="mt-2 text-gray-500">
          Create or select an event, then manage its certificate data.
        </p>
      </div>

      {/* EVENT */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Certificate Event</h2>
            <p className="mt-1 text-sm text-gray-500">
              Select an event or create a new event code.
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

        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <label className="mb-2 block text-sm font-medium">Event</label>
            <select
              value={selectedEventCode}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedEventCode(value);
                if (value) localStorage.setItem("certificateEventCode", value);
              }}
              disabled={loadingEvents || events.length === 0}
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#6C5FE0] disabled:bg-gray-50"
            >
              {events.length === 0 ? (
                <option value="">No events available</option>
              ) : (
                events.map((event) => (
                  <option key={event.eventCode} value={event.eventCode}>
                    {event.eventCode}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleDeleteEvent}
              disabled={!selectedEventCode || deletingEvent}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              <Trash2 size={18} />
              {deletingEvent ? "Deleting..." : "Delete Event"}
            </button>
          </div>
        </div>
      </div>

      {/* IMPORT */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <FileSpreadsheet className="text-[#6C5FE0]" />
          <div>
            <h2 className="text-xl font-bold">Import Certificate Data</h2>
            <p className="text-sm text-gray-500">
              Upload the Excel file for the selected event.
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
              disabled={!selectedEventCode}
              className="w-full rounded-xl border px-4 py-3 outline-none disabled:bg-gray-50"
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
              Event: <strong>{selectedEventCode || "Not selected"}</strong>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium">Excel File</label>
          <div className="rounded-xl border-2 border-dashed p-5">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full"
              disabled={!selectedEventCode}
            />
            {file && (
              <p className="mt-3 text-sm text-gray-600">
                Selected: <strong>{file.name}</strong>
              </p>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">{requiredColumns}</p>
          <p className="mt-1 text-xs text-gray-500">
            Certificate date is not entered here when it is already part of the certificate template.
          </p>
        </div>

        <button
          type="button"
          onClick={handleImport}
          disabled={importing || !selectedEventCode}
          className="mt-5 flex items-center gap-2 rounded-xl bg-[#6C5FE0] px-5 py-3 font-semibold text-white transition hover:bg-[#594BD0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Upload size={18} />
          {importing ? "Importing..." : "Import Certificate Data"}
        </button>

        {importResult && (
          <div className="mt-5 rounded-xl bg-green-50 p-5 text-green-700">
            <p className="font-semibold">Certificate data imported successfully.</p>
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Imported</p>
                <p className="text-xl font-bold">{importResult.imported || 0}</p>
              </div>
              <div>
                <p className="text-gray-500">Skipped</p>
                <p className="text-xl font-bold">{importResult.skipped || 0}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Rows</p>
                <p className="text-xl font-bold">{importResult.totalRows || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RECORDS */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold">Certificate Records</h2>
              <p className="mt-1 text-sm text-gray-500">
                {selectedEventCode || "No event"} · {CERTIFICATE_TYPES.find((t) => t.value === certificateType)?.label || certificateType} · {certificates.length} records
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, roll no, team, event or certificate ID"
                  className="w-full rounded-xl border py-3 pl-10 pr-4 outline-none focus:border-[#6C5FE0] sm:w-80"
                />
              </div>

              <button
                type="button"
                onClick={openAddMember}
                disabled={!selectedEventCode}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#6C5FE0] px-4 py-3 font-semibold text-white hover:bg-[#594BD0] disabled:opacity-50"
              >
                <Plus size={18} />
                Add Member
              </button>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-semibold text-red-700">
                {selectedIds.length} member{selectedIds.length === 1 ? "" : "s"} selected
              </span>
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={bulkDeleting}
                className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={16} />
                {bulkDeleting ? "Deleting..." : "Delete Selected"}
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {loadingCertificates ? (
            <div className="p-10 text-center text-gray-500">Loading certificate records...</div>
          ) : !selectedEventCode ? (
            <div className="p-10 text-center text-gray-500">Create or select an event first.</div>
          ) : filteredCertificates.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No certificate records found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-4">
                    <button type="button" onClick={toggleSelectAll} title="Select all visible">
                      {allVisibleSelected ? <CheckSquare size={20} className="text-[#6C5FE0]" /> : <Square size={20} />}
                    </button>
                  </th>
                  <th className="px-4 py-4 font-semibold">Name</th>
                  <th className="px-4 py-4 font-semibold">Roll No</th>
                  {certificateType === "MERIT" ? (
                    <>
                      <th className="px-4 py-4 font-semibold">Team</th>
                      <th className="px-4 py-4 font-semibold">College</th>
                      <th className="px-4 py-4 font-semibold">Position</th>
                      <th className="px-4 py-4 font-semibold">Event</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-4 font-semibold">Branch</th>
                      <th className="px-4 py-4 font-semibold">College</th>
                      <th className="px-4 py-4 font-semibold">City</th>
                    </>
                  )}
                  <th className="px-4 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCertificates.map((certificate) => {
                  const selected = selectedIds.includes(certificate._id);
                  return (
                    <tr key={certificate._id} className={selected ? "bg-purple-50/50" : "hover:bg-gray-50"}>
                      <td className="px-4 py-4">
                        <button type="button" onClick={() => toggleSelect(certificate._id)}>
                          {selected ? <CheckSquare size={20} className="text-[#6C5FE0]" /> : <Square size={20} />}
                        </button>
                      </td>
                      <td className="px-4 py-4 font-medium">{certificate.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{certificate.rollNo}</td>
                      {certificateType === "MERIT" ? (
                        <>
                          <td className="px-4 py-4">{certificate.team || "—"}</td>
                          <td className="px-4 py-4">{certificate.college || "—"}</td>
                          <td className="px-4 py-4">{certificate.position || "—"}</td>
                          <td className="px-4 py-4">{certificate.event || "—"}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-4">{certificate.branch || "—"}</td>
                          <td className="px-4 py-4">{certificate.college || "—"}</td>
                          <td className="px-4 py-4">{certificate.city || "—"}</td>
                        </>
                      )}
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditMember(certificate)}
                            className="rounded-lg border px-3 py-2 text-[#6C5FE0] hover:bg-purple-50"
                            title="Edit member"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(certificate)}
                            disabled={deletingId === certificate._id}
                            className="rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                            title="Delete member"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(certificate)}
                            className="rounded-lg bg-[#006A9E] px-3 py-2 text-white hover:bg-[#00527F]"
                            title="Download certificate"
                          >
                            <Download size={16} />
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

      {/* CREATE EVENT MODAL */}
      {showCreateEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-6">
              <div>
                <h2 className="text-xl font-bold">Create Event</h2>
                <p className="mt-1 text-sm text-gray-500">Enter a unique event code.</p>
              </div>
              <button type="button" onClick={() => setShowCreateEvent(false)} className="rounded-lg p-2 hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <label className="mb-2 block text-sm font-medium">Event Code</label>
              <input
                autoFocus
                value={newEventCode}
                onChange={(e) => setNewEventCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateEvent();
                }}
                placeholder="NSD2027"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#6C5FE0]"
              />
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateEvent(false)} className="rounded-xl border px-4 py-3 font-medium hover:bg-gray-50">Cancel</button>
                <button type="button" onClick={handleCreateEvent} disabled={creatingEvent} className="rounded-xl bg-[#6C5FE0] px-5 py-3 font-semibold text-white disabled:opacity-50">
                  {creatingEvent ? "Creating..." : "Create Event"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MEMBER MODAL */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-6">
              <div>
                <h2 className="text-xl font-bold">{editing ? "Edit Member" : "Add Member"}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedEventCode} · {CERTIFICATE_TYPES.find((t) => t.value === certificateType)?.label}
                </p>
              </div>
              <button type="button" onClick={() => setShowMemberModal(false)} className="rounded-lg p-2 hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Name</label>
                <input value={memberForm.name} onChange={(e) => updateForm("name", e.target.value)} className="w-full rounded-xl border px-4 py-3 outline-none" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Roll No</label>
                <input value={memberForm.rollNo} onChange={(e) => updateForm("rollNo", e.target.value.toUpperCase())} className="w-full rounded-xl border px-4 py-3 outline-none" />
              </div>

              {certificateType === "MERIT" ? (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Team</label>
                    <input value={memberForm.team} onChange={(e) => updateForm("team", e.target.value)} className="w-full rounded-xl border px-4 py-3 outline-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">College</label>
                    <input value={memberForm.college} onChange={(e) => updateForm("college", e.target.value)} className="w-full rounded-xl border px-4 py-3 outline-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Position</label>
                    <input value={memberForm.position} onChange={(e) => updateForm("position", e.target.value)} className="w-full rounded-xl border px-4 py-3 outline-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Event</label>
                    <input value={memberForm.event} onChange={(e) => updateForm("event", e.target.value)} className="w-full rounded-xl border px-4 py-3 outline-none" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Branch</label>
                    <input value={memberForm.branch} onChange={(e) => updateForm("branch", e.target.value)} className="w-full rounded-xl border px-4 py-3 outline-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">College</label>
                    <input value={memberForm.college} onChange={(e) => updateForm("college", e.target.value)} className="w-full rounded-xl border px-4 py-3 outline-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">College City</label>
                    <input value={memberForm.city} onChange={(e) => updateForm("city", e.target.value)} className="w-full rounded-xl border px-4 py-3 outline-none" />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t p-6">
              <button type="button" onClick={() => setShowMemberModal(false)} className="rounded-xl border px-4 py-3 font-medium hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleSaveMember} disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#6C5FE0] px-5 py-3 font-semibold text-white disabled:opacity-50">
                <Save size={17} />
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
