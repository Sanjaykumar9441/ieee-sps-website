import { motion } from "framer-motion";
import {
  Mic2,
  Rocket,
  Trophy,
  Users,
  Award,
  Lightbulb,
} from "lucide-react";

const highlights = [
  {
    icon: Mic2,
    title: "Expert Sessions",
    description:
      "Learn from researchers, academicians, and industry experts working in space science and emerging technologies.",
  },
  {
    icon: Rocket,
    title: "Space Technology Showcase",
    description:
      "Discover exciting innovations in satellites, launch vehicles, robotics, AI, and aerospace engineering.",
  },
  {
    icon: Trophy,
    title: "Technical Competitions",
    description:
      "Participate in quizzes, poster presentations, technical challenges, and innovation-based activities.",
  },
  {
    icon: Users,
    title: "Networking",
    description:
      "Connect with faculty members, professionals, IEEE volunteers, and like-minded students.",
  },
  {
    icon: Award,
    title: "Certificates & Recognition",
    description:
      "Receive participation certificates and exciting prizes for outstanding performances.",
  },
  {
    icon: Lightbulb,
    title: "Innovation & Inspiration",
    description:
      "Experience how modern technologies contribute to future space missions and scientific discoveries.",
  },
];

export default function Highlights() {
  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: .6 }}
          className="text-center"
        >
          <p className="uppercase tracking-[0.25em] text-[#00629B] font-semibold">
            Event Highlights
          </p>

          <h2 className="mt-4 text-4xl md:text-5xl font-bold text-slate-900">
            A Day Filled with Learning & Innovation
          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-slate-600 leading-8">
            Explore inspiring talks, interactive experiences, technical
            activities, and opportunities that celebrate India's remarkable
            achievements in space science and technology.
          </p>
        </motion.div>

        {/* Cards */}

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8 mt-20">

          {highlights.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: .5,
                delay: index * .08,
              }}
              whileHover={{
                y: -8,
                scale: 1.02,
              }}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-[#F8FAFC] p-8 transition-all hover:shadow-xl"
            >
              {/* Decorative Circle */}

              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-100 opacity-30 group-hover:scale-150 transition duration-500" />

              {/* Icon */}

              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00629B] text-white shadow-lg">
                <item.icon size={30} />
              </div>

              {/* Content */}

              <div className="relative z-10 mt-8">
                <h3 className="text-2xl font-bold text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-4 leading-8 text-slate-600">
                  {item.description}
                </p>
              </div>

              {/* Bottom Line */}

              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-[#00629B]"
                initial={{ width: 0 }}
                whileHover={{ width: "100%" }}
                transition={{ duration: .3 }}
              />
            </motion.div>
          ))}

        </div>

      </div>
    </section>
  );
}