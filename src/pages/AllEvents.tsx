import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const AllEvents = () => {

  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const res = await axios.get("https://ieee-sps-website.onrender.com/events");
    setEvents(res.data);
  };

  return (
    <div className="min-h-screen p-20 text-white">

      <h1 className="text-4xl mb-10">All Events</h1>

      <div className="space-y-6">

        {events.map((event) => (

          <div
            key={event._id}
            className="border border-white/20 p-6 rounded-2xl bg-white/5"
          >

            <span className={`text-xs px-3 py-1 rounded-full
              ${event.status === "Upcoming"
                ? "bg-cyan-600"
                : "bg-green-600"}`}>
              {event.status}
            </span>

            <h3 className="text-xl mt-3">{event.title}</h3>

            <div className="flex justify-between text-gray-400 mt-2 text-sm">
              <span>📅 {event.date}</span>
              <span>📍 {event.location}</span>
            </div>

            <Link
              to={`/event/${event._id}`}
              className="text-blue-400 underline mt-4 inline-block"
            >
              View Details →
            </Link>

          </div>

        ))}

      </div>
    </div>
  );
};

export default AllEvents;
