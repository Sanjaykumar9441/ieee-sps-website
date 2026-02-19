import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const EventsSection = () => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/events");
      setEvents(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const visibleEvents = events.slice(0, 4);

  return (
    <section id="events" className="py-16 px-6 bg-black text-white">

      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold mb-4">Events</h2>
          <div className="w-16 h-[2px] bg-cyan-400 mx-auto" />
        </div>

        {/* Events */}
        <div className="space-y-6">

          {visibleEvents.map((event) => (

            <div
              key={event._id}
              className="relative group rounded-xl p-[1px] transition-all duration-300"
            >

              {/* Soft Glow */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 to-green-500 opacity-0 group-hover:opacity-60 blur-md transition duration-300"></div>

              {/* Card */}
              <div className="relative bg-black border border-white/10 
                              rounded-xl p-5 
                              flex justify-between items-center
                              group-hover:border-cyan-400
                              transition-all duration-300">

                <div>

                  <span
                    className={`text-[10px] px-2 py-1 rounded-full
                    ${event.status === "Upcoming"
                      ? "bg-cyan-600"
                      : "bg-green-600"}`}
                  >
                    {event.status === "Completed"
                      ? "Completed"
                      : "Upcoming"}
                  </span>

                  <h3 className="text-lg font-semibold mt-2">
                    {event.title}
                  </h3>

                  <div className="text-gray-400 text-xs mt-2">
                    📅 {event.date} &nbsp;&nbsp; | &nbsp;&nbsp; 📍 {event.location}
                  </div>

                </div>

                <Link
                  to={`/event/${event._id}`}
                  className="text-cyan-400 text-sm hover:underline"
                >
                  View →
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
