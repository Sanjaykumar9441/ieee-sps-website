import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  X,
  Palette,
  Lightbulb,
  Target,
  Sparkles,
} from "lucide-react";

interface Challenge {
  id: number;
  theme: string;
  title: string;
  problem: string;
  communicate: string[];
  direction: string;
  constraint: string;
}

const challenges: Challenge[] = [
  {
    id: 1,
    theme: "Chandrayaan & Beyond: The Lunar Signal Chronicles",
    title: "The Moon Speaks",
    problem:
      "Design a poster that visually explains how scientific information travels from the lunar surface to Earth during a Chandrayaan mission. Illustrate the journey of data collected by a lunar rover or lander through communication systems, deep-space tracking and signal processing until it reaches mission control.",
    communicate: [
      "Lunar exploration",
      "Communication between Moon and Earth",
      "Telemetry and data transmission",
      "Deep-space tracking",
      "Signal processing",
    ],
    direction:
      "Show the complete journey of a lunar signal using an engaging visual story.",
    constraint:
      "The scientific concept must be understandable primarily through the poster's visuals.",
  },
  {
    id: 2,
    theme: "Chandrayaan & Beyond: The Lunar Signal Chronicles",
    title: "The South Pole Connection",
    problem:
      "Create a poster celebrating India's exploration of the Moon's South Pole. Illustrate how spacecraft, communication systems, electronics and Earth-based ground stations work together to support lunar exploration in a challenging environment.",
    communicate: [
      "Chandrayaan mission",
      "Lunar South Pole",
      "Spacecraft communication",
      "Ground station",
      "Mission control",
      "Scientific data transmission",
    ],
    direction:
      "Build a strong visual connection between the lunar surface and Earth.",
    constraint:
      "The poster should celebrate the achievement while highlighting the technology behind it.",
  },
  {
    id: 3,
    theme: "Signals from the Cosmos: Decoding Deep Space",
    title: "From Raw Signal to Cosmic Image",
    problem:
      "Design a poster showing how an electromagnetic signal originating millions or billions of kilometres away can become meaningful scientific information on Earth.",
    communicate: [
      "Deep-space signals",
      "Antennas and receivers",
      "Signal acquisition",
      "Noise reduction",
      "Digital signal processing",
      "Data visualization",
    ],
    direction:
      "Cosmic Signal → Receiver → Processing → Information → Image",
    constraint:
      "The transformation from an invisible signal to meaningful information should be the central visual element.",
  },
  {
    id: 4,
    theme: "Signals from the Cosmos: Decoding Deep Space",
    title: "Listening to the Universe",
    problem:
      "Imagine humanity has built a giant listening system capable of detecting signals from distant stars and galaxies. Create a poster showing how scientists use antennas, radio telescopes and signal-processing technologies to listen to the universe.",
    communicate: [
      "Radio astronomy",
      "Space signals",
      "Radio telescopes",
      "Distant stars and galaxies",
      "Signal detection",
      "Scientific discovery",
    ],
    direction:
      "Make the universe appear as a source of countless signals waiting to be decoded.",
    constraint:
      "Use visual storytelling to make an invisible phenomenon visually understandable.",
  },
  {
    id: 5,
    theme: "Signals from the Cosmos: Decoding Deep Space",
    title: "The Invisible Universe",
    problem:
      "Much of the universe cannot be directly seen with the human eye. Design a poster showing how electromagnetic signals and advanced signal-processing techniques allow scientists to reveal information hidden within the universe.",
    communicate: [
      "Invisible electromagnetic signals",
      "Noise and interference",
      "Filtering",
      "Frequency analysis",
      "Signal processing",
      "Cosmic information",
    ],
    direction:
      "Contrast an apparently empty universe with the hidden information contained within its signals.",
    constraint:
      "The poster should visually demonstrate the difference between noise and meaningful information.",
  },
  {
    id: 6,
    theme: "From Aryabhata to Gaganyaan: The Digital Orbit",
    title: "Aryabhata: The Beginning",
    problem:
      "Create a poster celebrating Aryabhata, India's first satellite, and the beginning of India's journey into space technology. Show how early satellite technology created a foundation for the advanced spacecraft and communication systems of today.",
    communicate: [
      "Aryabhata",
      "India's early space journey",
      "Satellite technology",
      "Communication",
      "Electronics",
      "Technological evolution",
    ],
    direction:
      "Present Aryabhata not only as a satellite, but as the beginning of a technological journey.",
    constraint:
      "The poster should connect the historical achievement with modern space technology.",
  },
  {
    id: 7,
    theme: "From Aryabhata to Gaganyaan: The Digital Orbit",
    title: "From Aryabhata to Gaganyaan",
    problem:
      "Design a timeline-based poster showing the evolution of India's space programme from Aryabhata to Gaganyaan. Highlight the technological progress that transformed India from an emerging space nation into a major space-faring country.",
    communicate: [
      "Aryabhata",
      "Indian satellite missions",
      "Chandrayaan",
      "Mangalyaan",
      "Gaganyaan",
      "Future space missions",
    ],
    direction:
      "Create a visually powerful journey through time.",
    constraint:
      "The progression of technology and capability should be immediately visible.",
  },
  {
    id: 8,
    theme: "From Aryabhata to Gaganyaan: The Digital Orbit",
    title: "The Digital Orbit",
    problem:
      "Imagine the next generation of Indian spacecraft. Design a futuristic poster showing how onboard computers, embedded systems, autonomous technologies and advanced communication systems could shape the future of space exploration.",
    communicate: [
      "Onboard computing",
      "Embedded systems",
      "Autonomous spacecraft",
      "Advanced communication",
      "Navigation",
      "Future space stations",
    ],
    direction:
      "Imagine what India's spacecraft could look like 10–20 years from now.",
    constraint:
      "The concept should be futuristic but technically believable.",
  },
  {
    id: 9,
    theme: "Chandrayaan & Beyond + Signals from the Cosmos",
    title: "Mission Control: The Invisible Hero",
    problem:
      "Spacecraft cannot operate alone. Design a poster highlighting the critical role of mission control, ground stations and communication networks in controlling spacecraft and receiving valuable information from space.",
    communicate: [
      "Mission control",
      "Ground stations",
      "Spacecraft",
      "Uplink communication",
      "Downlink communication",
      "Data processing",
    ],
    direction:
      "Earth → Command → Spacecraft → Data → Earth",
    constraint:
      "Make communication the central visual concept of the poster.",
  },
  {
    id: 10,
    theme: "All Three Official Themes",
    title: "India's Next Giant Leap",
    problem:
      "Create an inspirational poster representing India's journey from its first satellite to a future of lunar exploration, human spaceflight and deep-space missions. Your design should connect India's past achievements with its future vision through electronics, communication, signal processing and digital technologies.",
    communicate: [
      "Aryabhata",
      "Chandrayaan",
      "Gaganyaan",
      "Deep-space exploration",
      "Communication technology",
      "Signal processing",
      "Future space missions",
    ],
    direction:
      "Tell the story of where India started, where India is today, and where India is going next.",
    constraint:
      "The poster should create a strong sense of progress, ambition and future possibilities.",
  },
];

