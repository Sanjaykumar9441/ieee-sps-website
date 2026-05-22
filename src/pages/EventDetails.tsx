import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const EventDetails = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    fetchEvent();
  }, []);

  const fetchEvent = async () => {
    const res = await axios.get(
      `https://ieee-sps-website.onrender.com/events/${id}`,
    );
    setEvent(res.data);
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-200px] left-[-100px] h-[500px] w-[500px] rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute bottom-[-200px] right-[-100px] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <section className="relative z-10 px-6 py-28">
        <div className="max-w-6xl mx-auto">
          {/* TOP BADGE */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl mb-8">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />

            <span className="text-sm text-white/80">IEEE SPS Event</span>
          </div>

          {/* TITLE */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight max-w-5xl mb-10">
            {event.title}
          </h1>

          {/* META */}
          <div className="flex flex-wrap items-center gap-4 mb-12">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium border
            ${
              event.status === "Upcoming"
                ? "bg-indigo-500/20 border-indigo-500/20 text-indigo-200"
                : "bg-pink-500/20 border-pink-500/20 text-pink-200"
            }`}
            >
              {event.status}
            </span>

            <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm">
              📅 {event.date}
            </div>

            <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm">
              📍 {event.location}
            </div>
          </div>

          {/* DESCRIPTION CARD */}
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-10 mb-20">
            {/* CARD GLOW */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-indigo-500/5" />

            <div className="relative z-10">
              <h2 className="text-2xl font-semibold mb-6">About This Event</h2>

              <p className="text-white/70 leading-9 text-lg whitespace-pre-line">
                {event.description}
              </p>
            </div>
          </div>

          {/* GALLERY */}
          {event.images && event.images.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-bold">Event Gallery</h2>

                <div className="h-[1px] flex-1 ml-8 bg-gradient-to-r from-white/20 to-transparent" />
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {event.images.map((img: string, index: number) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] backdrop-blur-xl"
                  >
                    {/* IMAGE */}
                    <div className="overflow-hidden">
                      <img
                        src={img}
                        alt="Event"
                        className="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>

                    {/* OVERLAY */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                    {/* HOVER GLOW */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-pink-500/10" />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default EventDetails;
