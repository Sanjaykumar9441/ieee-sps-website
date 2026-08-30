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
      const res = await axios.get("VITE_API_URL/team");

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

            <p className="hidden md:block mt-6 text-lg text-slate-600">
  Meet the dedicated leaders, innovators and volunteers driving IEEE
  SPS Student Branch Chapter at Aditya University.
</p>
            <p className="mt-4 text-[#00629B] font-semibold">
              Total Members: {members.length}
            </p>
          </motion.div>

          {/* Members Grid */}
         <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
            {members.map((member, index) => (
              <motion.div
                key={member._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
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
        </div>
      </section>

      <Footer />
    </>
  );
};

export default AllMembers;
