import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const duration = 3000;

    const tick = (now: number) => {
      const elapsed = now - start;
      const p = Math.min((elapsed / duration) * 100, 100);
      setProgress(Math.floor(p));
      if (elapsed < duration) {
        requestAnimationFrame(tick);
      } else {
        setProgress(100);
        setTimeout(() => setDone(true), 200);
      }
    };

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const glitchLines = [
    { top: "18%", width: "40%", left: "5%", delay: 0.8 },
    { top: "42%", width: "25%", left: "60%", delay: 1.4 },
    { top: "67%", width: "55%", left: "20%", delay: 0.4 },
    { top: "80%", width: "30%", left: "10%", delay: 2.1 },
    { top: "31%", width: "18%", left: "75%", delay: 1.9 },
  ];

  const scanlines = Array.from({ length: 30 }, (_, i) => i);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: "#050508" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* SCANLINE TEXTURE */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            {scanlines.map((i) => (
              <div
                key={i}
                className="absolute w-full"
                style={{
                  top: `${(i / 30) * 100}%`,
                  height: "1px",
                  backgroundColor: "rgba(255,255,255,0.018)",
                }}
              />
            ))}
          </div>

          {/* NEON GRID */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,255,200,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,255,200,0.3) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
              zIndex: 0,
            }}
          />

          {/* BOTTOM FADE */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none"
            style={{
              background: "linear-gradient(to top, #050508 10%, transparent 100%)",
              zIndex: 2,
            }}
          />

          {/* AMBIENT GLOW BLOBS */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 400, height: 400, top: "10%", left: "-10%",
                background: "radial-gradient(circle, rgba(255,0,200,0.12) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 500, height: 500, bottom: "-5%", right: "-10%",
                background: "radial-gradient(circle, rgba(0,255,200,0.10) 0%, transparent 70%)",
                filter: "blur(50px)",
              }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 300, height: 300, top: "30%", left: "35%",
                background: "radial-gradient(circle, rgba(80,0,255,0.08) 0%, transparent 70%)",
                filter: "blur(60px)",
              }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
          </div>

          {/* GLITCH LINES */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 3 }}>
            {glitchLines.map((line, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  top: line.top, left: line.left, width: line.width, height: "1px",
                  background: "linear-gradient(to right, transparent, rgba(0,255,200,0.6), transparent)",
                }}
                animate={{ opacity: [0, 1, 0], scaleX: [0.5, 1, 0.5] }}
                transition={{ duration: 0.3, delay: line.delay, repeat: Infinity, repeatDelay: 1.5 }}
              />
            ))}
          </div>

          {/* MAIN CONTENT */}
          <div className="relative flex flex-col items-center gap-10" style={{ zIndex: 10 }}>

            {/* LOGO BLOCK */}
            <div className="relative flex flex-col items-center">
              <motion.div
                className="relative px-10 py-6"
                style={{
                  border: "1px solid rgba(0,255,200,0.25)",
                  boxShadow: "0 0 30px rgba(0,255,200,0.08), inset 0 0 30px rgba(0,255,200,0.04)",
                }}
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(0,255,200,0.08), inset 0 0 20px rgba(0,255,200,0.04)",
                    "0 0 50px rgba(0,255,200,0.18), inset 0 0 40px rgba(0,255,200,0.08)",
                    "0 0 20px rgba(0,255,200,0.08), inset 0 0 20px rgba(0,255,200,0.04)",
                  ],
                  borderColor: [
                    "rgba(0,255,200,0.25)",
                    "rgba(0,255,200,0.6)",
                    "rgba(0,255,200,0.25)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Corner brackets */}
                {[
                  { top: -1, left: -1, borderTop: true, borderLeft: true },
                  { top: -1, right: -1, borderTop: true, borderRight: true },
                  { bottom: -1, left: -1, borderBottom: true, borderLeft: true },
                  { bottom: -1, right: -1, borderBottom: true, borderRight: true },
                ].map((corner, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-4 h-4"
                    style={{
                      top: corner.top !== undefined ? corner.top : undefined,
                      bottom: corner.bottom !== undefined ? corner.bottom : undefined,
                      left: corner.left !== undefined ? corner.left : undefined,
                      right: corner.right !== undefined ? corner.right : undefined,
                      borderTop: corner.borderTop ? "2px solid #00ffc8" : undefined,
                      borderBottom: corner.borderBottom ? "2px solid #00ffc8" : undefined,
                      borderLeft: corner.borderLeft ? "2px solid #00ffc8" : undefined,
                      borderRight: corner.borderRight ? "2px solid #00ffc8" : undefined,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.06 }}
                  />
                ))}

                {/* IEEE label */}
                <motion.p
                  className="text-center text-xs font-bold tracking-[0.5em] mb-1"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    color: "rgba(0,255,200,0.7)",
                    textShadow: "0 0 10px rgba(0,255,200,0.5)",
                  }}
                  initial={{ opacity: 0, letterSpacing: "1em" }}
                  animate={{ opacity: 1, letterSpacing: "0.5em" }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                >
                  IEEE
                </motion.p>

                {/* SPS */}
                <motion.h1
                  className="text-7xl font-black text-center leading-none"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    color: "#fff",
                    textShadow: `
                      0 0 10px rgba(0,255,200,0.9),
                      0 0 30px rgba(0,255,200,0.6),
                      0 0 60px rgba(0,200,255,0.4),
                      0 0 100px rgba(80,0,255,0.2)
                    `,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  SPS
                </motion.h1>

                {/* Glitch duplicate */}
                <motion.h1
                  className="absolute text-7xl font-black text-center leading-none select-none pointer-events-none"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    color: "rgba(255,0,200,0.25)",
                    top: "50%", left: "50%",
                    transform: "translate(-48%, -46%)",
                    filter: "blur(1px)",
                    textShadow: "0 0 12px rgba(255,0,200,0.4)",
                  }}
                  animate={{ x: [0, -3, 2, 0], opacity: [0, 0.4, 0, 0.3, 0] }}
                  transition={{ duration: 0.15, delay: 1.2, repeat: Infinity, repeatDelay: 1.8 }}
                >
                  SPS
                </motion.h1>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                className="mt-4 text-xs tracking-[0.3em] uppercase text-center"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  color: "rgba(255,255,255,0.35)",
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                Signal Processing Society
              </motion.p>
            </div>

            {/* PROGRESS SECTION */}
            <motion.div
              className="flex flex-col items-center gap-3 w-64"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {/* Track */}
              <div
                className="relative w-full overflow-hidden"
                style={{
                  height: "3px",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  boxShadow: "0 0 6px rgba(0,255,200,0.1)",
                }}
              >
                {/* Fill */}
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(to right, #7000ff, #00c8ff, #00ffc8)",
                    boxShadow: "0 0 10px rgba(0,255,200,0.8), 0 0 20px rgba(0,200,255,0.4)",
                    transition: "width 0.05s linear",
                  }}
                />
                {/* Leading edge glow */}
                <div
                  className="absolute inset-y-0 w-8"
                  style={{
                    left: `calc(${progress}% - 16px)`,
                    background: "linear-gradient(to right, transparent, rgba(0,255,200,0.9), transparent)",
                    transition: "left 0.05s linear",
                  }}
                />
              </div>

              {/* Counter */}
              <div className="flex items-center justify-between w-full">
                <motion.span
                  className="text-xs font-mono"
                  style={{ color: "rgba(0,255,200,0.6)" }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  LOADING
                </motion.span>
                <span
                  className="text-xs font-mono font-bold tabular-nums"
                  style={{
                    color: "#00ffc8",
                    textShadow: "0 0 8px rgba(0,255,200,0.7)",
                    fontFamily: "'Orbitron', sans-serif",
                  }}
                >
                  {progress}%
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;