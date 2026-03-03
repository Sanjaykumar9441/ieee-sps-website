import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const EventsSection = () => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(
        "https://ieee-sps-website.onrender.com/events"
      );
      setEvents(res.data);
    } catch (err) {
      console.log(err);
    }
  };

//--------------------------------------------------------------------------------------
const temporaryEvent = {
  _id: "arduino-days-temp",
  title: "Arduino Days 2026",
  date: "23–26 March 2026",
  location: "Aditya University, Surampalem",
  status: "Upcoming",
  isTemporary: true
}; // i will delete later
//----------------------------------------------------------------------------------------

  //const visibleEvents = events.slice(0, 4);
   const visibleEvents = [temporaryEvent, ...events].slice(0, 4); // i will delete later
//----------------------------------------------------------------------------------------
  return (
    <section
      id="events"
      className="py-16 px-4 sm:px-6 bg-background text-foreground transition-colors duration-300"
    >
      <div className="max-w-3xl mx-auto">

       {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-semibold tracking-tight mb-4 sm:mb-6">
            Events
          </h2>

          <div className="w-20 h-[2px] bg-primary mx-auto mb-6" />
        </motion.div>

        {/* Events List */}
        <div className="space-y-6">

          {visibleEvents.map((event) => (
  <motion.div
    key={event._id}
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    whileHover={{ scale: 1.02 }}
    className="group relative"
  >

    {/* Glow Background */}
    <div className="absolute -inset-1 rounded-2xl 
                    bg-gradient-to-r 
                    from-cyan-500/30 
                    via-blue-500/30 
                    to-purple-500/30
                    blur-xl opacity-0 
                    group-hover:opacity-100 
                    transition duration-500" />

    {/* Glass Card */}
    <div className="relative 
                    backdrop-blur-xl 
                    bg-white/5 dark:bg-white/5
                    border border-white/20
                    rounded-2xl 
                    p-4 sm:p-6
                    shadow-lg
                    transition-all duration-500">

      {/* Top Section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">

        <div className="flex flex-col gap-3">

  {/* Status Badge */}
  <div>
    <span
      className={`inline-block text-[10px] px-3 py-1 sm:text-xs sm:px-4 sm:py-1.5 rounded-full font-semibold tracking-wide
        ${event.status === "Upcoming"
          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/40"
          : "bg-green-500/20 text-green-400 border border-green-400/40"
        }`}
    >
      {event.status}
    </span>
  </div>

  {/* Title */}
  <h3 className="font-heading text-base sm:text-xl md:text-2xl font-semibold tracking-tight leading-snug">
    {event.title}
  </h3>

          {/* Date & Location */}
          <div className="text-xs sm:text-sm mt-2
                text-gray-600 
                dark:text-white/60 
                flex items-center gap-4 flex-wrap">
  <span className="flex items-center gap-1">
    📅 <span>{event.date}</span>
  </span>

  <span className="flex items-center gap-1">
    📍 <span>{event.location}</span>
  </span>
</div>

        </div>

        {/* View Button */}
        <Link
          to={event.isTemporary ? "/arduino-days" : `/event/${event._id}`}
          className="inline-flex items-center justify-center 
                     px-4 py-2 sm:px-5 sm:py-2.5 rounded-full 
                     text-sm font-medium
                     bg-gradient-to-r from-cyan-500 to-blue-600
                     text-white
                     shadow-lg shadow-cyan-500/30
                     hover:scale-105 hover:shadow-cyan-400/50
                     transition-all duration-300"
        >
          View Details →
        </Link>

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