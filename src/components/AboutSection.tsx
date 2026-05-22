import { motion } from "framer-motion";
import {
  Signal,
  Brain,
  Users,
  Award,
} from "lucide-react";

const features = [
  {
    icon: Signal,
    title: "Signal Processing",
    description:
      "Exploring modern DSP, image processing, and communication systems.",
  },
  {
    icon: Brain,
    title: "Artificial Intelligence",
    description:
      "Advancing AI and machine learning applications for real-world innovation.",
  },
  {
    icon: Users,
    title: "Technical Community",
    description:
      "Building a collaborative ecosystem of researchers, students, and innovators.",
  },
  {
    icon: Award,
    title: "Workshops & Events",
    description:
      "Conducting impactful workshops, competitions, and technical programs.",
  },
];

const AboutSection = () => {
  return (
    <section
      id="about"
      className="relative py-32 overflow-hidden bg-background"
    >

      {/* BACKGROUND LIGHTS */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full" />

      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-pink-500/10 blur-[120px] rounded-full" />

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">

        {/* TOP SECTION */}
        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >

            <div className="inline-flex px-4 py-2 rounded-full border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 backdrop-blur-xl text-sm text-foreground/70 mb-6">
              About IEEE SPS
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold leading-tight text-foreground">

              Advancing Research Through

              <span className="block mt-3 bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                Innovation & Collaboration
              </span>
            </h2>

            <p className="mt-8 text-lg leading-relaxed dark:text-slate-300 text-slate-600">
              IEEE Signal Processing Society at Aditya University
              empowers students through advanced technical learning,
              research opportunities, collaborative innovation,
              and industry-driven experiences.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">

              <div className="px-6 py-4 rounded-2xl border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 backdrop-blur-xl">
                <h3 className="text-2xl font-bold text-foreground">
                  20+
                </h3>

                <p className="mt-1 text-sm dark:text-slate-400 text-slate-500">
                  Active Members
                </p>
              </div>

              <div className="px-6 py-4 rounded-2xl border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 backdrop-blur-xl">
                <h3 className="text-2xl font-bold text-foreground">
                  10+
                </h3>

                <p className="mt-1 text-sm dark:text-slate-400 text-slate-500">
                  Technical Events
                </p>
              </div>

            </div>

          </motion.div>

          {/* RIGHT */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >

            {/* GLASS PANEL */}
            <div className="relative rounded-[40px] border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 backdrop-blur-2xl p-10 overflow-hidden shadow-2xl">

              {/* PANEL GLOW */}
              <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-white/10 to-transparent" />

              {/* ORBS */}
              <div className="absolute top-10 right-10 w-28 h-28 rounded-full bg-indigo-500/20 blur-3xl" />

              <div className="absolute bottom-10 left-10 w-32 h-32 rounded-full bg-pink-500/20 blur-3xl" />

              {/* CONTENT */}
              <div className="relative z-10">

                <h3 className="text-3xl font-bold text-foreground">
                  Our Mission
                </h3>

                <p className="mt-6 dark:text-slate-300 text-slate-600 leading-relaxed">
                  To inspire students toward innovation in signal
                  processing, artificial intelligence, and emerging
                  technologies through impactful technical programs,
                  research initiatives, and collaborative learning.
                </p>

                <div className="mt-10 grid grid-cols-2 gap-5">

                  <div className="rounded-2xl border dark:border-white/10 border-black/5 bg-black/20 p-5">
                    <h4 className="text-foreground font-semibold">
                      Research
                    </h4>

                    <p className="mt-2 text-sm dark:text-slate-400 text-slate-500">
                      Encouraging innovation and technical exploration.
                    </p>
                  </div>

                  <div className="rounded-2xl border dark:border-white/10 border-black/5 bg-black/20 p-5">
                    <h4 className="text-foreground font-semibold">
                      Community
                    </h4>

                    <p className="mt-2 text-sm dark:text-slate-400 text-slate-500">
                      Building strong collaborative technical networks.
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </motion.div>

        </div>

        {/* FEATURE GRID */}
        <div className="mt-28 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
              }}
              viewport={{ once: true }}
              className="group relative"
            >

              <div className="h-full rounded-[30px] border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 backdrop-blur-2xl p-8 transition-all duration-500 hover:-translate-y-2 hover:border-indigo-500/30">

                {/* ICON */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-pink-500/20 flex items-center justify-center border dark:border-white/10 border-black/5">

                  <feature.icon className="w-7 h-7 text-foreground" />

                </div>

                {/* TITLE */}
                <h3 className="mt-8 text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>

                {/* DESCRIPTION */}
                <p className="mt-4 dark:text-slate-400 text-slate-500 leading-relaxed">
                  {feature.description}
                </p>

              </div>

            </motion.div>
          ))}

        </div>

      </div>
    </section>
  );
};

export default AboutSection;