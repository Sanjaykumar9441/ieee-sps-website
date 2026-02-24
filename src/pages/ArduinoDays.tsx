import { useState } from "react";
import {
  Home,
  Calendar,
  HelpCircle,
  Info,
  Handshake
} from "lucide-react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import { motion, AnimatePresence } from "framer-motion";

const particlesInit = async (main: any) => {
  await loadFull(main);
};

const ArduinoDays = () => {
  const [active, setActive] = useState("home");

  const studentCoordinators = [
    { name: "Student Name 1", designation: "Vice Chair", department: "ECE", roll: "23A91A0001", phone: "9876543210" },
    { name: "Student Name 2", designation: "Secretary", department: "CSE", roll: "23A91A0002", phone: "9876543211" },
    { name: "Student Name 3", designation: "Treasurer", department: "IT", roll: "23A91A0003", phone: "9876543212" },
    { name: "Student Name 4", designation: "Coordinator", department: "ECE", roll: "23A91A0004", phone: "9876543213" },
    { name: "Student Name 5", designation: "Coordinator", department: "CSE", roll: "23A91A0005", phone: "9876543214" }
  ];

  const facultyCoordinators = [
    { name: "Faculty Name 1", designation: "Associate Professor", department: "ECE", phone: "9876543220" },
    { name: "Faculty Name 2", designation: "Assistant Professor", department: "CSE", phone: "9876543221" },
    { name: "Faculty Name 3", designation: "Associate Professor", department: "IT", phone: "9876543222" }
  ];

  return (
    <div className="min-h-screen flex text-white relative overflow-hidden">

      {/* Background Video */}
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="/arduino-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/60 z-10"></div>

      {/* Particles */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="absolute inset-0 z-20"
        options={{
          background: { color: "transparent" },
          fpsLimit: 60,
          particles: {
            number: { value: 60 },
            color: { value: ["#00ff99", "#00ffff"] },
            links: { enable: true, color: "#00ffcc", distance: 150, opacity: 0.4, width: 1 },
            move: { enable: true, speed: 1.5 },
            opacity: { value: 0.5 },
            size: { value: 2 }
          }
        }}
      />

      {/* Sidebar */}
      <div className="w-64 bg-black/80 backdrop-blur-xl border-r border-green-500/20 p-6 flex flex-col gap-8 z-30">
        <div className="text-2xl font-bold text-green-400">Arduino Days</div>

        {[
          { id: "home", icon: <Home size={20} />, label: "Home" },
          { id: "events", icon: <Calendar size={20} />, label: "Events" },
          { id: "help", icon: <HelpCircle size={20} />, label: "Help Desk" },
          { id: "about", icon: <Info size={20} />, label: "About" },
          { id: "sponsors", icon: <Handshake size={20} />, label: "Sponsors" }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`flex items-center gap-3 ${
              active === item.id
                ? "text-green-400"
                : "text-gray-400 hover:text-green-400"
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {/* Main Content with Smooth Animation */}
      <div className="flex-1 flex items-start justify-center z-30 relative overflow-y-auto">

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >

            {/* HOME */}
<div className="flex-1 flex items-center justify-center z-30 relative">
  {active === "home" && (
    <div className="text-center p-16 max-w-4xl relative z-30">

      {/* Title */}
      <h1 className="text-6xl md:text-7xl font-extrabold mb-6 tracking-widest bg-gradient-to-r from-green-400 via-cyan-400 to-green-300 bg-clip-text text-transparent"> ARDUINO DAYS 2K26 </h1>

      {/* Description */}
      <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed"> A 4-Day Technical Event focused on Arduino, IoT, Embedded Systems, and Real-Time Project Development. </p>

      {/* Date & Location */}
      <div className="flex justify-center gap-6 mt-6">

        <div className="px-6 py-3 rounded-full bg-green-500/20 border border-green-400 text-green-300">
          📅 March 23–26, 2026
        </div>

       <div className="px-6 py-3 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300">
          📍 Aditya University
        </div>

      </div>

    </div>
  )}

</div>

            {/* EVENTS */}
            {active === "events" && (
  <div className="w-full max-w-6xl px-4 md:px-10 py-16 mx-auto relative z-30">

    <h1 className="text-3xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-green-400 via-cyan-400 to-green-300 bg-clip-text text-transparent">
  Events
</h1>

    <div className="grid md:grid-cols-3 gap-10">

      {/* Workshop */}
      <div className="relative group">
        <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-green-400 via-cyan-400 via-purple-500 via-pink-500 to-yellow-400 blur opacity-70 group-hover:opacity-100 transition duration-500 animate-gradient"></div>

        <div className="relative bg-black/80 backdrop-blur-md rounded-2xl p-8 z-10">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Two-Day Workshop
          </h2>
          <p className="text-gray-300 mb-2">📅 23–24 March 2026</p>
          <p className="text-gray-300 mb-2">💰 Registration Fee: ₹200</p>
          <p className="text-gray-400 text-sm mb-6">
            All students from any branch can participate.
          </p>
          <a
            href="https://your-workshop-link.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-black font-semibold px-6 py-2 rounded-full hover:scale-105 transition"
          >
            Register Now
          </a>
        </div>
      </div>

    {/* ================= Hackathon ================= */}
    <div className="relative group">
        <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-green-400 via-cyan-400 via-purple-500 via-pink-500 to-yellow-400 blur opacity-70 group-hover:opacity-100 transition duration-500 animate-gradient"></div>

        <div className="relative bg-black/80 backdrop-blur-md rounded-2xl p-8 z-10">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Full-Day Hackathon
          </h2>
          <p className="text-gray-300 mb-2">📅 25 March 2026</p>
          <p className="text-gray-300 mb-2">💰 Registration Fee: ₹200</p>
          <p className="text-gray-400 text-sm mb-6">
            All students from any branch can participate.
          </p>
          <a
            href="https://your-hackathon-link.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-black font-semibold px-6 py-2 rounded-full hover:scale-105 transition"
          >
            Register Now
          </a>
        </div>
      </div>

    {/* ================= Project Expo ================= */}
    <div className="relative group">
        <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-green-400 via-cyan-400 via-purple-500 via-pink-500 to-yellow-400 blur opacity-70 group-hover:opacity-100 transition duration-500 animate-gradient"></div>

        <div className="relative bg-black/80 backdrop-blur-md rounded-2xl p-8 z-10">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Project Expo
          </h2>
          <p className="text-gray-300 mb-2">📅 25 March 2026</p>
          <p className="text-gray-300 mb-2">💰 Registration Fee: ₹200</p>
          <p className="text-gray-400 text-sm mb-6">
            All students from any branch can participate.
          </p>
          <a
            href="https://your-hackathon-link.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-black font-semibold px-6 py-2 rounded-full hover:scale-105 transition"
          >
            Register Now
          </a>
        </div>
      </div>
      </div>
  </div>
)}

            {/* HELP DESK */}
            {active === "help" && (
              <div className="w-full max-w-6xl px-10 py-16 mx-auto">
                <h1 className="text-5xl font-bold text-center mb-16 bg-gradient-to-r from-green-400 via-cyan-400 to-green-300 bg-clip-text text-transparent">
                  Help Desk
                </h1>

                <div className="grid md:grid-cols-2 gap-16">

                  {/* Students */}
                  <div>
                    <h2 className="text-2xl font-bold text-green-400 text-center mb-8">
                      Student Coordinators
                    </h2>

                    <div className="space-y-6">
                      {studentCoordinators.map((member, index) => (
                        <div key={index} className="bg-white/5 backdrop-blur-md border border-green-400/20 rounded-xl p-5 text-center">
                          <h3 className="text-lg font-semibold mb-2">{member.name}</h3>
                          <p className="text-sm text-gray-300">{member.designation}</p>
                          <p className="text-sm text-gray-400">{member.department}</p>
                          <p className="text-sm text-gray-400">{member.roll}</p>
                          <a href={`tel:${member.phone}`} className="text-green-400 font-semibold mt-3 block">
                            📞 {member.phone}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Faculty */}
                  <div>
                    <h2 className="text-2xl font-bold text-cyan-400 text-center mb-8">
                      Faculty Coordinators
                    </h2>

                    <div className="space-y-6">
                      {facultyCoordinators.map((faculty, index) => (
                        <div key={index} className="bg-white/5 backdrop-blur-md border border-cyan-400/20 rounded-xl p-5 text-center">
                          <h3 className="text-lg font-semibold mb-2">{faculty.name}</h3>
                          <p className="text-sm text-gray-300">{faculty.designation}</p>
                          <p className="text-sm text-gray-400">{faculty.department}</p>
                          <a href={`tel:${faculty.phone}`} className="text-cyan-400 font-semibold mt-3 block">
                            📞 {faculty.phone}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
};

export default ArduinoDays;