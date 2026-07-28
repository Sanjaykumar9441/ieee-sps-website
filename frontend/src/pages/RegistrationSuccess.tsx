import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { saveAs } from "file-saver";
import {
  CheckCircle2,
  CreditCard,
  Users,
  CalendarDays,
  Download,
  Home,
} from "lucide-react";
import { eventThemes } from "../components/spaceDay/registration/eventTheme";
import { EventType } from "../components/spaceDay/registration/types";
import { astroModelerThemes } from "../components/spaceDay/registration/data/themeConfig";

interface RegistrationSuccessState {
  registration: {
    eventType: EventType;
    registrationType: "team" | "individual";
    teamName?: string;
    selectedTheme?: string;
    members: any[];
    registrationFee: number;
    totalFee: number;
    accommodation: boolean;
  };

  registrationId: string;
}
export default function RegistrationSuccess() {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);

  const { state } = useLocation() as {
    state: RegistrationSuccessState;
  };

  if (!state) {
    navigate("/space-day");
    return null;
  }

  const { registration, registrationId } = state;

  const theme = eventThemes[registration.eventType as EventType];
  
  const selectedTheme = astroModelerThemes.find(
    (theme) => theme.id === registration.selectedTheme,
  );

  const eventNames = {
  astroquiz: "Astro Quiz",
  astrodesign: "AI Astro Design",
  astromodeler: "Astro Modeler",
};

  const downloadAcknowledgement = async () => {
    if (isDownloading) return;

    setIsDownloading(true);

    const toastId = toast.loading("Preparing your acknowledgement...");

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/space-day/acknowledgement/${registrationId}`,
        {
          responseType: "blob",
        },
      );

      saveAs(response.data, `National-Space-Day-2026-${registrationId}.pdf`);

      toast.success("Acknowledgement downloaded successfully!", {
        id: toastId,
      });
    } catch (error) {
      console.error(error);

      toast.error("Failed to download acknowledgement.", {
        id: toastId,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#F8FAFC] py-20">
      {/* Background Blur */}

      <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-blue-200/20 blur-3xl" />

      <div className="absolute bottom-0 left-0 h-[350px] w-[350px] rounded-full bg-sky-100/30 blur-3xl" />

      {/* Grid */}

      <div className="absolute inset-0 opacity-[0.04]">
        <div className="h-full w-full bg-[linear-gradient(to_right,#94a3b8_1px,transparent_1px),linear-gradient(to_bottom,#94a3b8_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Header */}

        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`rounded-3xl bg-gradient-to-r ${theme.gradient} p-10 text-white shadow-xl`}
        >
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-white/20 p-5">
              <CheckCircle2 size={70} />
            </div>

            <h1 className="mt-6 text-center text-4xl font-bold">
              Registration Successful
            </h1>

            <p className="mt-3 text-center text-white/90">
              Thank you for registering for National Space Day 2026.
            </p>
          </div>
        </motion.div>
        {/* Registration Details */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`mt-10 rounded-3xl border ${theme.border} bg-white shadow-xl`}
        >
          <div
            className={`h-2 rounded-t-3xl bg-gradient-to-r ${theme.gradient}`}
          />

          <div className="p-8">
            <div className="flex items-center gap-3">
              <Users className={theme.text} size={26} />
              <h2 className="text-2xl font-bold text-slate-900">
                Registration Details
              </h2>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {/* Registration ID */}

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">Registration ID</p>

                <p className={`mt-2 text-xl font-bold ${theme.text}`}>
                  {registrationId}
                </p>
              </div>

              {/* Event */}

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">Event</p>

                <p className="mt-2 text-xl font-semibold">
                  {eventNames[registration.eventType]}
                </p>
              </div>

              {/* Team / Participant */}

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">
                  {registration.registrationType === "team"
                    ? "Team Name"
                    : "Participant"}
                </p>

                <p className="mt-2 text-xl font-semibold">
                  {registration.registrationType === "team"
                    ? registration.teamName
                    : registration.members?.[0]?.fullName}
                </p>
              </div>

              {/* College */}

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">College</p>

                <p className="mt-2 text-xl font-semibold">
                  {registration.members?.[0]?.college === "Other"
                    ? registration.members?.[0]?.otherCollege
                    : registration.members?.[0]?.college}
                </p>
              </div>

              {/* Registration Fee */}

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">Registration Fee</p>

                <p className="mt-2 text-xl font-semibold">
                  ₹{registration.registrationFee}
                </p>
              </div>

              {/* Accommodation */}

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">Accommodation</p>

                <p className="mt-2 text-xl font-semibold">
                  {registration.accommodation ? "Required" : "Not Required"}
                </p>
              </div>

              {/* Total Amount */}

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">Total Amount Paid</p>

                <p className={`mt-2 text-2xl font-bold ${theme.text}`}>
                  ₹{registration.totalFee}
                </p>
              </div>

              {/* Payment Status */}

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">Payment Status</p>

                <div className="mt-3 inline-flex items-center rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700">
                  <CreditCard size={16} className="mr-2" />
                  Pending Verification
                </div>
              </div>
              {/* Registration Date / Selected Theme */}

              {registration.eventType === "astromodeler" ? (
                <>
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={18} className={theme.text} />

                      <p className="text-sm text-slate-500">
                        Registration Date
                      </p>
                    </div>

                    <p className="mt-3 text-lg font-semibold">
                      {new Date().toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm text-slate-500">Selected Theme</p>

                    <div className="mt-3">
                      <p className={`text-lg font-bold ${theme.text}`}>
                        {selectedTheme?.title || "-"}
                      </p>

                      {selectedTheme?.subtitle && (
                        <p className="mt-1 text-sm text-slate-500">
                          {selectedTheme.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-slate-200 p-5 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={18} className={theme.text} />

                    <p className="text-sm text-slate-500">Registration Date</p>
                  </div>

                  <p className="mt-3 text-lg font-semibold">
                    {new Date().toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
        {/* Action Buttons */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-10 flex flex-col gap-6 lg:flex-row"
        >
          {/* Download */}

          <button
            onClick={downloadAcknowledgement}
            disabled={isDownloading}
            className={`
      flex-1
      rounded-3xl
      bg-gradient-to-r
      ${theme.gradient}
      px-8
      py-5
      text-white
      shadow-xl
      transition-all
      duration-300
      ${
        isDownloading
          ? "opacity-60 cursor-not-allowed"
          : "hover:scale-[1.02] hover:shadow-2xl"
      }
    `}
          >
            <div className="flex items-center justify-center gap-3">
              <Download size={22} />

              <div className="text-left">
                <p className="text-lg font-bold">
                  {isDownloading
                    ? "Downloading..."
                    : "Download Acknowledgement"}
                </p>

                <p className="text-sm text-white/80">
                  Download your registration acknowledgement
                </p>
              </div>
            </div>
          </button>

          {/* Home */}

          <button
            onClick={() => navigate("/space-day")}
            disabled={isDownloading}
            className={`
    rounded-3xl
    border
    ${theme.border}
    bg-white
    px-8
    py-5
    transition
    ${isDownloading ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg"}
  `}
          >
            <div className="flex items-center justify-center gap-3">
              <Home className={theme.text} size={22} />

              <div className="text-left">
                <p className={`font-bold ${theme.text}`}>Back to Space Day</p>

                <p className="text-sm text-slate-500">Return to event page</p>
              </div>
            </div>
          </button>
        </motion.div>
        {/* What's Next */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg"
        >
          <h3 className="text-2xl font-bold text-slate-900">
            What Happens Next?
          </h3>

          <div className="mt-8 space-y-5">
            <div className="flex items-start gap-4">
              <div
                className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r ${theme.gradient} text-white font-bold`}
              >
                1
              </div>

              <div>
                <p className="font-semibold">Payment Verification</p>

                <p className="text-slate-600">
                  Our team will verify your payment details and uploaded
                  screenshot.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div
                className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r ${theme.gradient} text-white font-bold`}
              >
                2
              </div>

              <div>
                <p className="font-semibold">Registration Confirmation</p>

                <p className="text-slate-600">
                  Once verified, your registration status will be confirmed by
                  the organizing committee.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div
                className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r ${theme.gradient} text-white font-bold`}
              >
                3
              </div>

              <div>
                <p className="font-semibold">Event Participation</p>

                <p className="text-slate-600">
                  Please carry your Registration ID during reporting at the
                  event venue.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
