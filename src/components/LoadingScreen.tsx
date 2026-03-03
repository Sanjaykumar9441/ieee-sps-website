import { motion } from "framer-motion";

const LoadingScreen = () => {
  return (
    <motion.div
      className="fixed inset-0 z-[999] 
                 flex items-center justify-center 
                 bg-background"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-center">

        {/* Spinner */}
        <div className="w-20 h-20 rounded-full 
                        border-4 
                        border-gray-800 
                        dark:border-cyan-400 
                        border-t-transparent 
                        animate-spin 
                        mx-auto mb-6" />

        {/* Title */}
        <h1 className="font-heading text-3xl font-bold tracking-wide
                       text-gray-900 
                       dark:bg-gradient-to-r 
                       dark:from-cyan-400 
                       dark:to-blue-500 
                       dark:bg-clip-text 
                       dark:text-transparent">
          IEEE SPS Website
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 dark:text-white/60 text-sm mt-2">
          Loading Experience...
        </p>

      </div>
    </motion.div>
  );
};

export default LoadingScreen;