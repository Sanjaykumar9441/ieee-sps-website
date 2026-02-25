import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

const EventDetails = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    fetchEvent();
  }, []);

  const fetchEvent = async () => {
    const res = await axios.get(`https://ieee-sps-website.onrender.com/events/${id}`);
    setEvent(res.data);
  };

  const particlesInit = async (main: any) => {
    await loadFull(main);
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden text-foreground">

      {/* ================= PARTICLES BACKGROUND ================= */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="absolute inset-0 -z-10"
        options={{
          background: { color: "transparent" },
          fpsLimit: 60,
          particles: {
            number: { value: 60 },
            color: { value: "#00ffff" },
            links: {
              enable: true,
              color: "#00ffff",
              distance: 150,
              opacity: 0.3,
              width: 1,
            },
            move: {
              enable: true,
              speed: 1,
            },
            opacity: { value: 0.4 },
            size: { value: 2 },
          },
        }}
      />

      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">

          {/* ===== Header Section ===== */}
          <div className="mb-16 relative">

            {/* Glow Behind Title */}
            <div className="absolute -inset-2 bg-cyan-500/10 blur-2xl rounded-xl"></div>

            <h1 className="relative text-4xl md:text-5xl font-bold mb-6 tracking-wide">
              {event.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-gray-400 text-sm mb-6">

              <span className={`px-3 py-1 rounded-full text-xs font-medium
                ${event.status === "Upcoming"
  ? "bg-primary text-primary-foreground"
  : "bg-green-600 text-white dark:text-white"}`}>
                {event.status}
              </span>

              <span>📅 {event.date}</span>
              <span>📍 {event.location}</span>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 max-w-3xl shadow-sm">
                <p className="text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>

          {/* ===== Gallery Section ===== */}
          {event.images && event.images.length > 0 && (
            <>
              <h2 className="text-2xl font-semibold mb-10">
                Event Gallery
              </h2>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">

                {event.images.map((img: string, index: number) => (
  <div
    key={index}
    className="relative group rounded-xl p-[2px] 
               bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 
               hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] 
               transition-all duration-500"
  >
    <div className="overflow-hidden rounded-xl bg-card">
      <img
        src={img}
        alt="Event"
        className="w-full h-64 object-cover 
                   group-hover:scale-110 
                   transition-transform duration-700"
      />
    </div>
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
