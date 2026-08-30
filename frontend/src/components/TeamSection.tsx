import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TeamSection = () => {
  const navigate = useNavigate();

  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await axios.get("VITE_API_URL/team");

      setMembers(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const visibleMembers = members.slice(0, 4);

  return (
    <section id="team" className="scroll-mt-20 py-24 bg-[#F8FAFC]">
      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-3xl"
        >
          <span className="text-[#00629B] font-semibold uppercase tracking-wider text-sm">
            Executive Committee
          </span>

          <h2 className="mt-4 text-4xl lg:text-5xl font-bold text-slate-900">
            Meet Our
            <span className="block text-[#00629B]">Leadership Team</span>
          </h2>

          <p className="hidden md:block mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl">
  Our chapter is driven by passionate leaders, innovators,
  researchers, and students committed to advancing technology,
  collaboration, and professional excellence.
</p>
        </motion.div>

        {/* TEAM GRID */}
        <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {visibleMembers.map((member, index) => (
            <motion.div
              key={member._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="flex flex-col items-center bg-white border border-slate-200 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                {/* AVATAR */}
                <div className="flex justify-center pt-6 pb-3">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-blue-100"
                  />
                </div>

                {/* BODY */}
                <div className="px-4 pb-0 text-center w-full">
                  <h3 className="text-base font-semibold text-slate-900 leading-snug">
                    {member.name}
                  </h3>
                  <span className="inline-block mt-2 px-3 py-1 rounded-full bg-blue-50 text-[#185FA5] text-xs font-medium">
                    {member.role}
                  </span>
                </div>

                {/* FOOTER */}
                <div className="w-full border-t border-slate-100 mt-4 px-4 py-3 flex justify-center">
                  <button
                    onClick={() => navigate(`/team/${member._id}`)}
                    className="flex items-center gap-1.5 text-[#00629B] text-xs font-semibold hover:gap-2.5 transition-all"
                  >
                    View Profile
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* VIEW ALL BUTTON */}
        <div className="mt-16 flex justify-center">
          <button
            onClick={() => navigate("/all-members")}
            className="
    px-8
    py-3
    rounded-xl
    bg-[#00629B]
    text-white
    font-medium
    hover:bg-[#00517f]
    transition
    "
          >
            View All Members
          </button>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
