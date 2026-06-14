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
      const res = await axios.get("https://ieee-sps-website.onrender.com/team");

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

          <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl">
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
              transition={{
                duration: 0.5,
                delay: index * 0.08,
              }}
              viewport={{ once: true }}
              className="group relative"
            >
              {/* CARD */}
              <div
                className="relative h-full bg-white
border
border-slate-200
rounded-2xl
shadow-sm
hover:shadow-lg
hover:-translate-y-1
transition-all
duration-300"
              >
                {/* IMAGE */}
                <div className="relative pt-10 flex justify-center">
                  <div className="relative">
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="
w-28
h-28
rounded-full
object-cover
border-4
border-slate-100
"
                    />
                  </div>
                </div>

                {/* CONTENT */}
                <div className="relative z-10 p-8 text-center">
                  {/* NAME */}
                  <h3 className="text-xl font-semibold text-slate-900 leading-snug">
                    {member.name}
                  </h3>

                  {/* ROLE */}
                  <div className="mt-4 flex justify-center">
                    <span
                      className="
px-3
py-1
rounded-full
bg-blue-50
text-[#00629B]
text-xs
font-medium
"
                    >
                      {member.role}
                    </span>
                  </div>

                  {/* BUTTON */}
                  <button
                    onClick={() => navigate(`/team/${member._id}`)}
                    className="
  mt-6
  inline-flex
  items-center
  gap-2
  text-[#00629B]
  font-semibold
  hover:gap-3
  transition-all
  "
                  >
                    View Profile
                    <ArrowUpRight className="w-4 h-4" />
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
