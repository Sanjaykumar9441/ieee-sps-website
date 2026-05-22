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
        "https://ieee-sps-website.onrender.com/events"
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
    <section
      id="events"
      className="relative py-32 overflow-hidden bg-background"
    >

      {/* BACKGROUND LIGHTS */}
      <div className="absolute top-20 left-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full" />

      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-pink-500/10 blur-[120px] rounded-full" />

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

          <div className="inline-flex px-4 py-2 rounded-full border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 backdrop-blur-xl text-sm text-foreground/70 mb-6">
            Events & Programs
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold leading-tight text-foreground">

            Technical Events That

            <span className="block mt-3 bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              Inspire Innovation
            </span>
          </h2>

          <p className="mt-8 text-lg leading-relaxed dark:text-slate-300 text-slate-600 max-w-2xl">
            IEEE SPS organizes impactful workshops, technical events,
            collaborative programs, and innovation-driven experiences
            for students and researchers.
          </p>

        </motion.div>

        {/* EVENT GRID */}
        <div className="mt- grid lg:grid-cols-2 gap-8">

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
              className="group relative"
            >

              {/* CARD */}
              <div className="relative h-full rounded-[32px] border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 backdrop-blur-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-indigo-500/30">

                {/* TOP GRADIENT */}
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-white/10 to-transparent" />

                {/* STATUS BADGE */}
                <div className="absolute top-6 right-6 z-20">

                  <span
                    className={`px-4 py-2 rounded-full text-xs font-medium border backdrop-blur-xl ${
                      event.status === "Upcoming"
                        ? "bg-indigo-500/10 border-indigo-400/20 text-indigo-300"
                        : "bg-pink-500/10 border-pink-400/20 text-pink-300"
                    }`}
                  >
                    {event.status}
                  </span>

                </div>

                {/* CONTENT */}
                <div className="relative z-10 p-8 flex flex-col h-full">

                  {/* DATE */}
                  <div className="text-sm dark:text-slate-400 text-slate-500">
                    {formatDate(event.date)}
                  </div>

                  {/* TITLE */}
                  <h3 className="mt-5 text-3xl font-bold text-foreground leading-snug">
                    {event.title}
                  </h3>

                  {/* LOCATION */}
                  <div className="mt-4 dark:text-slate-400 text-slate-500 text-sm">
                    📍 {event.location}
                  </div>

                  {/* DESCRIPTION */}
                  <p className="mt-6 dark:text-slate-300 text-slate-600 leading-relaxed flex-grow">
                    Experience innovation, collaboration, and technical
                    excellence through IEEE SPS events and workshops.
                  </p>

                  {/* BUTTON */}
                  <button
                    onClick={() =>
                      navigate(
                        event.title === "Arduino Days 2026"
                          ? "/arduino-days"
                          : `/event/${event._id}`
                      )
                    }
                    className="mt-10 inline-flex items-center gap-3 text-foreground font-medium group/button"
                  >

                    <span className="relative">

                      View Event

                      <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-gradient-to-r from-indigo-400 to-pink-400 transition-all duration-300 group-hover/button:w-full" />

                    </span>

                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/button:translate-x-1" />

                  </button>

                </div>

              </div>

            </motion.div>
          ))}

        </div>

      </div>
    </section>
  );
};

export default EventsSection;