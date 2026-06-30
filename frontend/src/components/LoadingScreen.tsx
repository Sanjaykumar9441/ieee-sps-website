import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const LoadingScreen = () => {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDone(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] bg-white flex items-center justify-center"
        >
          <div className="loader-wrapper">
            <span className="loader-letter">I</span>
            <span className="loader-letter">E</span>
            <span className="loader-letter">E</span>
            <span className="loader-letter">E</span>
            <span className="loader-letter"> </span>
            <span className="loader-letter">S</span>
            <span className="loader-letter">P</span>
            <span className="loader-letter">S</span>

            <div className="loader" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;