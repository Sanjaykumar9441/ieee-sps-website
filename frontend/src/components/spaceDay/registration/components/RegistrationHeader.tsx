import { ArrowLeft } from "lucide-react";
import { registrationConfig } from "../registrationConfig";
import { EventType } from "../types";
import { eventThemes } from "../eventTheme";

interface RegistrationHeaderProps {
  eventType: EventType;
  onBack: () => void;
}

export default function RegistrationHeader({
  eventType,
  onBack,
}: RegistrationHeaderProps) {
  const config = registrationConfig[eventType];
  const theme = eventThemes[eventType];

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Top Gradient */}
      <div className={`h-2 w-full bg-gradient-to-r ${theme.gradient}`} />

      <div className="px-6 py-5">
        {/* Back Button */}
        <button
          onClick={onBack}
          className={`flex items-center gap-2 ${theme.text} text-sm font-medium transition-colors hover:opacity-80`}
        >
          <ArrowLeft size={16} />
          Back to Events
        </button>

        {/* Header */}
        <div className="mt-4 flex items-center justify-between gap-5">
          <div>
            <span
              className={`inline-flex rounded-full ${theme.light} px-2.5 py-1 text-xs font-semibold ${theme.text}`}
            >
              {config.type === "team" ? "Team Event" : "Individual Event"}
            </span>

            <h1 className="mt-3 text-3xl font-extrabold text-slate-900">
              {config.title}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Complete the registration by filling in your details and reviewing
              your submission before payment.
            </p>
          </div>

          {/* Fee Card */}
          <div
            className={`rounded-xl border ${theme.border} ${theme.light} px-5 py-3 text-center`}
          >
            <p className="text-sm text-slate-500">Registration Fee</p>

            <p className={`mt-1 text-2xl font-bold ${theme.text}`}>
              ₹{config.eventFee}
            </p>

            <p className="text-sm text-slate-500">
              {config.feeType === "team" ? "Per Team" : "Per Participant"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
