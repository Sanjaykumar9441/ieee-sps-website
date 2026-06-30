import { motion } from "framer-motion";
import { Target, Eye, CheckCircle } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="scroll-mt-20 py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="text-[#00629B] font-semibold tracking-wider uppercase text-sm">
              Who We Are
            </span>

            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
              IEEE Signal Processing Society
              <span className="block text-[#00629B] mt-2">
                Student Branch Chapter
              </span>
            </h2>

            <p className="hidden md:block mt-8 text-lg text-slate-600 leading-relaxed">
              The IEEE Signal Processing Society Student Branch Chapter at
              Aditya University is dedicated to fostering technical excellence,
              innovation, and research among students. Through workshops,
              seminars, technical events, and collaborative projects, the
              chapter provides opportunities for students to explore emerging
              technologies and develop industry-relevant skills.
            </p>

            <p className="hidden md:block mt-6 text-lg text-slate-600 leading-relaxed">
              Our mission is to create a vibrant technical community that
              encourages knowledge sharing, professional growth, leadership, and
              innovation while contributing to advancements in signal
              processing, artificial intelligence, and related technologies.
            </p>
          </motion.div>

          {/* RIGHT CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Mission */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-[#00629B]" />
                <h3 className="text-xl font-semibold text-slate-900">
                  Our Mission
                </h3>
              </div>

              <p className="text-slate-600 leading-relaxed">
                To inspire students toward innovation in signal processing,
                artificial intelligence, and emerging technologies through
                impactful technical programs, research initiatives, and
                collaborative learning.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-6 h-6 text-[#00629B]" />
                <h3 className="text-xl font-semibold text-slate-900">
                  Our Vision
                </h3>
              </div>

              <p className="text-slate-600 leading-relaxed">
                To become a leading student community that promotes technical
                excellence, research culture, and innovation in the field of
                signal processing and related technologies.
              </p>
            </div>

            {/* Objectives */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                Our Objectives
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#00629B]" />
                  <span className="text-slate-700">
                    Conduct Technical Workshops & Seminars
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#00629B]" />
                  <span className="text-slate-700">
                    Promote Research & Innovation
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#00629B]" />
                  <span className="text-slate-700">
                    Strengthen Industry Collaboration
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#00629B]" />
                  <span className="text-slate-700">
                    Develop Leadership & Professional Skills
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
