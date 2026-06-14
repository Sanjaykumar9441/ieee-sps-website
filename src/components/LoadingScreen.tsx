import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const duration = 1500;

    const tick = (now: number) => {
      const elapsed = now - start;

      const p = Math.min((elapsed / duration) * 100, 100);

      setProgress(Math.floor(p));

      if (elapsed < duration) {
        requestAnimationFrame(tick);
      } else {
        setProgress(100);

        setTimeout(() => {
          setDone(true);
        }, 200);
      }
    };

    const raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] bg-white flex items-center justify-center"
        >
          <div className="flex flex-col items-center px-6">
            {/* CARD */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
              }}
              className="
              bg-white
              border
              border-slate-200
              rounded-3xl
              px-10
              py-8
              shadow-lg
              text-center
              "
            >
              <h1 className="text-4xl md:text-5xl font-bold text-[#00629B]">
                IEEE SPS
              </h1>

              <p className="mt-3 text-slate-500 text-sm md:text-base">
                Aditya University Student Branch Chapter
              </p>
            </motion.div>

            {/* TEXT */}
            <p className="mt-8 text-sm tracking-wider uppercase text-slate-500">
              Loading IEEE SPS Portal
            </p>

            {/* PROGRESS BAR */}
            <div className="mt-5 w-[260px] h-[6px] rounded-full bg-slate-200 overflow-hidden">
              <motion.div
                className="h-full bg-[#00629B]"
                initial={{ width: 0 }}
                animate={{
                  width: `${progress}%`,
                }}
                transition={{
                  ease: "easeOut",
                }}
              />
            </div>

            {/* PERCENTAGE */}
            <p className="mt-4 text-sm font-semibold text-[#00629B]">
              {progress}%
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;