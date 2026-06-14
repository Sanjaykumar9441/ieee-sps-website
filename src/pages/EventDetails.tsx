import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

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
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => window.history.back()}
            className="
  mb-8
  text-[#00629B]
  font-medium
  hover:underline
  "
          >
            ← Back to Events
          </button>
          {/* TOP BADGE */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-[#00629B] font-medium mb-8">
            <div className="w-2 h-2 rounded-full bg-[#00629B]" />

            <span className="text-sm">IEEE SPS Event</span>
          </div>

          {/* TITLE */}
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight max-w-5xl mb-10">
            {event.title}
          </h1>

          {/* META */}
          <div className="flex flex-wrap items-center gap-4 mb-12">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium border
            ${
              event.status === "Upcoming"
                ? "bg-blue-50 text-[#00629B] border-blue-100"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }`}
            >
              {event.status}
            </span>

            <div className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm">
              📅 {formatDate(event.date)}
            </div>

            <div className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm">
              📍 {event.location}
            </div>
          </div>

          {/* DESCRIPTION CARD */}
          <div
            className="relative overflow-hidden bg-white
border
border-slate-200
rounded-2xl
shadow-sm
p-10 mb-20"
          >
            <h2 className="text-2xl font-semibold mb-6 text-slate-900">
              About This Event
            </h2>

            <p className="text-slate-600 leading-8 text-lg whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* GALLERY */}
          {event.images && event.images.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-bold text-slate-900">
                  Event Gallery
                </h2>

                <div className="h-[1px] flex-1 ml-8 bg-slate-200" />
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {event.images.map((img: string, index: number) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-2xl
border
border-slate-200
bg-white
shadow-sm
hover:shadow-lg
transition"
                  >
                    {/* IMAGE */}
                    <div className="overflow-hidden">
                      <img
                        src={img}
                        alt="Event"
                        className="
h-72
w-full
object-cover
transition-transform
duration-500
group-hover:scale-105
"
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
