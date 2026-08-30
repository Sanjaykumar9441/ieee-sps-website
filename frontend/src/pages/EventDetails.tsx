import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, CheckCircle } from "lucide-react";

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);

  useEffect(() => { fetchEvent(); }, []);

  const fetchEvent = async () => {
    const res = await axios.get(`VITE_API_URL/events/${id}`);
    setEvent(res.data);
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-[#00629B] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading event...</span>
        </div>
      </div>
    );
  }

  const isUpcoming = event.status === "Upcoming";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <section className="px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto">

          {/* BACK */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[#00629B] text-sm font-medium mb-8 hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </motion.button>

          {/* HERO CARD */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden mb-4 shadow-sm"
          >
            {/* Top accent stripe */}
            <div className={`h-1 w-full ${isUpcoming ? "bg-[#00629B]" : "bg-slate-300"}`} />

            <div className="p-6 sm:p-8">
              {/* IEEE chip */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-[#0C447C] text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00629B]" />
                IEEE SPS Event
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-6">
                {event.title}
              </h1>

              {/* Meta pills */}
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
                  isUpcoming
                    ? "bg-blue-50 text-[#0C447C] border-blue-100"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  {event.status}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(event.date)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  <MapPin className="w-3.5 h-3.5" />
                  {event.location}
                </span>
              </div>
            </div>
          </motion.div>

          {/* QUICK STATS (optional fields) */}
          {(event.duration || event.mode) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-2 gap-3 mb-4"
            >
              {event.duration && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Duration</p>
                  <p className="text-sm font-semibold text-slate-800">{event.duration}</p>
                </div>
              )}
              {event.mode && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Mode</p>
                  <p className="text-sm font-semibold text-slate-800">{event.mode}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ABOUT */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 mb-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
              About this event
            </p>
            <p className="text-slate-600 text-base leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </motion.div>

          {/* GALLERY */}
          {event.images && event.images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">Event gallery</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {event.images.map((img: string, i: number) => (
                  <div
                    key={i}
                    className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${
                      i === 0 ? "col-span-2 sm:col-span-2" : ""
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Event photo ${i + 1}`}
                      className="w-full h-48 sm:h-56 object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </section>
    </div>
  );
};

export default EventDetails;