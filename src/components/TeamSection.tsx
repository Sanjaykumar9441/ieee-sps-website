import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const TeamSection = () => {

  const [members, setMembers] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 640); // Tailwind sm breakpoint
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

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

  const initialLimit = isMobile ? 4 : 8;

  return (
    <section
      id="team"
      className="py-16 px-4 sm:px-6 bg-background text-foreground transition-colors duration-300"
    >
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

          <div className="w-20 h-[2px] bg-primary mx-auto mb-6" />
        </motion.div>

        {/* Team Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

          {(showAll
            ? members
            : members.slice(0, initialLimit)
          ).map((member) => (

            <div
              key={member._id}
              className="group bg-card backdrop-blur-md
                         border border-border
                         rounded-xl p-5 sm:p-6 text-center
                         hover:border-primary/50
                         hover:shadow-[0_0_25px_hsl(var(--primary)/0.25)]
                         transition-all duration-300"
            >

              <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-4">
                <img
                  src={`https://ieee-sps-website.onrender.com/uploads/${member.photo}`}
                  className="w-full h-full object-cover rounded-full border-2 border-primary/40
                             group-hover:border-primary transition-all duration-300"
                />
              </div>

              <h3 className="text-base sm:text-lg font-semibold tracking-wide mb-1">
                {member.name}
              </h3>

              <p className="text-primary text-xs sm:text-sm mb-3 tracking-wide">
                {member.role}
              </p>

              <Link
                to={`/team/${member._id}`}
                className="inline-block text-xs px-3 py-1.5
                           border border-primary/50
                           rounded-full text-primary
                           hover:bg-primary hover:text-primary-foreground
                           transition-all duration-300"
              >
                View Details
              </Link>

            </div>
          ))}

        </div>

        {/* View All Button */}
        {members.length > initialLimit && (
          <div className="text-center mt-10">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-6 py-2 border border-primary
                         rounded-full text-sm text-primary
                         hover:bg-primary hover:text-primary-foreground
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