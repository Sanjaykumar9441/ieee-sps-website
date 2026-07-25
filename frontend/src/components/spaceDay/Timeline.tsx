import { motion } from "framer-motion";
import {
  UserCheck,
  Flag,
  Mic,
  Coffee,
  Rocket,
  Trophy,
  Award,
  CheckCircle,
} from "lucide-react";

const timeline = [
  {
    time: "09:00 AM",
    title: "Registration",
    description: "Participant check-in and welcome kit distribution.",
    icon: UserCheck,
  },
  {
    time: "09:45 AM",
    title: "Inauguration Ceremony",
    description: "Lighting of the lamp and inaugural address.",
    icon: Flag,
  },
  {
    time: "10:30 AM",
    title: "Keynote Session",
    description: "Talk by a distinguished expert in space technology.",
    icon: Mic,
  },
  {
    time: "12:00 PM",
    title: "Networking Break",
    description: "Interact with speakers, faculty, and fellow participants.",
    icon: Coffee,
  },
  {
    time: "01:30 PM",
    title: "Technical Activities",
    description: "Space quiz, exhibitions, and innovation challenges.",
    icon: Rocket,
  },
  {
    time: "03:30 PM",
    title: "Competitions",
    description: "Final rounds of technical events and presentations.",
    icon: Trophy,
  },
  {
    time: "04:45 PM",
    title: "Prize Distribution",
    description: "Certificates and awards for winners and participants.",
    icon: Award,
  },
  {
    time: "05:15 PM",
    title: "Closing Ceremony",
    description: "Vote of thanks and group photograph.",
    icon: CheckCircle,
  },
];

export default function Timeline() {
  return (
    <section id="schedule" className="py-28 bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-6">

        {/* Heading */}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="uppercase tracking-[0.25em] text-[#00629B] font-semibold">
            Event Timeline
          </p>

          <h2 className="mt-4 text-4xl md:text-5xl font-bold text-slate-900">
            Mission Schedule
          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-slate-600 leading-8">
            Here's an overview of the day's activities. Replace these entries
            with your final event schedule once it's confirmed.
          </p>
        </motion.div>

        {/* Timeline */}

        <div className="relative mt-20">

          {/* Center Line */}

          <div className="absolute left-1/2 top-0 hidden md:block h-full w-1 -translate-x-1/2 rounded-full bg-blue-100" />

          <div className="space-y-12">

            {timeline.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.08,
                  }}
                  className={`relative flex items-center ${
                    index % 2 === 0
                      ? "md:justify-start"
                      : "md:justify-end"
                  }`}
                >
                  {/* Card */}

                  <div className="w-full md:w-[45%] rounded-3xl bg-white border border-slate-200 shadow-sm p-8 hover:shadow-xl transition">

                    <div className="flex items-center gap-4">

                      <div className="h-14 w-14 rounded-2xl bg-[#00629B] text-white flex items-center justify-center">
                        <Icon size={26} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-[#00629B]">
                          {item.time}
                        </p>

                        <h3 className="text-xl font-bold text-slate-900">
                          {item.title}
                        </h3>
                      </div>

                    </div>

                    <p className="mt-5 leading-7 text-slate-600">
                      {item.description}
                    </p>

                  </div>

                  {/* Timeline Dot */}

                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 h-6 w-6 rounded-full border-4 border-white bg-[#00629B]" />

                </motion.div>
              );
            })}

          </div>

        </div>

      </div>
    </section>
  );
}