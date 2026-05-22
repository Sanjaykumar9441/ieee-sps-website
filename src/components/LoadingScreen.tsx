import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const duration = 2600;

    const tick = (now: number) => {
      const elapsed = now - start;

      const p = Math.min(
        (elapsed / duration) * 100,
        100
      );

      setProgress(Math.floor(p));

      if (elapsed < duration) {
        requestAnimationFrame(tick);
      } else {
        setProgress(100);

        setTimeout(() => {
          setDone(true);
        }, 400);
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
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[9999] overflow-hidden bg-background flex items-center justify-center"
        >

          {/* BACKGROUND GLOW */}
          <div className="absolute inset-0 overflow-hidden">

            <motion.div
              className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[120px]"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.div
              className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-pink-500/20 blur-[120px]"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

          </div>

          {/* CONTENT */}
          <div className="relative z-10 flex flex-col items-center">

            {/* LOGO */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative"
            >

              {/* OUTER GLOW */}
              <div className="absolute inset-0 rounded-[36px] bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-pink-500/20 blur-3xl scale-125" />

              {/* CARD */}
              <div className="relative px-12 py-10 rounded-[36px] border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/40 backdrop-blur-2xl shadow-[0_20px_60px_rgba(15,23,42,0.12)]">

                {/* IEEE */}
                <motion.p
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.2,
                    duration: 0.5,
                  }}
                  className="text-center text-xs tracking-[0.5em] uppercase dark:text-slate-400 text-slate-500 mb-4"
                >
                  IEEE
                </motion.p>

                {/* SPS */}
                <motion.h1
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    delay: 0.3,
                    duration: 0.6,
                  }}
                  className="text-6xl sm:text-7xl font-black tracking-tight bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 bg-clip-text text-transparent"
                >
                  SPS
                </motion.h1>

              </div>

            </motion.div>

            {/* LOADING TEXT */}
            <motion.p
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                delay: 0.5,
              }}
              className="mt-10 text-sm tracking-[0.3em] uppercase dark:text-slate-400 text-slate-500"
            >
              Loading Experience
            </motion.p>

            {/* PROGRESS BAR */}
            <div className="mt-6 w-[260px] h-[6px] rounded-full dark:bg-white/10 bg-black/5 overflow-hidden">

              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500"
                initial={{
                  width: 0,
                }}
                animate={{
                  width: `${progress}%`,
                }}
                transition={{
                  ease: "easeOut",
                }}
              />

            </div>

            {/* PERCENT */}
            <motion.p
              key={progress}
              initial={{
                opacity: 0,
                y: 4,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mt-4 text-sm font-medium dark:text-slate-300 text-slate-600"
            >
              {progress}%
            </motion.p>

          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;