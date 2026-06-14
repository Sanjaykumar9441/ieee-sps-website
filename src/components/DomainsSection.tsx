import { motion } from "framer-motion";
import {
  Signal,
  Brain,
  Cpu,
  Wifi,
  ScanEye,
  BookOpen,
} from "lucide-react";

const domains = [
  {
    icon: Signal,
    title: "Signal Processing",
    description:
      "Exploring digital signal processing, image processing, speech analysis, and communication systems.",
  },
  {
    icon: Brain,
    title: "Artificial Intelligence",
    description:
      "Building intelligent systems that solve real-world challenges through advanced AI techniques.",
  },
  {
    icon: Cpu,
    title: "Machine Learning",
    description:
      "Developing predictive models and data-driven solutions for modern applications.",
  },
  {
    icon: Wifi,
    title: "IoT Systems",
    description:
      "Connecting devices and enabling smart environments through innovative IoT technologies.",
  },
  {
    icon: ScanEye,
    title: "Computer Vision",
    description:
      "Transforming visual data into meaningful insights using image and video analytics.",
  },
  {
    icon: BookOpen,
    title: "Research & Publications",
    description:
      "Encouraging research culture, technical writing, and publication opportunities.",
  },
];

const DomainsSection = () => {
  return (
    <section id="domains" className="scroll-mt-20 py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-[#00629B] font-semibold uppercase tracking-wider text-sm">
            Our Focus Areas
          </span>

          <h2 className="mt-4 text-4xl lg:text-5xl font-bold text-slate-900">
            Driving Innovation Through
            <span className="block text-[#00629B]">
              Research & Technology
            </span>
          </h2>

          <p className="mt-6 text-lg text-slate-600 leading-relaxed">
            IEEE SPS empowers students through cutting-edge technologies,
            research initiatives, technical events, and industry-oriented learning.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {domains.map((domain, index) => (
            <motion.div
              key={domain.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
              }}
              viewport={{ once: true }}
              className="
              bg-white
              border
              border-slate-200
              rounded-2xl
              p-8
              h-full
              shadow-sm
              hover:shadow-xl
              hover:-translate-y-1
              transition-all
              duration-300
              "
            >
              <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-[#00629B] transition">
                <domain.icon className="w-7 h-7 text-[#00629B] group-hover:text-white transition" />
              </div>

              <h3 className="mt-6 text-xl font-semibold text-slate-900 min-h-[56px]">
                {domain.title}
              </h3>

              <p className="mt-4 text-slate-600 leading-relaxed">
                {domain.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DomainsSection;