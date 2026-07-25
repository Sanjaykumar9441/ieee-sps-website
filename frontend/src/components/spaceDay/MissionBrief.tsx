import { motion } from "framer-motion";
import {
  Rocket,
  Users,
  CalendarDays,
  MapPin,
} from "lucide-react";

export default function MissionBrief() {
  const details = [
    {
      icon: CalendarDays,
      title: "Event Date",
      value: "23 August 2026",
    },
    {
      icon: MapPin,
      title: "Venue",
      value: "Aditya University",
    },
    {
      icon: Users,
      title: "Participants",
      value: "Students from Various Departments",
    },
    {
      icon: Rocket,
      title: "Theme",
      value: "Exploring Beyond Boundaries",
    },
  ];

  return (
    <section
      id="about"
      className="py-24 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Section Heading */}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-[#00629B] font-semibold uppercase tracking-[0.2em]">
            Mission Brief
          </p>

          <h2 className="mt-4 text-4xl font-bold text-slate-900">
            Celebrating India's Journey into Space
          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-slate-600 leading-8">
            National Space Day celebrates India's remarkable achievements
            in space science and inspires students to explore careers
            in space technology, research, satellite communication,
            artificial intelligence, robotics, and aerospace engineering.
          </p>
        </motion.div>

        {/* Content */}

        <div className="grid lg:grid-cols-2 gap-12 mt-20">

          {/* Left */}

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="rounded-3xl bg-[#F8FAFC] p-10 border border-slate-200">

              <Rocket
                className="text-[#00629B]"
                size={42}
              />

              <h3 className="mt-6 text-2xl font-bold">
                Why National Space Day?
              </h3>

              <p className="mt-5 text-slate-600 leading-8">
                The event aims to ignite curiosity among students by
                showcasing India's space missions, innovations, and
                technological advancements. Participants will gain
                insights through expert talks, interactive sessions,
                exhibitions, and engaging activities that connect
                academic learning with real-world space exploration.
              </p>
            </div>
          </motion.div>

          {/* Right */}

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 gap-6"
          >
            {details.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white shadow-sm p-8 hover:shadow-lg transition"
              >
                <item.icon
                  size={34}
                  className="text-[#00629B]"
                />

                <h4 className="mt-5 font-semibold text-slate-900">
                  {item.title}
                </h4>

                <p className="mt-2 text-slate-600">
                  {item.value}
                </p>
              </div>
            ))}
          </motion.div>

        </div>

      </div>
    </section>
  );
}