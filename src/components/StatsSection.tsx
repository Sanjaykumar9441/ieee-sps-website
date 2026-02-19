import { motion } from "framer-motion";

const StatsSection = () => {
  return (
    <section className="relative py-24 bg-background text-foreground overflow-hidden">

      {/* Subtle divider glow */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-40" />

      <div className="max-w-6xl mx-auto px-6 text-center">

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-4xl font-semibold mb-16"
        >
          Chapter Impact
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">

          <Stat number="10+" label="Active Members" />
          <Stat number="0" label="Technical Events" />
          <Stat number="1" label="Workshops Conducted" />
          <Stat number="0" label="Research Initiatives" />

        </div>
      </div>
    </section>
  );
};

const Stat = ({ number, label }: { number: string; label: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8 }}
    className="group"
  >
    <h3 className="text-5xl md:text-6xl font-bold text-primary 
      group-hover:scale-105 transition-transform duration-300">
      {number}
    </h3>
    <p className="mt-4 text-muted-foreground tracking-wide uppercase text-sm">
      {label}
    </p>
  </motion.div>
);

export default StatsSection;
