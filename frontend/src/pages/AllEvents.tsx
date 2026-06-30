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

          <p className="hidden md:block mt-6 text-lg text-slate-600 max-w-2xl">
            Explore workshops, competitions, seminars, and technical programs
            organized by IEEE SPS Aditya University.
          </p>
          <p className="mt-4 text-[#00629B] font-semibold">
            Total Events: {events.length}
          </p>
        </motion.div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event, index) => {
            const isUpcoming = event.status === "Upcoming";

            return (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="w-full"
              >
                {" "}
                <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                  {/* TOP STRIPE */}
                  <div
                    className={`h-1 ${
                      isUpcoming ? "bg-[#00629B]" : "bg-slate-200"
                    }`}
                  />
                  {/* BODY */}
                  <div className="flex flex-col gap-4 p-6 flex-1">
                    {/* DATE + STATUS */}
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
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 leading-snug flex-1">
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

                    <Link
                      to={
                        event.pageType === "custom" && event.customPage
                          ? `/${event.customPage}`
                          : `/event/${event._id}`
                      }
                      className="flex items-center gap-1.5 text-[#00629B] text-sm font-semibold hover:gap-2.5 transition-all"
                    >
                      View Event →
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default AllEvents;
