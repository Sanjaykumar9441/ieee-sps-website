import { motion } from "framer-motion";
import {
  Rocket,
  Brain,
  Users,
  Satellite,
} from "lucide-react";

const objectives = [
  {
    icon: Rocket,
    title: "Inspire Innovation",
    description:
      "Encourage students to explore space science, satellite technology, aerospace engineering, and future innovations through engaging activities.",
  },
  {
    icon: Brain,
    title: "Knowledge Sharing",
    description:
      "Learn from experts through keynote talks, technical sessions, and discussions on emerging space technologies.",
  },
  {
    icon: Users,
    title: "Collaboration",
    description:
      "Promote teamwork, leadership, and networking among students from different disciplines and institutions.",
  },
  {
    icon: Satellite,
    title: "Future Technologies",
    description:
      "Discover how AI, IoT, Robotics, Signal Processing, and Embedded Systems contribute to modern space exploration.",
  },
];

export default function Objectives() {
  return (
    <section className="py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: .5 }}
          className="text-center"
        >
          <p className="uppercase tracking-[0.25em] text-[#00629B] font-semibold">
            Objectives
          </p>

          <h2 className="mt-4 text-4xl md:text-5xl font-bold text-slate-900">
            What You'll Experience
          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-slate-600 leading-8">
            National Space Day is designed to encourage innovation,
            technical excellence, and curiosity by connecting students
            with India's achievements in space science and emerging
            technologies.
          </p>
        </motion.div>

        {/* Cards */}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8 mt-20">

          {objectives.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: .5,
                delay: index * .15,
              }}
              whileHover={{
                y: -8,
              }}
              className="group rounded-3xl bg-white border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-[#00629B] transition-all">

                <item.icon
                  size={30}
                  className="text-[#00629B] group-hover:text-white transition"
                />

              </div>

              <h3 className="mt-8 text-2xl font-bold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-5 text-slate-600 leading-8">
                {item.description}
              </p>
            </motion.div>
          ))}

        </div>

      </div>
    </section>
  );
}