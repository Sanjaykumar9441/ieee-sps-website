import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Download,
  Loader2,
  Search,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

type CertificateType = "PARTICIPATION" | "MERIT" | "VOLUNTEER";

interface CertificateEvent {
  _id: string;
  eventCode: string;
  eventName?: string;
}

interface Certificate {
  certificateId: string;
  name: string;
  rollNo: string;
  branch?: string;
  college?: string;
  city?: string;
  team?: string;
  position?: string;
  event?: string;
  eventDate?: string;
  certificateType: CertificateType;
}

const CERTIFICATE_TYPES: Array<{
  value: CertificateType;
  label: string;
}> = [
  { value: "PARTICIPATION", label: "Participation" },
  { value: "MERIT", label: "Merit" },
  { value: "VOLUNTEER", label: "Volunteer" },
];

export default function CertificateDownload() {
  const navigate = useNavigate();
  const location = useLocation();

  const [events, setEvents] = useState<CertificateEvent[]>([]);
  const [selectedEventCode, setSelectedEventCode] = useState("");
  const [certificateType, setCertificateType] =
    useState<CertificateType>("PARTICIPATION");
  const [rollNo, setRollNo] = useState("");

  const [loadingEvents, setLoadingEvents] = useState(true);
  const [searching, setSearching] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Optional event preselection:
  // /certificates?event=NSD2026
  const queryEvent = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get("event") || "").trim().toUpperCase();
  }, [location.search]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoadingEvents(true);
        setErrorMessage("");

        const response = await axios.get(`${API}/api/certificates/events`);

        const nextEvents: CertificateEvent[] = response.data.events || [];
        setEvents(nextEvents);

        if (nextEvents.length === 0) {
          setSelectedEventCode("");
          return;
        }

        const matchingEvent = queryEvent
          ? nextEvents.find(
              (event) => event.eventCode.toUpperCase() === queryEvent,
            )
          : undefined;

        setSelectedEventCode(
          matchingEvent?.eventCode || nextEvents[0].eventCode,
        );
      } catch (error) {
        console.error("Certificate events error:", error);
        setErrorMessage("Unable to load events right now. Please try again.");
      } finally {
        setLoadingEvents(false);
      }
    };

    loadEvents();
  }, [queryEvent]);

  const selectedEvent = events.find(
    (event) => event.eventCode === selectedEventCode,
  );

  const handleFindCertificate = async () => {
    const normalizedRollNo = rollNo.trim().toUpperCase();

    if (!selectedEventCode) {
      setErrorMessage("Please select an event.");
      return;
    }

    if (!normalizedRollNo) {
      setErrorMessage("Please enter your roll number.");
      return;
    }

    try {
      setSearching(true);
      setCertificate(null);
      setErrorMessage("");

      const response = await axios.get(
        `${API}/api/certificates/verify/${encodeURIComponent(
          normalizedRollNo,
        )}`,
        {
          params: {
            eventCode: selectedEventCode,
            certificateType,
          },
        },
      );

      setCertificate(response.data.certificate || null);

      if (!response.data.certificate) {
        setErrorMessage("Certificate not found.");
      }
    } catch (error: any) {
      console.error("Certificate lookup error:", error);

      if (error?.response?.status === 404) {
        setErrorMessage(
          "We couldn't find a certificate matching the selected event, certificate type and roll number.",
        );
      } else {
        setErrorMessage(
          error?.response?.data?.message ||
            "Unable to find the certificate. Please try again.",
        );
      }
    } finally {
      setSearching(false);
    }
  };

  const handleDownload = async () => {
    // Prevent double-click / duplicate requests
    if (downloading) return;

    if (!certificate) {
      setErrorMessage("Certificate details are not available.");
      return;
    }

    if (!selectedEventCode) {
      setErrorMessage("Event information is missing.");
      return;
    }

    try {
      setDownloading(true);
      setErrorMessage("");

      const normalizedRollNo = certificate.rollNo.trim().toUpperCase();

      const response = await axios.get(
        `${API}/api/certificates/download/${encodeURIComponent(
          normalizedRollNo,
        )}`,
        {
          params: {
            eventCode: selectedEventCode,
            certificateType: certificate.certificateType,
          },
          responseType: "blob",
        },
      );

      if (!response.data || response.data.size === 0) {
        throw new Error("Empty certificate file received.");
      }

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${certificate.certificateId}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Give browser time to start download
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error: any) {
      console.error("Certificate download error:", error);

      setErrorMessage("Unable to download the certificate. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const resetResult = () => {
    setCertificate(null);
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#00629B]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00629B] text-white">
              <Award className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold tracking-wide text-slate-800">
              IEEE SPS
            </span>
          </div>
        </div>
      </div>

      <main className="px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-8 text-center"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#00629B]">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#00629B]">
              IEEE SPS Certificate Portal
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Download Your Certificate
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Select your event, choose the certificate type, and enter your
              roll number to find your official certificate.
            </p>
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="mb-7 flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#00629B]">
                <Award className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Find Your Certificate
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the details exactly as registered for the event.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="certificate-event"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Event
                </label>

                <div className="relative">
                  <select
                    id="certificate-event"
                    value={selectedEventCode}
                    onChange={(event) => {
                      setSelectedEventCode(event.target.value);
                      resetResult();
                    }}
                    disabled={loadingEvents || events.length === 0}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm outline-none transition focus:border-[#00629B] focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
                  >
                    {loadingEvents ? (
                      <option value="">Loading events...</option>
                    ) : events.length === 0 ? (
                      <option value="">No events available</option>
                    ) : (
                      events.map((event) => (
                        <option key={event.eventCode} value={event.eventCode}>
                          {event.eventName || event.eventCode}
                        </option>
                      ))
                    )}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>

                {selectedEvent && (
                  <p className="mt-2 text-xs text-slate-400">
                    Event code: {selectedEvent.eventCode}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="certificate-type"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Certificate Type
                </label>

                <div className="relative">
                  <select
                    id="certificate-type"
                    value={certificateType}
                    onChange={(event) => {
                      setCertificateType(event.target.value as CertificateType);
                      resetResult();
                    }}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm outline-none transition focus:border-[#00629B] focus:ring-4 focus:ring-blue-50"
                  >
                    {CERTIFICATE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="roll-number"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Roll Number
                </label>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="roll-number"
                    value={rollNo}
                    onChange={(event) => {
                      setRollNo(event.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleFindCertificate();
                      }
                    }}
                    placeholder="Enter your roll number"
                    autoComplete="off"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm uppercase outline-none transition placeholder:normal-case focus:border-[#00629B] focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleFindCertificate}
              disabled={searching || loadingEvents || !selectedEventCode}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00629B] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0C447C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {searching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finding Certificate...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Find Certificate
                </>
              )}
            </button>
          </motion.section>

          {certificate && (
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-5 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Certificate Found
                  </h2>
                  <p className="text-sm text-slate-500">
                    Please verify your details before downloading.
                  </p>
                </div>
              </div>

              <div className="grid overflow-hidden rounded-2xl border border-slate-200 sm:grid-cols-2">
                <div className="border-b border-slate-100 p-4 sm:border-r">
                  <p className="text-xs text-slate-400">Name</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {certificate.name}
                  </p>
                </div>

                <div className="border-b border-slate-100 p-4">
                  <p className="text-xs text-slate-400">Roll Number</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {certificate.rollNo}
                  </p>
                </div>

                <div className="border-b border-slate-100 p-4 sm:border-r">
                  <p className="text-xs text-slate-400">Event</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedEvent?.eventName ||
                      certificate.event ||
                      selectedEventCode}
                  </p>
                </div>

                <div className="border-b border-slate-100 p-4">
                  <p className="text-xs text-slate-400">Certificate Type</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {
                      CERTIFICATE_TYPES.find(
                        (type) => type.value === certificate.certificateType,
                      )?.label
                    }
                  </p>
                </div>

                {(certificate.branch || certificate.college) && (
                  <div className="p-4 sm:border-r">
                    <p className="text-xs text-slate-400">College / Branch</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {[certificate.college, certificate.branch]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </div>
                )}

                {(certificate.team || certificate.position) && (
                  <div className="p-4">
                    <p className="text-xs text-slate-400">Team / Position</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {[certificate.team, certificate.position]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download Certificate
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs text-slate-400">
                Certificate ID: {certificate.certificateId}
              </p>
            </motion.section>
          )}

          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            If your certificate is not found, check the selected event,
            certificate type and roll number.
          </p>
        </div>
      </main>
    </div>
  );
}
