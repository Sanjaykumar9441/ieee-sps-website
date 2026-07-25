import { ArrowRight, CheckCircle, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EventGuidelineCardProps {
  event: {
    id: string;
    icon: React.ElementType;
    color: string;
    title: string;
    subtitle: string;
    participation: string;
    team: string;
    fee: string;
    description: string;
    highlights: string[];
    judging: string[];
    themes?: string[];
  };
}

const EventGuidelineCard = ({ event }: EventGuidelineCardProps) => {
  const navigate = useNavigate();

  const Icon = event.icon;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
      {/* Header */}
      <div className={`bg-gradient-to-r ${event.color} p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <Icon size={30} />
          </div>

          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
            {event.fee}
          </span>
        </div>

        <h3 className="mt-6 text-2xl font-bold">{event.title}</h3>

        <p className="mt-1 text-sm text-white/90">{event.subtitle}</p>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        {/* Badges */}
        <div className="mb-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            {event.participation}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            {event.team}
          </span>
        </div>

        {/* Description */}
        <p className="mb-6 text-sm leading-7 text-slate-600">
          {event.description}
        </p>

        {/* Highlights */}
        <div className="mb-6">
          <h4 className="mb-3 text-base font-semibold text-slate-900">
            Highlights
          </h4>

          <div className="space-y-2">
            {event.highlights.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle
                  size={18}
                  className="mt-0.5 text-green-600"
                />

                <span className="text-sm text-slate-600">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {event.themes && (
  <div className="mb-6">
    <h4 className="mb-3 text-base font-semibold text-slate-900">
      Available Themes
    </h4>

    <div className="flex flex-wrap gap-2">
      {event.themes.map((theme) => (
        <span
          key={theme}
          className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700"
        >
          {theme}
        </span>
      ))}
    </div>
  </div>
)}

        {/* Judging */}
        <div className="mb-8">
          <h4 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
            <Trophy size={18} />
            Judging
          </h4>

          <div className="flex flex-wrap gap-2">
            {event.judging.map((item) => (
              <span
                key={item}
                className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Button */}
        <button
          onClick={() => navigate("/space-day/register")}
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Register Now
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default EventGuidelineCard;