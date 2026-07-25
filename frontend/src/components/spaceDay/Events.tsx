import { motion } from "framer-motion";
import {
  Rocket,
  Brain,
  Trophy,
  Wrench,
  Satellite,
  Lightbulb,
} from "lucide-react";

const events = [
  {
    icon: Rocket,
    title: "Technical Sessions",
    description:
      "Expert talks and technical sessions will be announced soon.",
  },
  {
    icon: Brain,
    title: "Interactive Activities",
    description:
      "Exciting hands-on activities will be revealed shortly.",
  },
  {
    icon: Trophy,
    title: "Competitions",
    description:
      "Technical competitions and challenges are coming soon.",
  },
  {
    icon: Wrench,
    title: "Workshop",
    description:
      "Workshop details will be published soon.",
  },
  {
    icon: Satellite,
    title: "Space Exhibition",
    description:
      "Exhibition details will be updated soon.",
  },
  {
    icon: Lightbulb,
    title: "Innovation Showcase",
    description:
      "Student innovation showcase information will be available soon.",
  },
];

export default function Events() {
  return (
    <section id="events" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="uppercase tracking-[0.25em] text-[#00629B] font-semibold">
            Events
          </p>

          <h2 className="mt-4 text-4xl md:text-5xl font-bold text-slate-900">
            Explore What's Coming
          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-slate-600 leading-8">
            National Space Day will feature exciting technical sessions,
            competitions, workshops, and interactive activities.
            The complete event lineup will be announced soon.
          </p>
        </motion.div>

        {/* Cards */}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">
          {events.map((event, index) => (
            <motion.div
              key={event.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.08,
              }}
              whileHover={{
                y: -8,
              }}
              className="group rounded-3xl border border-slate-200 bg-[#F8FAFC] p-8 shadow-sm hover:shadow-xl transition-all"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00629B] text-white">
                <event.icon size={30} />
              </div>

              <h3 className="mt-8 text-2xl font-bold text-slate-900">
                {event.title}
              </h3>

              <p className="mt-5 leading-8 text-slate-600">
                {event.description}
              </p>

              <div className="mt-8 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-[#00629B]">
                Coming Soon
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}