import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

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
    <>
      <Navbar />

      <div className="min-h-screen bg-[#F8FAFC] pt-32 pb-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto mb-16"
        >
          <button
            onClick={() => window.history.back()}
            className="mb-8 inline-flex items-center gap-2 text-[#00629B] font-medium hover:gap-3 transition-all"
          >
            ← Back to Home
          </button>
          <span className="text-[#00629B] font-semibold uppercase tracking-wider text-sm">
            IEEE SPS Events
          </span>

          <h1 className="mt-4 text-4xl lg:text-5xl font-bold text-slate-900">
            All Events &
            <span className="block text-[#00629B]">Technical Programs</span>
          </h1>

          <p className="mt-6 text-lg text-slate-600 max-w-2xl">
            Explore workshops, competitions, seminars, and technical programs
            organized by IEEE SPS Aditya University.
          </p>
          <p className="mt-4 text-[#00629B] font-semibold">
            Total Events: {events.length}
          </p>
        </motion.div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
          {events.map((event) => (
            <div
              key={event._id}
              className="
bg-white
border
border-slate-200
rounded-2xl
p-8
h-full
shadow-sm
hover:shadow-lg
hover:-translate-y-1
transition-all
duration-300
"
            >
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full
              ${
                event.status === "Upcoming"
                  ? "bg-blue-50 text-[#00629B]"
                  : "bg-slate-100 text-slate-700"
              }`}
              >
                {event.status}
              </span>

              <h3 className="text-2xl font-bold text-slate-900 mt-5 min-h-[96px]">
                {event.title}
              </h3>

              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-slate-500 mt-4 text-sm">
                <span>📅 {formatDate(event.date)}</span>
                <span>📍 {event.location}</span>
              </div>

              <Link
                to={
                  event.pageType === "custom" && event.customPage
                    ? `/${event.customPage}`
                    : `/event/${event._id}`
                }
                className="
mt-6
inline-flex
items-center
gap-2
text-[#00629B]
font-semibold
hover:gap-3
transition-all
"
              >
                View Event →
              </Link>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default AllEvents;
