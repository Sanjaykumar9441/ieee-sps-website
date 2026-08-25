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
  RotateCcw,
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

  // ------------------------------------------------------------
  // OPTIONAL EVENT PRESELECTION
  // /certificates?event=NSD2026
  // ------------------------------------------------------------

  const queryEvent = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get("event") || "").trim().toUpperCase();
  }, [location.search]);

  // ------------------------------------------------------------
  // LOAD EVENTS
  // ------------------------------------------------------------

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

  // ------------------------------------------------------------
  // RESET SEARCH RESULT
  // ------------------------------------------------------------

  const resetResult = () => {
    setCertificate(null);
    setErrorMessage("");
  };

  // ------------------------------------------------------------
  // WHEN USER CLICKS / EDITS ROLL NUMBER
  // RESULT DISAPPEARS AND SEARCH BUTTON COMES BACK
  // ------------------------------------------------------------

  const handleRollNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRollNo(event.target.value);

    if (certificate) {
      setCertificate(null);
    }

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleRollNumberFocus = () => {
    if (certificate) {
      setCertificate(null);
    }
  };

  // ------------------------------------------------------------
  // FIND CERTIFICATE
  // ------------------------------------------------------------

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

      const foundCertificate = response.data.certificate || null;

      setCertificate(foundCertificate);

      if (!foundCertificate) {
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

  // ------------------------------------------------------------
  // DOWNLOAD
  // ------------------------------------------------------------

  const handleDownload = async () => {
    if (!certificate) return;

    try {
      setDownloading(true);
      setErrorMessage("");

      const response = await axios.get(
        `${API}/api/certificates/download/${encodeURIComponent(
          certificate.rollNo,
        )}`,
        {
          params: {
            eventCode: selectedEventCode,
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
    } catch (error: any) {
      console.error("Certificate download error:", error);

      setErrorMessage(
        error?.response?.data?.message ||
          "Unable to download the certificate. Please try again.",
      );
    } finally {
      setDownloading(false);
    }
  };

  // ------------------------------------------------------------
  // SEARCH ANOTHER CERTIFICATE
  // ------------------------------------------------------------

  const handleSearchAnother = () => {
    setCertificate(null);
    setErrorMessage("");

    // Focus roll number input after returning to search mode
    setTimeout(() => {
      document.getElementById("roll-number")?.focus();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-[#00629B]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
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

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* ==================================================
              PAGE TITLE
          ================================================== */}

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
              Find your official certificate using your event, certificate type
              and roll number.
            </p>
          </motion.div>

          {/* ==================================================
              SEARCH + RESULT
          ================================================== */}

          <div
            className={`grid gap-6 ${
              certificate ? "lg:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {/* =================================================
                SEARCH CARD
            ================================================= */}

            <motion.section
              layout
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
            >
              {/* CARD HEADER */}

              <div className="mb-7 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#00629B]">
                  <Award className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Find Your Certificate
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter the details exactly as registered.
                  </p>
                </div>
              </div>

              {/* EVENT + CERTIFICATE TYPE */}

              <div className="grid gap-5 sm:grid-cols-2">
                {/* EVENT */}

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

                {/* CERTIFICATE TYPE */}

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
                        setCertificateType(
                          event.target.value as CertificateType,
                        );
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
              </div>

              {/* ROLL NUMBER */}

              <div className="mt-5">
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
                    onChange={handleRollNumberChange}
                    onFocus={handleRollNumberFocus}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleFindCertificate();
                      }
                    }}
                    placeholder="Enter your roll number"
                    autoComplete="off"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm uppercase outline-none transition placeholder:normal-case focus:border-[#00629B] focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                {certificate && (
                  <p className="mt-2 text-xs text-slate-400">
                    Click here to search for another certificate.
                  </p>
                )}
              </div>

              {/* ERROR */}

              {errorMessage && (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                  <span>{errorMessage}</span>
                </div>
              )}

              {/* FIND BUTTON
                  ONLY SHOW WHEN NO CERTIFICATE */}

              {!certificate && (
                <motion.button
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
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
                </motion.button>
              )}

              {/* SEARCH ANOTHER BUTTON */}

              {certificate && (
                <button
                  type="button"
                  onClick={handleSearchAnother}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <RotateCcw className="h-4 w-4" />
                  Search Another Certificate
                </button>
              )}
            </motion.section>

            {/* =================================================
                CERTIFICATE RESULT
            ================================================= */}

            {certificate && (
              <motion.section
                layout
                initial={{
                  opacity: 0,
                  x: 20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  duration: 0.4,
                }}
                className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7"
              >
                {/* SUCCESS HEADER */}

                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Certificate Found
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Your certificate details are ready.
                    </p>
                  </div>
                </div>

                {/* DETAILS */}

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  {/* NAME */}

                  <div className="border-b border-slate-100 p-4">
                    <p className="text-xs font-medium text-slate-400">Name</p>

                    <p className="mt-1 break-words text-base font-semibold text-slate-900">
                      {certificate.name}
                    </p>
                  </div>

                  {/* ROLL NUMBER */}

                  <div className="border-b border-slate-100 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Roll Number
                    </p>

                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {certificate.rollNo}
                    </p>
                  </div>

                  {/* EVENT */}

                  <div className="border-b border-slate-100 p-4">
                    <p className="text-xs font-medium text-slate-400">Event</p>

                    <p className="mt-1 break-words text-base font-semibold text-slate-900">
                      {selectedEvent?.eventName ||
                        certificate.event ||
                        selectedEventCode}
                    </p>
                  </div>

                  {/* CERTIFICATE TYPE */}

                  <div className="border-b border-slate-100 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Certificate Type
                    </p>

                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {
                        CERTIFICATE_TYPES.find(
                          (type) => type.value === certificate.certificateType,
                        )?.label
                      }
                    </p>
                  </div>

                  {/* COLLEGE / BRANCH */}

                  {(certificate.branch || certificate.college) && (
                    <div className="border-b border-slate-100 p-4">
                      <p className="text-xs font-medium text-slate-400">
                        College / Branch
                      </p>

                      <p className="mt-1 break-words text-base font-semibold text-slate-900">
                        {[certificate.college, certificate.branch]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>
                  )}

                  {/* TEAM / POSITION */}

                  {(certificate.team || certificate.position) && (
                    <div className="p-4">
                      <p className="text-xs font-medium text-slate-400">
                        Team / Position
                      </p>

                      <p className="mt-1 break-words text-base font-semibold text-slate-900">
                        {[certificate.team, certificate.position]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>
                  )}
                </div>

                {/* DOWNLOAD */}

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00629B] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0C447C] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Preparing Certificate...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Certificate
                    </>
                  )}
                </button>

                {/* CERTIFICATE ID */}

                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Certificate ID
                  </p>

                  <p className="mt-1 break-all text-xs font-semibold text-slate-600">
                    {certificate.certificateId}
                  </p>
                </div>

                {/* NOTE */}

                <p className="mt-4 text-center text-xs leading-5 text-slate-400">
                  Please verify your name and certificate type before
                  downloading.
                </p>
              </motion.section>
            )}
          </div>

          {/* ==================================================
              FOOTER NOTE
          ================================================== */}

          <p className="mx-auto mt-8 max-w-xl text-center text-xs leading-5 text-slate-400">
            If your certificate is not found, check the selected event,
            certificate type and roll number.
          </p>
        </div>
      </main>
    </div>
  );
}
