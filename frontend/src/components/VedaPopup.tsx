import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CalendarDays, Sparkles, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const particles = Array.from({ length: 34 }, (_, index) => ({
  id: index,
  left: `${(index * 31.7) % 100}%`,
  top: `${(index * 47.3) % 100}%`,
  delay: (index % 9) * 0.16,
  duration: 3.2 + (index % 6) * 0.55,
  size: index % 5 === 0 ? 3 : 2,
}));

const VedaPopup = () => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] grid min-h-[100dvh] place-items-center overflow-y-auto bg-slate-950/55 px-4 py-6 backdrop-blur-[10px] sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label="VEDA 2K26 Technical Quiz ECE announcement"
        >
          {/* Cinematic background glow */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[min(80vw,760px)] w-[min(80vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00629B]/20 blur-[120px]"
            animate={{ scale: [0.88, 1.08, 0.88], opacity: [0.28, 0.48, 0.28] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden="true"
          >
            {particles.map((particle) => (
              <motion.span
                key={particle.id}
                className="absolute rounded-full bg-white"
                style={{
                  left: particle.left,
                  top: particle.top,
                  width: particle.size,
                  height: particle.size,
                  boxShadow: "0 0 12px rgba(255,255,255,.85)",
                }}
                animate={{
                  y: [0, 70, 0],
                  opacity: [0.05, 0.65, 0.05],
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Main popup. The grid parent keeps the resting position exactly centered. */}
          <motion.div
            initial={{
              y: "-105vh",
              scale: 0.82,
              rotateX: -18,
              opacity: 0,
            }}
            animate={{
              y: 0,
              scale: 1,
              rotateX: 0,
              opacity: 1,
            }}
            exit={{ y: "-80vh", scale: 0.9, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 135,
              damping: 17,
              mass: 0.82,
            }}
            className="relative my-auto w-full max-w-[600px] overflow-hidden rounded-[32px] border border-white/20 bg-white shadow-[0_35px_120px_rgba(0,0,0,.45)] [transform-style:preserve-3d]"
          >
            {/* Animated premium border */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-px rounded-[33px] opacity-80"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, transparent 205deg, #00629B 245deg, #00AEEF 270deg, #F28C28 295deg, transparent 325deg, transparent 360deg)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />
            <div className="pointer-events-none absolute inset-[1px] rounded-[31px] bg-white" />

            <div className="relative z-10">
              {/* Top strip */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 sm:px-8">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.26em] text-slate-500 sm:text-[11px]">
                  <Sparkles className="h-3.5 w-3.5 text-[#00629B]" />
                  VEDA 2K26 · Special Event
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:scale-105 hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close VEDA 2K26 announcement"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 pb-7 pt-7 text-center sm:px-10 sm:pb-9 sm:pt-8">
                {/* Logo */}
                <motion.div
                  initial={{ opacity: 0, y: -25, scale: 0.72 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: 0.25,
                    type: "spring",
                    stiffness: 185,
                    damping: 14,
                  }}
                  className="relative mx-auto flex h-[105px] w-[220px] items-center justify-center sm:h-[120px] sm:w-[250px]"
                >
                  <motion.div
                    aria-hidden="true"
                    className="absolute h-20 w-44 rounded-full bg-[#00629B]/15 blur-3xl"
                    animate={{
                      scale: [0.9, 1.1, 0.9],
                      opacity: [0.35, 0.65, 0.35],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    aria-hidden="true"
                    className="absolute inset-1 rounded-[28px] border border-dashed border-[#00629B]/20"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 14,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <img
                    src="/veda2026.png"
                    alt="VEDA Student Symposium"
                    className="relative z-10 h-[82px] w-[200px] object-contain drop-shadow-[0_10px_20px_rgba(0,98,155,.18)] sm:h-[94px] sm:w-[225px]"
                  />
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.45 }}
                  className="mt-1 text-[10px] font-bold uppercase tracking-[0.45em] text-slate-400"
                >
                  VEDA 2K26
                </motion.p>

                {/* Event title */}
                <motion.div
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.5,
                    type: "spring",
                    stiffness: 145,
                    damping: 15,
                  }}
                  className="mt-3"
                >
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.34em] text-[#00629B]">
                    Presents
                  </div>
                  <h2 className="mt-2 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">
                    Technical Quiz <span className="text-[#F28C28]">(ECE)</span>
                  </h2>
                  <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-[#00629B] via-[#00AEEF] to-[#F28C28]" />
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.68, duration: 0.5 }}
                  className="mx-auto mt-5 max-w-[470px] text-sm leading-6 text-slate-600 sm:text-[15px]"
                >
                  Test your core ECE knowledge, speed and technical thinking at
                  VEDA 2K26.
                </motion.p>

                {/* Quick facts */}
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="mx-auto mt-6 grid max-w-[500px] grid-cols-2 gap-3 text-left"
                >
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                    <CalendarDays className="h-4 w-4 text-[#00629B]" />
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      Date
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      11–12 September 2026
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                    <Users className="h-4 w-4 text-[#F28C28]" />
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      Eligibility
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      II, III & IV Year ECE
                    </p>
                  </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.98,
                    type: "spring",
                    stiffness: 165,
                    damping: 15,
                  }}
                  className="mt-7"
                >
                  <Link
                    to="/veda-2k26"
                    onClick={() => setOpen(false)}
                    className="group inline-flex items-center gap-3 rounded-2xl bg-[#00629B] px-7 py-3.5 text-sm font-bold text-white shadow-[0_14px_35px_rgba(0,98,155,.28)] transition duration-300 hover:-translate-y-1 hover:bg-[#00517f] hover:shadow-[0_18px_42px_rgba(0,98,155,.34)] sm:px-8"
                  >
                    View Quiz Details
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.15, duration: 0.5 }}
                  className="mt-5 text-[9px] font-semibold uppercase tracking-[0.26em] text-slate-400 sm:text-[10px]"
                >
                  VEDA 2K26 · Technical Symposium · ECE
                </motion.p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VedaPopup;
