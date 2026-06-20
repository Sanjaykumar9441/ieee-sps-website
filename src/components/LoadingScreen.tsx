import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const LoadingScreen = () => {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), 1500);
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
          <div className="w-9 h-9 rounded-full border-[2.5px] border-slate-100 border-t-[#00629B] animate-spin" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;