export default function AstroDesign() {
  const [selected, setSelected] =
    useState<Challenge | null>(null);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900">

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#071A2B] px-6 py-20 text-white">
        <div className="absolute inset-0">
          <div className="absolute left-[10%] top-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute right-[10%] bottom-0 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur"
          >
            <Palette size={17} />
            National Space Day 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl"
          >
            ASTRO DESIGN
            <span className="block text-cyan-300">
              2026
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg"
          >
            Explore the official design challenges and transform
            India's space journey, communication technology and
            cosmic discoveries into powerful visual stories.
          </motion.p>
        </div>
      </section>

      {/* CHALLENGES */}
      <section className="mx-auto max-w-7xl px-6 py-16">

        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#00629B]">
            Official Design Challenges
          </p>

          <h2 className="mt-2 text-3xl font-black sm:text-4xl">
            Choose Your Challenge
          </h2>

          <p className="mt-3 max-w-2xl text-slate-500">
            Browse all 10 official Astro Design challenge cards.
            Click a challenge to view its complete problem statement,
            creative direction and design constraint.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {challenges.map((challenge, index) => (
            <motion.article
              key={challenge.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.04,
              }}
              whileHover={{ y: -5 }}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-xl"
            >
              <div className="h-2 bg-[#00629B]" />

              <div className="flex flex-1 flex-col p-6">

                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-[#00629B]">
                    CHALLENGE {String(challenge.id).padStart(2, "0")}
                  </span>

                  <Palette
                    size={19}
                    className="text-slate-300 transition group-hover:text-[#00629B]"
                  />
                </div>

                <p className="mt-4 text-xs font-semibold uppercase leading-5 tracking-wide text-slate-400">
                  {challenge.theme}
                </p>

                <h3 className="mt-3 text-xl font-bold leading-tight">
                  {challenge.title}
                </h3>

                <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600">
                  {challenge.problem}
                </p>

                <button
                  onClick={() =>
                    setSelected(challenge)
                  }
                  className="mt-6 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-[#00629B] transition group-hover:bg-blue-50"
                >
                  View Challenge
                  <ArrowRight size={18} />
                </button>

              </div>
            </motion.article>
          ))}

        </div>
      </section>

      {/* MODAL */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[#00629B]">
                    Challenge{" "}
                    {String(selected.id).padStart(2, "0")}
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    {selected.title}
                  </h2>
                </div>

                <button
                  onClick={() =>
                    setSelected(null)
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-7 p-6 sm:p-8">

                {/* Theme */}
                <div className="rounded-2xl bg-blue-50 p-5">
                  <p className="text-xs font-black uppercase tracking-wider text-[#00629B]">
                    Official Theme
                  </p>

                  <p className="mt-2 font-semibold leading-6 text-slate-800">
                    {selected.theme}
                  </p>
                </div>

                {/* Problem */}
                <div>
                  <div className="flex items-center gap-2">
                    <Target
                      size={20}
                      className="text-[#00629B]"
                    />

                    <h3 className="text-lg font-bold">
                      Problem Statement
                    </h3>
                  </div>

                  <p className="mt-3 leading-7 text-slate-600">
                    {selected.problem}
                  </p>
                </div>

                {/* Communicate */}
                <div>
                  <div className="flex items-center gap-2">
                    <Lightbulb
                      size={20}
                      className="text-[#00629B]"
                    />

                    <h3 className="text-lg font-bold">
                      Your Poster Should Communicate
                    </h3>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {selected.communicate.map(
                      (item) => (
                        <div
                          key={item}
                          className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                        >
                          {item}
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Creative Direction */}
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles
                      size={20}
                      className="text-[#00629B]"
                    />

                    <h3 className="text-lg font-bold">
                      Creative Direction
                    </h3>
                  </div>

                  <p className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 leading-7 text-slate-700">
                    {selected.direction}
                  </p>
                </div>

                {/* Constraint */}
                <div>
                  <h3 className="text-lg font-bold">
                    Design Constraint
                  </h3>

                  <p className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 p-5 leading-7 text-slate-700">
                    {selected.constraint}
                  </p>
                </div>

              </div>

              <div className="border-t bg-slate-50 px-6 py-5 sm:px-8">
                <button
                  onClick={() =>
                    setSelected(null)
                  }
                  className="w-full rounded-xl bg-[#00629B] px-5 py-3.5 font-bold text-white transition hover:bg-[#004E7C]"
                >
                  Close Challenge
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}