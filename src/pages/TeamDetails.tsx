import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Linkedin } from "lucide-react";

const TeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<any>(null);

  useEffect(() => {
    fetchMember();
  }, [id]);

  const fetchMember = async () => {
    try {
      const res = await axios.get(
        `https://ieee-sps-website.onrender.com/team/${id}`,
      );
      setMember(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!member) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-[#00629B] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading profile...</span>
        </div>
      </div>
    );
  }

  const initials = member.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <section className="px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-2xl mx-auto">
          {/* BACK */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[#00629B] text-sm font-medium mb-8 hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Team
          </motion.button>

          {/* PROFILE CARD */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-3"
          >
            {/* Accent stripe */}
            <div className="h-1 bg-[#00629B]" />

            {/* Avatar + name block */}
            <div className="flex flex-col items-center px-6 pt-8 pb-6 gap-4">
              <div className="p-1 rounded-full border-2 border-blue-100">
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-2xl font-semibold text-[#0C447C]">
                    {initials}
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0C447C] bg-blue-50 px-3 py-1 rounded-full mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00629B]" />
                  IEEE SPS Team Member
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                  {member.name}
                </h1>
                <p className="text-sm font-semibold text-[#00629B] mt-1">
                  {member.role}
                </p>
              </div>
            </div>

            {/* Info grid */}
            <div className="border-t border-slate-100 grid grid-cols-2">
              {[
                { label: "Department", value: member.department },
                { label: "Roll Number", value: member.rollNumber },
                { label: "Reg. Number", value: member.registrationNumber },
                { label: "Email", value: member.email },
              ].map((item, i, arr) => (
                <div
                  key={item.label}
                  className={`px-5 py-4 flex flex-col gap-1
                    ${i % 2 === 0 ? "border-r border-slate-100" : ""}
                    ${i < arr.length - 2 ? "border-b border-slate-100" : ""}
                  `}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 break-all">
                    {item.value || "—"}
                  </span>
                </div>
              ))}
            </div>

            {/* Social / contact actions */}
            <div className="border-t border-slate-100 px-5 py-4 flex flex-wrap justify-center gap-2">
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg px-4 py-2 hover:border-slate-300 transition"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </a>
              )}
              {member.linkedIn && (
                <a
                  href={member.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg px-4 py-2 hover:border-slate-300 transition"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  LinkedIn
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default TeamDetails;
