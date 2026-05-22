import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen overflow-hidden bg-background"
    >
      {/* BACKGROUND GRADIENT */}
      <div
        className="absolute inset-0 bg-gradient-to-br dark:from-[#070B14] dark:via-[#0B1120] dark:to-[#111827]
from-[#F8FAFC] via-[#EDE9FE] to-[#EEF2FF]"
      />

      {/* TOP RIGHT GRADIENT */}
      <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />

      {/* BOTTOM LEFT GRADIENT */}
      <div className="absolute bottom-[-200px] left-[-100px] w-[500px] h-[500px] rounded-full bg-pink-500/20 blur-[120px]" />

      {/* GRID OVERLAY */}
      <div
        className="absolute inset-0 dark:opacity-[0.04] opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* MAIN CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* TITLE */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight text-foreground">
              Empowering
              <span className="block mt-2 bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                Innovation & Research
              </span>
            </h1>

            {/* SUBTEXT */}
            <p className="mt-8 text-lg leading-relaxed dark:text-slate-300 text-slate-600 max-w-lg">
              IEEE SPS Aditya University fosters innovation in signal
              processing, artificial intelligence, machine learning, and
              next-generation technologies through events, research, and
              technical collaboration.
            </p>

            {/* BUTTONS */}
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="https://forms.office.com/r/DU2j5CXpd2"
                target="_blank"
                rel="noopener noreferrer"
                className="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 24">
                  <path d="m18 0 8 12 10-8-4 20H4L0 4l10 8 8-12z"></path>
                </svg>
                Join IEEE SPS
              </a>

              <a
                href="#about"
                className="px-8 py-4 rounded-full border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 backdrop-blur-xl text-foreground hover:bg-white/10 transition-all duration-300"
              >
                Learn More
              </a>
            </div>

            {/* STATS */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg">
              <div>
                <h3 className="text-3xl font-bold text-foreground">20+</h3>
                <p className="mt-2 text-sm dark:text-slate-400 text-slate-500">
                  Active Members
                </p>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-foreground">10+</h3>
                <p className="mt-2 text-sm dark:text-slate-400 text-slate-500">
                  Technical Events
                </p>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-foreground">5+</h3>
                <p className="mt-2 text-sm dark:text-slate-400 text-slate-500">
                  Workshops
                </p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT VISUAL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative hidden lg:flex justify-center items-center"
          >
            <div className="relative w-[540px] h-[540px] flex items-center justify-center">
              {/* OUTER ORBIT */}
              <div className="absolute inset-0 rounded-full border border-white/5" />

              <div className="absolute inset-10 rounded-full border border-indigo-500/10" />

              <div className="absolute inset-20 rounded-full border border-pink-500/10" />

              {/* MAIN GLOW */}
              <div className="absolute w-[320px] h-[320px] rounded-full bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-pink-500/30 blur-3xl" />

              {/* FLOATING GLASS CARD */}
              <motion.div
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 2, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative w-[280px] h-[340px] rounded-[40px] border dark:border-white/10 border-indigo-100 border-black/5 dark:bg-white/5 bg-white/40 backdrop-blur-2xl shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:shadow-2xl overflow-hidden"
              >
                {/* TOP LIGHT */}
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-white/10 to-transparent" />

                {/* SMALL ORBS */}
                <div className="absolute top-10 right-10 w-20 h-20 rounded-full bg-pink-500/30 blur-2xl" />

                <div className="absolute bottom-10 left-10 w-24 h-24 rounded-full bg-indigo-500/30 blur-2xl" />

                {/* CONTENT */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                    <span className="text-3xl font-bold text-foreground">
                      SPS
                    </span>
                  </div>

                  <h3 className="mt-8 text-3xl font-bold text-foreground">
                    IEEE SPS
                  </h3>

                  <p className="mt-5 dark:text-slate-300 text-slate-700 leading-relaxed">
                    Building innovation through signal processing, artificial
                    intelligence, and collaborative research.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* BOTTOM FADE */}
      <div className="absolute bottom-0 left-0 w-full h-40 dark:bg-gradient-to-t dark:from-black dark:via-transparent dark:to-transparent" />
    </section>
  );
};

export default HeroSection;
