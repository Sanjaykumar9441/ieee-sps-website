import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Cpu,
  Layers3,
  ShieldCheck,
  Users,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Add the assessment URLs/paths here when each assessment is created.
 * Example: "/student/exam/YOUR-ASSESSMENT-ID"
 */
const ASSESSMENTS = [
  {
    key: "elimination",
    round: "01",
    title: "Elimination Round",
    description:
      "The opening assessment used to shortlist teams for the final stages of the Technical Quiz.",
    meta: ["25 MCQs", "15 minutes", "Team assessment"],
    href: "/student/exam/29c228ed-7508-4280-82fe-63b055937fac", 
    accent: "from-[#00629B] to-[#00A8E8]",
  },
  {
    key: "final-1",
    round: "02",
    title: "Final Round 1",
    description:
      "The first final-stage assessment for teams that qualify through the elimination round.",
    meta: ["Final stage", "ECE focused", "Team assessment"],
    href: "",
    accent: "from-[#F59E0B] to-[#F97316]",
  },
  {
    key: "final-2",
    round: "03",
    title: "Final Round 2",
    description:
      "The concluding final-stage assessment used to determine the final standings.",
    meta: ["Final stage", "ECE focused", "Team assessment"],
    href: "",
    accent: "from-[#0F766E] to-[#14B8A6]",
  },
] as const;

// Keep this false until you intentionally create and enable the tie-break assessment.
const SHOW_TIE_BREAK = false;
const TIE_BREAK_HREF = "";

const rules = [
  "The Technical Quiz is for II, III and IV Year ECE students.",
  "The quiz is conducted as a team event, with a maximum team size of 3 members.",
  "The elimination assessment consists of 25 multiple-choice questions to be answered within 15 minutes.",
  "Participants must follow the instructions given by the event coordinators and quiz administrators.",
  "The assessment links on this page are opened only when the corresponding round is activated by the organisers.",
  "The organisers reserve the right to conduct a tie-break round when required to resolve a tie in the final standings.",
];

const highlights = [
  { icon: Users, value: "3", label: "Maximum team size" },
  { icon: BookOpen, value: "25", label: "Elimination MCQs" },
  { icon: Clock3, value: "15 min", label: "Elimination duration" },
  { icon: Cpu, value: "ECE", label: "Technical focus" },
];

function AssessmentButton({ href }: { href: string }) {
  if (!href) {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed">
        Assessment link pending
      </span>
    );
  }

  const external = /^https?:\/\//i.test(href);
  const className =
    "inline-flex items-center gap-2 rounded-xl bg-[#00629B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#00517f]";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        Open Assessment <ArrowUpRight className="h-4 w-4" />
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      Open Assessment <ArrowUpRight className="h-4 w-4" />
    </Link>
  );
}

export default function VedaTechnicalQuiz() {
  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-[#00629B]/10 blur-3xl" />
          <div className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-orange-400/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(#00629B_1px,transparent_1px),linear-gradient(90deg,#00629B_1px,transparent_1px)] bg-[size:42px_42px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-14">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#00629B]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Main Site
          </Link>

          <div className="grid items-center gap-10 lg:grid-cols-[1.25fr_.75fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
            >
              <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-blue-100 bg-blue-50 px-4 py-2">
                <img
                  src="/veda2026.png"
                  alt="VEDA Student Symposium"
                  className="h-8 w-auto object-contain"
                />
                <span className="h-5 w-px bg-blue-200" />
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#00629B]">
                  VEDA 2K26
                </span>
              </div>

              <p className="text-sm font-bold uppercase tracking-[0.22em] text-orange-500">
                ECE Technical Competition
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-7xl">
                Technical Quiz <span className="text-[#00629B]">(ECE)</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                A multi-stage technical challenge built to test core ECE
                knowledge, speed, accuracy and technical thinking.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                  <CalendarDays className="h-4 w-4" /> 11–12 September 2026
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
                  II, III & IV Year ECE
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.12 }}
              className="relative"
            >
              <div className="rounded-[2rem] bg-slate-950 p-1 shadow-2xl shadow-slate-900/15">
                <div className="rounded-[1.75rem] bg-white p-6 sm:p-8">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        Competition flow
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-slate-950">
                        Three assessment stages
                      </h2>
                    </div>
                    <div className="rounded-2xl bg-blue-50 p-3 text-[#00629B]">
                      <Trophy className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="mt-7 space-y-3">
                    {ASSESSMENTS.map((assessment) => (
                      <div
                        key={assessment.key}
                        className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4"
                      >
                        <div
                          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${assessment.accent} text-sm font-black text-white`}
                        >
                          {assessment.round}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">
                            {assessment.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Assessment stage
                          </p>
                        </div>
                        <CheckCircle2 className="ml-auto h-5 w-5 text-slate-300" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick facts */}
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {highlights.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <Icon className="h-5 w-5 text-[#00629B]" />
              <p className="mt-4 text-2xl font-black text-slate-950">{value}</p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Assessment hub */}
      <section className="mx-auto max-w-7xl px-6 pb-10 lg:px-10 lg:pb-16">
        <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00629B]">
              Assessment Centre
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Choose your round
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-500">
            Assessment links can be activated independently by the organisers as
            each round is opened.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {ASSESSMENTS.map((assessment, index) => (
            <motion.article
              key={assessment.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${assessment.accent}`}
              />
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-xs font-black text-white">
                  {assessment.round}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  ECE
                </span>
              </div>

              <h3 className="mt-6 text-2xl font-black text-slate-950">
                {assessment.title}
              </h3>
              <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-500">
                {assessment.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {assessment.meta.map((item) => (
                  <span
                    key={item}
                    className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-7">
                <AssessmentButton href={assessment.href} />
              </div>
            </motion.article>
          ))}
        </div>

        {SHOW_TIE_BREAK && (
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                  <Layers3 className="h-4 w-4" /> Optional stage
                </div>
                <h3 className="mt-2 text-2xl font-black text-slate-950">
                  Tie Break
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Activated only when the organisers need an additional
                  assessment to resolve a tie.
                </p>
              </div>
              <AssessmentButton href={TIE_BREAK_HREF} />
            </div>
          </div>
        )}
      </section>

      {/* About + rules */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-14 lg:grid-cols-[.9fr_1.1fr] lg:px-10 lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
              About the competition
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Built for ECE minds.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Technical Quiz (ECE) is a VEDA 2K26 technical competition centred
              on Electronics and Communication Engineering. The event is
              structured as a progression from an elimination assessment into
              two final-stage assessments, with an optional tie-break stage when
              required.
            </p>
            <div className="mt-7 rounded-2xl bg-slate-950 p-6 text-white">
              <ShieldCheck className="h-6 w-6 text-cyan-300" />
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Keep this page as the single assessment hub. You can replace
                each empty assessment link above without changing the page
                structure.
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#00629B]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Guidelines
                </p>
                <h3 className="text-2xl font-black text-slate-950">
                  Rules & participation
                </h3>
              </div>
            </div>

            <div className="mt-7 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-slate-50">
              {rules.map((rule, index) => (
                <div key={rule} className="flex gap-4 p-5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-[#00629B] shadow-sm">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-600">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 px-6 py-8 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between lg:px-4">
          <div>
            <p className="font-bold">VEDA 2K26 · Technical Quiz (ECE)</p>
            <p className="mt-1 text-slate-400">
              Electronics and Communication Engineering · Aditya University
            </p>
          </div>
          <a
            href="https://veda.adityauniversity.in"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-cyan-300 hover:text-white"
          >
            Official VEDA website ↗
          </a>
        </div>
      </footer>
    </main>
  );
}
