import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TeamSection = () => {
  const navigate = useNavigate();

  const [members, setMembers] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await axios.get("https://ieee-sps-website.onrender.com/team");

      setMembers(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const visibleMembers = showAll ? members : members.slice(0, 8);

  return (
    <section id="team" className="relative py-32 overflow-hidden bg-background">
      {/* BACKGROUND LIGHTS */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full" />

      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-500/10 blur-[120px] rounded-full" />

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-3xl"
        >
          <div className="inline-flex px-4 py-2 rounded-full border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 backdrop-blur-xl text-sm text-foreground/70 mb-6">
            Our Team
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold leading-tight text-foreground">
            Meet The Minds Behind
            <span className="block mt-3 bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              IEEE SPS
            </span>
          </h2>

          <p className="mt-8 text-lg leading-relaxed dark:text-slate-300 text-slate-600 max-w-2xl">
            Our chapter is driven by passionate innovators, technical leaders,
            researchers, and students committed to advancing technology and
            collaboration.
          </p>
        </motion.div>

        {/* TEAM GRID */}
        <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {visibleMembers.map((member, index) => (
            <motion.div
              key={member._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.08,
              }}
              viewport={{ once: true }}
              className="group relative"
            >
              {/* CARD */}
              <div className="relative h-full rounded-[30px] border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 backdrop-blur-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-indigo-500/30">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition duration-500" />
                {/* TOP LIGHT */}
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-white/10 to-transparent" />

                {/* IMAGE */}
                <div className="relative pt-10 flex justify-center">
                  <div className="relative">
                    {/* GLOW */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-pink-500/20 blur-2xl scale-125 opacity-0 group-hover:opacity-100 transition-all duration-500" />

                    <img
                      src={member.photo}
                      alt={member.name}
                      className="relative w-28 h-28 rounded-full object-cover border dark:border-white/10 border-black/5"
                    />
                  </div>
                </div>

                {/* CONTENT */}
                <div className="relative z-10 p-8 text-center">
                  {/* NAME */}
                  <h3 className="text-xl font-semibold text-foreground leading-snug">
                    {member.name}
                  </h3>

                  {/* ROLE */}
                  <div className="mt-4 inline-flex px-3 py-1 rounded-full border border-white/10 bg-white/5 text-indigo-300 text-xs font-medium">
                    {member.role}
                  </div>

                  {/* BUTTON */}
                  <button
                    onClick={() => navigate(`/team/${member._id}`)}
                    className="mt-8 inline-flex items-center gap-2 text-foreground/80 hover:text-pink-400 transition-all duration-300 group/button"
                  >
                    <span className="relative">
                      View Profile
                      <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-gradient-to-r from-indigo-400 to-pink-400 transition-all duration-300 group-hover/button:w-full" />
                    </span>

                    <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover/button:-translate-y-1 group-hover/button:translate-x-1" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* VIEW ALL BUTTON */}
        {members.length > 8 && (
          <div className="mt-16 flex justify-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-8 py-4 rounded-full border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 backdrop-blur-xl text-foreground hover:bg-white/10 transition-all duration-300"
            >
              {showAll ? "Show Less" : "View All Members"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default TeamSection;
