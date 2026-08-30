import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EventsSection = () => {
  const navigate = useNavigate();

  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(
        "VITE_API_URL/events",
      );

      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log(err);
      setEvents([]);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const visibleEvents = events.slice(0, 4);

  return (
    <section id="events" className="scroll-mt-20 py-24 bg-[#F8FAFC]">
      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-3xl"
        >
          <div className="max-w-3xl">
            <span className="text-[#00629B] font-semibold uppercase tracking-wider text-sm">
              Events & Programs
            </span>

            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
              Inspiring Innovation Through
              <span className="block text-[#00629B]">Technical Events</span>
            </h2>

            <p className="hidden md:block mt-6 text-lg text-slate-600 leading-relaxed">
              Explore workshops, seminars, competitions, and technical programs
              organized by IEEE SPS to foster innovation, collaboration, and
              professional growth.
            </p>
          </div>
        </motion.div>
        {/* EVENT GRID */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 place-items-center">
          {visibleEvents.map((event, index) => {
            const isUpcoming = event.status === "Upcoming";
            return (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group w-full max-w-[560px]"
              >
                <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                  {/* TOP STRIPE */}
                  <div
                    className={`h-1 ${isUpcoming ? "bg-[#00629B]" : "bg-slate-200"}`}
                  />

                  {/* BODY */}
                  <div className="flex flex-col gap-3 p-6 flex-1">
                    {/* DATE + BADGE */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-500 tracking-wide">
                        {formatDate(event.date)}
                      </span>
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full ${
                          isUpcoming
                            ? "bg-blue-50 text-[#185FA5]"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>

                    {/* TITLE */}
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug flex-1">
                      {event.title}
                    </h3>

                    {/* LOCATION */}
                    <p className="text-sm text-slate-500">
                      📍 {event.location}
                    </p>
                  </div>

                  {/* FOOTER */}
                  <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between">
                    <span className="text-xs text-slate-400 tracking-wide">
                      IEEE SPS
                    </span>
                    <button
                      onClick={() =>
                        navigate(
                          event.pageType === "custom" && event.customPage
                            ? `/${event.customPage}`
                            : `/event/${event._id}`,
                        )
                      }
                      className="flex items-center gap-1.5 text-[#00629B] text-sm font-semibold hover:gap-2.5 transition-all"
                    >
                      View Event
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-12 flex justify-center">
          <button
            onClick={() => navigate("/all-events")}
            className="
    px-8
    py-3
    rounded-xl
    bg-[#00629B]
    text-white
    font-medium
    hover:bg-[#00517f]
    transition
    "
          >
            View All Events
          </button>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
