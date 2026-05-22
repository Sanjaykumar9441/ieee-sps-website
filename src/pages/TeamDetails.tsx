import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const TeamDetails = () => {
  const { id } = useParams();
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
    } catch (error) {
      console.error("Error fetching team member:", error);
    }
  };

  if (!member) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] text-white px-6 py-24">
      {/* BACKGROUND GLOWS */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-150px] left-[-100px] h-[400px] w-[400px] rounded-full bg-pink-500/10 blur-3xl" />

        <div className="absolute bottom-[-150px] right-[-100px] h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* MAIN CARD */}
        <div
          className="
        relative
        overflow-hidden
        rounded-[40px]
        border border-white/10
        bg-white/[0.03]
        backdrop-blur-2xl
        shadow-[0_0_60px_rgba(99,102,241,0.08)]
      "
        >
          {/* SUBTLE GLOW */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-indigo-500/5" />

          <div className="relative z-10 grid lg:grid-cols-[380px_1fr] gap-12 p-10 lg:p-16 items-center">
            {/* ===== LEFT PHOTO SECTION ===== */}
            <div className="flex flex-col items-center">
              {/* IMAGE CONTAINER */}
              <div className="relative">
                {/* OUTER GLOW */}
                <div className="absolute inset-0 rounded-full bg-indigo-500/30 blur-3xl scale-110" />

                <img
                  src={member.photo}
                  alt={member.name}
                  className="
                  relative
                  w-72 h-72
                  object-cover
                  rounded-full
                  border-4 border-indigo-400
                  shadow-[0_0_50px_rgba(99,102,241,0.45)]
                "
                />
              </div>

              {/* ROLE BADGE */}
              <div
                className="
              mt-8
              px-6 py-3
              rounded-full
              border border-indigo-500/20
              bg-indigo-500/10
              text-indigo-200
              text-sm
              font-medium
              backdrop-blur-xl
            "
              >
                {member.role}
              </div>
            </div>

            {/* ===== RIGHT CONTENT ===== */}
            <div>
              {/* TOP LABEL */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl mb-6">
                <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />

                <span className="text-sm text-white/70">
                  IEEE SPS Team Member
                </span>
              </div>

              {/* NAME */}
              <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
                {member.name}
              </h1>

              {/* ROLE TEXT */}
              <p className="text-xl text-indigo-300 mb-12">{member.role}</p>

              {/* INFO GRID */}
              <div className="grid sm:grid-cols-2 gap-6">
                <InfoCard label="Department" value={member.department} />

                <InfoCard label="Roll Number" value={member.rollNumber} />

                <InfoCard
                  label="Registration Number"
                  value={member.registrationNumber}
                />

                <InfoCard label="Email" value={member.email} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ===== Reusable Info Row ===== */
const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div
    className="
    rounded-2xl
    border border-white/10
    bg-white/[0.03]
    backdrop-blur-xl
    p-5
    transition-all duration-300
    hover:border-indigo-500/30
    hover:bg-white/[0.05]
  "
  >
    <p className="text-sm text-white/50 mb-2">{label}</p>

    <p className="text-lg font-medium break-words">{value}</p>
  </div>
);

export default TeamDetails;
