import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

const TeamDetails = () => {
  const { id } = useParams();
  const [member, setMember] = useState<any>(null);

  useEffect(() => {
    fetchMember();
  }, []);

  const fetchMember = async () => {
    const res = await axios.get(`http://localhost:5000/team/${id}`);
    setMember(res.data);
  };

  const particlesInit = async (main: any) => {
    await loadFull(main);
  };

  if (!member) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden text-white">

      {/* ===== Moving Particles Background ===== */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="absolute inset-0 -z-10"
        options={{
          background: { color: "transparent" },
          fpsLimit: 60,
          particles: {
            number: { value: 50 },
            color: { value: "#00ffff" },
            links: {
              enable: true,
              color: "#00ffff",
              distance: 150,
              opacity: 0.2,
              width: 1,
            },
            move: { enable: true, speed: 1 },
            opacity: { value: 0.4 },
            size: { value: 2 },
          },
        }}
      />

      <div className="relative z-10 flex items-center justify-center py-20 px-6">

        {/* ===== Glass Profile Card ===== */}
        <div className="relative bg-white/5 backdrop-blur-xl 
                        border border-white/10 
                        rounded-3xl p-12 
                        max-w-xl w-full text-center 
                        shadow-[0_0_40px_rgba(0,255,255,0.15)]">

          {/* Glow Behind Card */}
          <div className="absolute -inset-2 bg-cyan-500/10 blur-2xl rounded-3xl"></div>

          {/* ===== Avatar ===== */}
          <div className="relative w-52 h-52 mx-auto mb-8">

            <div className="absolute inset-0 rounded-full 
                            bg-gradient-to-r from-cyan-400 to-blue-500 
                            blur-xl opacity-30 animate-pulse"></div>

            <img
              src={`http://localhost:5000/uploads/${member.photo}`}
              className="relative w-52 h-52 object-cover 
                         rounded-full border-4 border-cyan-400 
                         shadow-[0_0_25px_rgba(0,255,255,0.6)]"
            />
          </div>

          {/* ===== Name & Role ===== */}
          <h1 className="text-3xl md:text-4xl font-bold tracking-wide">
            {member.name}
          </h1>

          <p className="text-cyan-400 text-lg mt-2 mb-8">
            {member.role}
          </p>

          {/* ===== Info Section ===== */}
          <div className="space-y-3 text-gray-300 text-sm md:text-base">

            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-gray-400">Department</span>
              <span>{member.department}</span>
            </div>

            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-gray-400">Roll Number</span>
              <span>{member.rollNumber}</span>
            </div>

            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-gray-400">Registration Number</span>
              <span>{member.registrationNumber}</span>
            </div>

            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-gray-400">Email</span>
              <span>{member.email}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Phone</span>
              <span>{member.phone}</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default TeamDetails;
