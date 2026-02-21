import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const TeamSection = () => {

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

  return (
    <section id="team" className="py-16 px-6 text-white bg-black">

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Team
          </h2>

          <div className="w-20 h-[2px] bg-cyan-400 mx-auto mb-6" />
        </motion.div>

        {/* Team Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

          {(showAll ? members : members.slice(0, 8)).map((member) => (
            <div
              key={member._id}
              className="group bg-zinc-900/60 backdrop-blur-md 
                         border border-white/10 
                         rounded-xl p-6 text-center 
                         hover:border-cyan-400/50 
                         hover:shadow-[0_0_25px_rgba(0,255,255,0.15)] 
                         transition-all duration-300"
            >

              <div className="relative w-28 h-28 mx-auto mb-4">
                <img
                  src={`https://ieee-sps-backend.onrender.com/uploads/${member.photo}`}
                  className="w-28 h-28 object-cover rounded-full border-2 border-cyan-400/40 
                             group-hover:border-cyan-400 transition-all duration-300"
                />
              </div>

              <h3 className="text-lg font-semibold tracking-wide mb-1">
                {member.name}
              </h3>

              <p className="text-cyan-400 text-sm mb-3 tracking-wide">
                {member.role}
              </p>

              <Link
                to={`/team/${member._id}`}
                className="inline-block text-xs px-3 py-1.5 
                           border border-cyan-400/50 
                           rounded-full text-cyan-400
                           hover:bg-cyan-400 hover:text-black 
                           transition-all duration-300"
              >
                View Details
              </Link>

            </div>
          ))}

        </div>

        {/* View All Button */}
        {members.length > 8 && (
          <div className="text-center mt-10">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-5 py-2 border border-cyan-400 
                         rounded-full text-sm text-cyan-400 
                         hover:bg-cyan-400 hover:text-black 
                         transition-all duration-300"
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
