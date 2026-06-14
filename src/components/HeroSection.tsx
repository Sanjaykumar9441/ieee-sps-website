import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section
      id="home"
      className="bg-white min-h-screen lg:min-h-screen flex items-center"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* IEEE Badge */}
            <div className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-4 py-2 mb-6">
              <span className="text-sm font-semibold text-[#00629B]">
                Electronics & Communication Engineering
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight text-slate-900">
              Empowering Future
              <span className="block text-[#00629B]">Innovators</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
              IEEE SPS Student Branch Chapter at Aditya University fosters
              excellence in Signal Processing, Artificial Intelligence, Machine
              Learning, Research, and Technical Innovation through impactful
              events, workshops, and collaborative learning.
            </p>

            {/* Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href="https://forms.office.com/r/DU2j5CXpd2"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#00629B] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#00517f] transition"
              >
                Join SPS
              </a>

              <a
                href="#events"
                className="border border-slate-300 text-slate-700 px-8 py-4 rounded-xl font-semibold hover:bg-slate-50 transition"
              >
                Explore Events
              </a>
            </div>

            {/* Stats */}
            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-2xl font-bold text-[#00629B]">20+</h3>
                <p className="text-sm text-slate-500 mt-1">Members</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-2xl font-bold text-[#00629B]">10+</h3>
                <p className="text-sm text-slate-500 mt-1">Events</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-2xl font-bold text-[#00629B]">5+</h3>
                <p className="text-sm text-slate-500 mt-1">Workshops</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-2xl font-bold text-[#00629B]">100%</h3>
                <p className="text-sm text-slate-500 mt-1">Innovation</p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT IMAGE */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative">
              <img
                src="/ieeeteam.jpg"
                alt="IEEE SPS Team"
                className="w-full rounded-3xl shadow-xl object-cover"
              />

              <div
                className="
  absolute
  bottom-4
  left-4
  bg-white
  shadow-lg
  rounded-2xl
  px-4
  py-3
  border
  max-w-[250px]
"
              >
                <p className="text-sm text-slate-500">
                  IEEE SPS Student Branch Chapter
                </p>
                <h4 className="font-bold text-slate-900">Aditya University</h4>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
