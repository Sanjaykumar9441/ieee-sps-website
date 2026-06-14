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
        "https://ieee-sps-website.onrender.com/events",
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

            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              Explore workshops, seminars, competitions, and technical programs
              organized by IEEE SPS to foster innovation, collaboration, and
              professional growth.
            </p>
          </div>
        </motion.div>
        {/* EVENT GRID */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 place-items-center">
          {visibleEvents.map((event, index) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
              }}
              viewport={{ once: true }}
              className="group relative w-full max-w-[560px]"
            >
              {/* CARD */}
              <div
                className="
group
relative
h-full
bg-white
border
border-slate-200
rounded-2xl
p-8
shadow-sm
hover:shadow-lg
hover:-translate-y-1
transition-all
duration-300
"
              >
                {/* STATUS BADGE */}
                <div className="absolute top-6 right-6 z-20">
                  <span
                    className={`px-4 py-2 rounded-full text-xs font-medium border ${
                      event.status === "Upcoming"
                        ? "bg-blue-50 text-[#00629B] border-blue-100"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {event.status}
                  </span>
                </div>

                {/* CONTENT */}
                <div className="relative z-10 p-8 flex flex-col justify-between h-full">
                  {/* DATE */}
                  <div className="text-sm text-slate-500">
                    {formatDate(event.date)}
                  </div>

                  {/* TITLE */}
                  <h3 className="mt-5 text-xl sm:text-2xl font-bold text-slate-900 leading-snug min-h-[80px] sm:min-h-[96px]">
                    {event.title}
                  </h3>

                  {/* LOCATION */}
                  <div className="mt-4 text-slate-500 text-sm">
                    📍 {event.location}
                  </div>

                  {/* BUTTON */}
                  <button
                    onClick={() =>
                      navigate(
                        event.pageType === "custom" && event.customPage
                          ? `/${event.customPage}`
                          : `/event/${event._id}`,
                      )
                    }
                    className="
  mt-8
  inline-flex
  items-center
  gap-2
  text-[#00629B]
  font-semibold
  hover:gap-3
  transition-all
  "
                  >
                    View Event
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
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
