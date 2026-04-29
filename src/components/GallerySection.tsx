import { useState } from "react";
import { motion } from "framer-motion";

const GallerySection = () => {
  const [activeDay, setActiveDay] = useState("day1");

  const galleryData: any = {
    day1: [
      "/gallery/day1/img1.jpg",
      "/gallery/day1/img2.jpg",
      "/gallery/day1/img3.jpg",
    ],
    day2: [
      "/gallery/day2/img1.jpg",
      "/gallery/day2/img2.jpg",
    ],
    day3: [
      "/gallery/day3/img1.jpg",
      "/gallery/day3/img2.jpg",
    ],
  };

  return (
    <section id="gallery" className="py-16 px-6 bg-background text-foreground">
      <div className="max-w-6xl mx-auto">

        {/* 🔥 Title */}
        <h2 className="text-3xl md:text-5xl text-center font-semibold mb-10">
          Gallery
        </h2>

        {/* 🎥 YouTube Video */}
        <div className="mb-12">
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
              title="YouTube video"
              allowFullScreen
            />
          </div>
        </div>

        {/* 🔘 Tabs */}
        <div className="flex justify-center gap-4 mb-10">
          {["day1", "day2", "day3"].map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${activeDay === day
                  ? "bg-cyan-500 text-white"
                  : "bg-gray-200 dark:bg-white/10"
                }`}
            >
              {day.toUpperCase()}
            </button>
          ))}
        </div>

        {/* 🖼️ Images Grid */}
        <motion.div
          key={activeDay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {galleryData[activeDay].map((img: string, index: number) => (
            <img
              key={index}
              src={img}
              alt="gallery"
              className="rounded-lg object-cover w-full h-40 md:h-56 hover:scale-105 transition duration-300"
            />
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default GallerySection;