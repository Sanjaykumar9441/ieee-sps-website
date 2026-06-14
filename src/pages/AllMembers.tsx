import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const AllMembers = () => {
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

  return (
    <>
      <Navbar />

      <section className="min-h-screen bg-[#F8FAFC] pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-8 inline-flex items-center gap-2 text-[#00629B] font-medium hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <span className="text-[#00629B] font-semibold uppercase tracking-wider text-sm">
              Executive Committee
            </span>

            <h1 className="mt-4 text-4xl lg:text-5xl font-bold text-slate-900">
              All
              <span className="block text-[#00629B]">Team Members</span>
            </h1>

            <p className="mt-6 text-lg text-slate-600">
              Meet the dedicated leaders, innovators and volunteers driving IEEE
              SPS Student Branch Chapter at Aditya University.
            </p>
            <p className="mt-4 text-[#00629B] font-semibold">
              Total Members: {members.length}
            </p>
          </motion.div>

          {/* Members Grid */}
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {members.map((member) => (
              <motion.div
  key={member._id}
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.4 }}
                className="h-full bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                {/* Photo */}
                <div className="pt-8 flex justify-center">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-28 h-28 rounded-full object-cover border-4 border-slate-100"
                  />
                </div>

                {/* Content */}
                <div className="p-8 text-center flex flex-col h-full">
                  <h3 className="text-xl font-semibold text-slate-900">
                    {member.name}
                  </h3>

                  <div className="mt-4">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-[#00629B] text-xs font-medium">
                      {member.role}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/team/${member._id}`)}
                    className="mt-auto pt-6 inline-flex items-center justify-center gap-2 text-[#00629B] font-semibold hover:gap-3 transition-all"
                  >
                    View Profile
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default AllMembers;
