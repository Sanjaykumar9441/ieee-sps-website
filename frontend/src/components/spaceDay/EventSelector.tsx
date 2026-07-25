import { motion } from "framer-motion";
import { ArrowRight, Clock, Users } from "lucide-react";
import { registrationEvents } from "./registrationEvents";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { eventThemes } from "./registration/eventTheme";
import { EventType } from "./registration/types";

interface EventSelectorProps {
  onSelect: (eventId: EventType) => void;
}
export default function EventSelector({ onSelect }: EventSelectorProps) {
  const navigate = useNavigate();
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <button
          onClick={() => navigate("/space-day")}
          className="mb-10 flex items-center gap-2 text-[#00629B] hover:text-[#004f7d] font-medium transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Space Day
        </button>
        {/* Heading */}

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="uppercase tracking-[0.25em] text-[#00629B] font-semibold">
            Registration
          </p>

          <h2 className="mt-4 text-4xl md:text-5xl font-bold text-slate-900">
            Choose Your Event
          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-slate-600 leading-8">
            Select the event you wish to participate in. Each event has its own
            registration process and participation requirements.
          </p>
        </motion.div>

        {/* Cards */}

        <div className="grid lg:grid-cols-3 gap-8 mt-16">
          {registrationEvents.map((event, index) => {
            const Icon = event.icon;
            const theme = eventThemes[event.id];
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{
                  y: -8,
                }}
                className={`
  relative
  overflow-hidden
  group
  rounded-3xl
  border
  bg-white
  p-8
  shadow-sm
  transition-all
  duration-300
  hover:shadow-2xl
  ${theme.hoverBorder}
`}
              >
                <div
                  className={`absolute left-0 top-0 h-2 w-full bg-gradient-to-r ${theme.gradient}`}
                />
                {/* Icon */}

                <div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${theme.gradient} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="w-10 h-10 text-white" />
                </div>

                {/* Title */}

                <h3 className="mt-8 text-3xl font-bold text-slate-900">
                  {event.title}
                </h3>

                <p className={`mt-2 font-medium ${theme.text}`}>
                  {event.subtitle}
                </p>

                {/* Description */}

                <p className="mt-6 text-slate-600 leading-7">
                  {event.description}
                </p>

                <div className="my-6 border-t border-slate-200 pt-4">
                  <button
                    onClick={() => navigate("/space-day#guidelines")}
                    className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
                  >
                    <BookOpen size={16} />
                    View Full Guidelines
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Info */}

                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Participation</span>

                    <span className="font-semibold text-slate-800">
                      {event.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Users className="w-4 h-4" />
                      Team Size
                    </span>

                    <span className="font-semibold text-slate-800">
                      {event.team}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-4 h-4" />
                      Duration
                    </span>

                    <span className="font-semibold text-slate-800">
                      {event.duration}
                    </span>
                  </div>
                </div>

                {/* Button */}

                <button
                  onClick={() => onSelect(event.id)}
                  className={`
  mt-10
  flex
  w-full
  items-center
  justify-center
  gap-2
  rounded-xl
  bg-gradient-to-r
  ${theme.gradient}
  py-4
  font-semibold
  text-white
  shadow-lg
  transition-all
  duration-300
  hover:scale-[1.02]
  hover:shadow-xl
`}
                >
                  Register Now
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
