import { motion } from "framer-motion";
import { CalendarDays, MapPin, ArrowRight, ChevronDown } from "lucide-react";

import useCountdown from "../../hooks/useCountdown";
import { eventData } from "./eventData";
import { useNavigate } from "react-router-dom";

function SpaceIllustration() {
  const stars = [
    { cx: 40, cy: 60, r: 1.6, delay: 0 },
    { cx: 120, cy: 30, r: 1.2, delay: 0.6 },
    { cx: 200, cy: 90, r: 1.8, delay: 1.2 },
    { cx: 260, cy: 40, r: 1.3, delay: 0.3 },
    { cx: 320, cy: 140, r: 1.5, delay: 0.9 },
    { cx: 60, cy: 220, r: 1.2, delay: 1.5 },
    { cx: 300, cy: 260, r: 1.6, delay: 0.2 },
    { cx: 180, cy: 300, r: 1.3, delay: 1.1 },
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-8 top-24 hidden lg:block w-[340px] h-[340px] xl:w-[400px] xl:h-[400px]"
    >
      <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible">
        {/* twinkling stars */}
        {stars.map((s, i) => (
          <motion.circle
            key={i}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill="#60A5FA"
            initial={{ opacity: 0.15 }}
            animate={{ opacity: [0.15, 0.9, 0.15] }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              delay: s.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* dashed orbit ring */}
        <ellipse
          cx="200"
          cy="190"
          rx="150"
          ry="150"
          fill="none"
          stroke="#93C5FD"
          strokeWidth="1.5"
          strokeDasharray="4 8"
          opacity="0.55"
        />

        {/* orbiting satellite — rotates the whole group around the ring center */}
        <motion.g
          style={{ originX: "200px", originY: "190px" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        >
          <g transform="translate(200 40)">
            {/* satellite body */}
            <rect x="-10" y="-7" width="20" height="14" rx="3" fill="#00629B" />
            {/* solar panels */}
            <rect
              x="-34"
              y="-3"
              width="20"
              height="6"
              rx="1.5"
              fill="#BFDBFE"
              stroke="#3B82F6"
              strokeWidth="0.75"
            />
            <rect
              x="14"
              y="-3"
              width="20"
              height="6"
              rx="1.5"
              fill="#BFDBFE"
              stroke="#3B82F6"
              strokeWidth="0.75"
            />
            {/* antenna */}
            <line
              x1="0"
              y1="-7"
              x2="0"
              y2="-16"
              stroke="#00629B"
              strokeWidth="1.5"
            />
            <circle cx="0" cy="-17" r="1.8" fill="#00629B" />
          </g>
        </motion.g>

        {/* ascending rocket, gentle float + slight tilt */}
        <motion.g
          initial={{ y: 0, rotate: -2 }}
          animate={{ y: [0, -14, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <g transform="translate(170 180) rotate(35)">
            {/* flame */}
            <motion.path
              d="M0 46 C -6 60, -3 74, 0 84 C 3 74, 6 60, 0 46 Z"
              fill="#FDBA74"
              animate={{ scaleY: [1, 1.25, 1], opacity: [0.9, 1, 0.9] }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ originX: "0px", originY: "46px" }}
            />
            <motion.path
              d="M0 46 C -3 56, -1.5 66, 0 72 C 1.5 66, 3 56, 0 46 Z"
              fill="#F97316"
              animate={{ scaleY: [1, 1.3, 1] }}
              transition={{
                duration: 0.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ originX: "0px", originY: "46px" }}
            />

            {/* body */}
            <path
              d="M0 -60 C 16 -40, 16 10, 16 40 L -16 40 C -16 10, -16 -40, 0 -60 Z"
              fill="#F8FAFC"
              stroke="#00629B"
              strokeWidth="2"
            />
            {/* nose accent */}
            <path
              d="M0 -60 C 9 -47, 12 -28, 13 -10 L -13 -10 C -12 -28, -9 -47, 0 -60 Z"
              fill="#00629B"
            />
            {/* window */}
            <circle
              cx="0"
              cy="-14"
              r="7"
              fill="#BFDBFE"
              stroke="#00629B"
              strokeWidth="2"
            />
            {/* fins */}
            <path d="M-16 20 L-32 42 L-16 42 Z" fill="#00629B" />
            <path d="M16 20 L32 42 L16 42 Z" fill="#00629B" />
          </g>
        </motion.g>
      </svg>
    </div>
  );
}

export default function Hero() {
  const navigate = useNavigate();
  const { days, hours, minutes, seconds } = useCountdown(eventData.date);

  const countdown = [
    { value: days, label: "Days" },
    { value: hours, label: "Hours" },
    { value: minutes, label: "Minutes" },
    { value: seconds, label: "Seconds" },
  ];

  const scrollToAbout = () => {
    document.getElementById("about")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <section
      id="home"
      className="relative overflow-hidden min-h-screen flex items-start md:items-center bg-[#F8FAFC]"
    >
      {/* Background Blur */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-200/30 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full bg-sky-100/40 blur-3xl" />

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div className="h-full w-full bg-[linear-gradient(to_right,#94a3b8_1px,transparent_1px),linear-gradient(to_bottom,#94a3b8_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Rocket + Orbiting Satellite */}
      <SpaceIllustration />

      {/* Main */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 md:pt-24 pb-16 w-full">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 sm:px-5 sm:py-2"
        >
          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
          <span className="text-xs sm:text-sm font-semibold text-blue-700 tracking-wide uppercase">
            IEEE SPS Student Branch Chapter - Electronics and Communication Engineering
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 sm:mt-8 text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight text-slate-900"
        >
          {eventData.title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4 sm:mt-6 max-w-3xl text-base sm:text-xl text-slate-600 leading-7 sm:leading-9"
        >
          {eventData.tagline}
        </motion.p>

        {/* Event Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3 sm:gap-6"
        >
          <div className="flex items-center gap-2 text-sm sm:text-base text-slate-700">
            <CalendarDays size={18} className="shrink-0" />
            <span>13 August 2026</span>
          </div>

          <div className="flex items-center gap-2 text-sm sm:text-base text-slate-700">
            <MapPin size={18} className="shrink-0" />
            <span>{eventData.venue}</span>
          </div>

          <div className="px-3 py-1 sm:px-4 sm:py-1 rounded-full bg-green-100 text-green-700 text-sm sm:text-base font-semibold">
            Registration Open
          </div>
        </motion.div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-10 sm:mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 max-w-3xl"
        >
          {countdown.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.8 + index * 0.1,
              }}
              whileHover={{
                y: -6,
              }}
              className="rounded-2xl sm:rounded-3xl bg-white shadow-md border border-slate-200 p-4 sm:p-6 md:p-8 text-center"
            >
              <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-blue-700">
                {String(item.value).padStart(2, "0")}
              </div>

              <div className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-slate-500 font-medium">
                {item.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-10 sm:mt-14 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4"
        >
          <button
            onClick={() => navigate("/space-day/register")}
            className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-[#00629B] text-white font-semibold hover:bg-[#004E7C] transition flex items-center justify-center gap-2"
          >
            Register Now
            <ArrowRight size={18} />
          </button>

          <button
            onClick={scrollToAbout}
            className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 transition font-semibold text-slate-700"
          >
            Learn More
          </button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
        }}
        className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <ChevronDown className="text-slate-500" />
      </motion.div>
    </section>
  );
}