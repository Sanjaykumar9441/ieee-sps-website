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
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Events
          </h2>

          <div className="w-20 h-[2px] bg-primary mx-auto mb-6" />
        </motion.div>

        {/* Events List */}
        <div className="space-y-6">

          {visibleEvents.map((event) => (

            <div
              key={event._id}
              className="group relative rounded-xl transition-all duration-300"
            >

              {/* Soft RGB Glow (Subtle in Light Mode) */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-40 
                              blur-xl transition duration-500
                              bg-gradient-to-r from-primary via-secondary to-accent" />

              {/* Card */}
              <div
                className="relative bg-card border border-border 
                           rounded-xl p-5 sm:p-6
                           flex flex-col sm:flex-row 
                           justify-between sm:items-center 
                           gap-4
                           hover:border-primary/60
                           transition-all duration-300"
              >

                <div>

                  {/* Status Badge */}
                  <span
                    className={`text-[11px] px-3 py-1 rounded-full font-medium
                      ${event.status === "Upcoming"
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-accent-foreground"
                      }`}
                  >
                    {event.status}
                  </span>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-semibold mt-3 text-foreground">
                    {event.title}
                  </h3>

                  {/* Date + Location */}
                  <div className="text-muted-foreground text-xs sm:text-sm mt-2">
                    📅 {event.date} &nbsp;&nbsp; | &nbsp;&nbsp; 📍 {event.location}
                  </div>

                </div>

                {/* View Button */}
               {/*------------------------------------------------------------------------- i will delete later*/}  
                <Link
                  //to={`/event/${event._id}`}
                  to={event.isTemporary ? "/arduino-days" : `/event/${event._id}`} // i will delete later
                  className="inline-block text-sm px-4 py-2 rounded-full 
                             border border-primary/50 text-primary
                             hover:bg-primary hover:text-primary-foreground
                             transition-all duration-300"
                >
                {/*-------------------------------------------------------------------------*/}
                  View Details →
                </Link>

              </div>
            </div>

          ))}

        </div>

      </div>
    </section>
  );
};

export default EventsSection;