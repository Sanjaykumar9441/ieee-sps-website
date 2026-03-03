import { motion } from "framer-motion";
import { Signal, Brain, Users, Award, Target, Eye } from "lucide-react";

const highlights = [
  {
    icon: Signal,
    title: "Signal Processing",
    description:
      "Advancing DSP, image, audio & video processing research."
  },
  {
    icon: Brain,
    title: "Machine Learning",
    description:
      "Exploring AI/ML applications in signal analysis."
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Building a strong network of engineers and researchers."
  },
  {
    icon: Award,
    title: "Competitions",
    description:
      "Participating in IEEE research challenges and hackathons."
  }
];

const BorderCard = ({ children }: any) => {
  return (
    <motion.div
      whileHover={{
        y: -6,
        scale: 1.02
      }}
      transition={{ type: "spring", stiffness: 250, damping: 18 }}
      className="relative p-[2px] rounded-2xl animate-rgb-border h-full group"
    >
      <div className="bg-card border border-border rounded-2xl p-3 sm:p-5 lg:p-6 h-full flex flex-col backdrop-blur-md transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(0,229,255,0.3)]">
        {children}
      </div>
    </motion.div>
  );
};


const AboutSection = () => {
  return (
    <section
      id="about"
      className="relative py-10 sm:py-20 lg:py-28 px-4 sm:px-6 border-t border-border"
    >
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-semibold tracking-tight mb-4 sm:mb-6">
            About IEEE SPS
          </h2>

          <div className="w-20 h-[2px] bg-primary mx-auto mb-6" />

          
        </motion.div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 mb-14 sm:mb-20 lg:mb-24 items-stretch">

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="h-full"
          >
            <BorderCard>
              <div className="flex items-center gap-3 mb-5">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-heading text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight">Our Mission</h3>
              </div>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed flex-grow">
                To empower students with advanced knowledge in signal
                processing through workshops, research initiatives,
                competitions, and leadership opportunities within IEEE.
              </p>
            </BorderCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="h-full"
          >
            <BorderCard>
              <div className="flex items-center gap-3 mb-5">
                <Eye className="w-5 h-5 text-primary" />
                <h3 className="font-heading text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight">Our Vision</h3>
              </div>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed flex-grow">
                To be recognized as a leading IEEE student chapter known
                for innovation, impactful research, and strong
                industry–academic collaboration.
              </p>
            </BorderCard>
          </motion.div>

        </div>
        {/* Highlights */}
<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 items-stretch">
  {highlights.map((item, i) => (
    <motion.div
      key={item.title}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: i * 0.1 }}
      className="h-full"
    >
      <BorderCard>
        <div className="flex flex-col h-full">

          {/* Icon */}
          <div className="w-9 h-9 sm:w-12 sm:h-12 mb-3 sm:mb-6 rounded-lg bg-muted flex items-center justify-center">
            <item.icon className="w-6 h-6 text-primary" />
          </div>

          {/* Title (Fixed Height for Alignment) */}
          <h3 className="font-heading text-base sm:text-xl md:text-2xl font-semibold tracking-tight min-h-[40px] sm:min-h-[60px]">
            {item.title}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-2">
            {item.description}
          </p>

        </div>
      </BorderCard>
    </motion.div>
  ))}
</div>

      </div>
    </section>
  );
};

export default AboutSection;
