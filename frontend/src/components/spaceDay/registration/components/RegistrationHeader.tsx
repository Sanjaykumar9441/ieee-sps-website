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
    <div className="mb-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Top Gradient */}
      <div className={`h-2 w-full bg-gradient-to-r ${theme.gradient}`} />

      <div className="p-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className={`flex items-center gap-2 ${theme.text} font-medium transition-colors hover:opacity-80`}
        >
          <ArrowLeft size={18} />
          Back to Events
        </button>

        {/* Header */}
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span
              className={`inline-flex rounded-full ${theme.light} px-3 py-1 text-sm font-semibold ${theme.text}`}
            >
              {config.type === "team" ? "Team Event" : "Individual Event"}
            </span>

            <h1 className="mt-3 text-4xl font-extrabold text-slate-900">
              {config.title}
            </h1>

            <p className="mt-2 text-slate-600">
              Complete the registration by filling in your details and reviewing
              your submission before payment.
            </p>
          </div>

          {/* Fee Card */}
          <div
            className={`rounded-2xl border ${theme.border} ${theme.light} px-6 py-4 text-center`}
          >
            <p className="text-sm text-slate-500">Registration Fee</p>

            <p className={`mt-1 text-3xl font-bold ${theme.text}`}>
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
