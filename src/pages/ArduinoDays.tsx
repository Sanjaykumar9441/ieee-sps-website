import { useState, useEffect, useRef } from "react";
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
const [menuOpen, setMenuOpen] = useState(false);
const sidebarRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      menuOpen &&
      sidebarRef.current &&
      !sidebarRef.current.contains(event.target as Node)
    ) {
      setMenuOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [menuOpen]);

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
    <div className="min-h-screen text-white relative overflow-x-hidden overflow-y-auto">

      {/* Background Video */}
      <video
  autoPlay
  loop
  muted
  playsInline
  className="fixed inset-0 w-full h-full object-cover z-0"
>
        <source src="/arduino-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/60 z-10"></div>

      {/* Particles */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="fixed inset-0 z-20"
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
{/* Mobile Menu Button */}
<button
  className="md:hidden fixed top-4 left-4 z-50 bg-black/80 p-2 rounded-lg border border-green-400"
  onClick={() => setMenuOpen(!menuOpen)}
>
  ☰
</button>

<div
  ref={sidebarRef}
  className={`fixed top-0 left-0 h-screen w-64
bg-black/90 backdrop-blur-xl
border-r border-green-500/20
shadow-[0_0_40px_rgba(0,255,200,0.1)]
p-6 flex flex-col gap-8
z-40 transform transition-transform duration-300
overflow-hidden
${menuOpen ? "translate-x-0" : "-translate-x-full"}
md:translate-x-0`}
>

  {/* ⚡ Subtle Circuit Overlay */}
  <div className="absolute inset-0 opacity-10 pointer-events-none">
    <svg
      className="w-full h-full animate-pulse"
      viewBox="0 0 200 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 0 V600 
           M60 100 H160 
           M100 200 V400 
           M40 300 H140 
           M80 500 H180"
        stroke="#00ffcc"
        strokeWidth="1"
      />
    </svg>
  </div>

  {/* Sidebar Content */}
  <div className="relative z-10">

    <div className="text-2xl font-bold text-green-400 mb-6">
      Arduino Days
    </div>

    {[
      { id: "home", icon: <Home size={20} />, label: "Home" },
      { id: "events", icon: <Calendar size={20} />, label: "Events" },
      { id: "help", icon: <HelpCircle size={20} />, label: "Help Desk" },
      { id: "about", icon: <Info size={20} />, label: "About" },
      { id: "sponsors", icon: <Handshake size={20} />, label: "Sponsors" }
    ].map((item) => (
      <button
        key={item.id}
        onClick={() => {
          setActive(item.id);
          setMenuOpen(false);
        }}
        className="relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group"
      >

        {/* Neon Active Bar */}
        {active === item.id && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-green-400 to-cyan-400 rounded-r shadow-[0_0_12px_rgba(0,255,200,0.8)]"
          />
        )}

        <span
          className={`transition-all duration-300 ${
            active === item.id
              ? "text-green-400"
              : "text-gray-400 group-hover:text-green-300"
          }`}
        >
          {item.icon}
        </span>

        <span
          className={`font-medium transition-all duration-300 ${
            active === item.id
              ? "text-green-400"
              : "text-gray-400 group-hover:text-green-300"
          }`}
        >
          {item.label}
        </span>

      </button>
    ))}

  </div>

</div>


      {/* Main Content with Smooth Animation */}
      <div className="relative z-30 md:ml-64 min-h-screen">
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
{active === "home" && (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8 }}
   className="relative w-full flex flex-col items-center justify-start pt-28 md:pt-20 pb-16 px-4 md:px-10 text-center space-y-6"
  >

    {/* 🛰️ IoT Radar Scanning Animation */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
      <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] opacity-20">

        {/* Outer Circle */}
        <div className="absolute inset-0 border border-cyan-400 rounded-full animate-pulse opacity-40" />

        {/* Middle Circle */}
        <div className="absolute inset-6 border border-green-400 rounded-full animate-pulse" />

        {/* Inner Circle */}
        <div className="absolute inset-16 border border-cyan-300 rounded-full" />

        {/* Rotating Scan Line */}
        <div className="absolute inset-0 rounded-full border-t-2 border-green-400 animate-spin-slow" />

      </div>
    </div>

    {/* 🔹 Content (above radar) */}
    <div className="relative z-10">

      {/* 🔹 Logos */}
      <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
        <img src="/logo1.png" alt="Logo 1" className="h-10 md:h-16 object-contain" />
        <img src="/logo2.png" alt="Logo 2" className="h-10 md:h-16 object-contain" />
        <img src="/logo3.png" alt="Logo 3" className="h-10 md:h-16 object-contain" />
      </div>

      {/* here i need to add ece presents*/}

      {/* 🔥 Auto-Scaling Title */}
      <h1 className="
        text-[9vw] sm:text-5xl md:text-7xl
        font-extrabold
        tracking-wide
        leading-tight
        bg-gradient-to-r from-green-400 via-cyan-400 to-green-300
        bg-clip-text text-transparent
      ">
        ARDUINO DAYS 2K26
      </h1>

      <p className="text-xs sm:text-sm md:text-base text-gray-300 max-w-2xl mx-auto px-2">
        A 4-Day Technical Event focused on Arduino, IoT,
        Embedded Systems, and Real-Time Project Development.
      </p>

      {/* Date & Venue */}
<div className="w-full flex justify-center">
  <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
    <div className="px-4 md:px-6 py-2 md:py-3 rounded-full bg-green-500/20 border border-green-400 text-green-300 text-xs sm:text-sm md:text-base">
      📅 March 23–26, 2026
    </div>

    <div className="px-4 md:px-6 py-2 md:py-3 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs sm:text-sm md:text-base">
      📍 Aditya University
    </div>
  </div>
</div>

{/* Tagline */}
<h3 className="text-xs sm:text-sm md:text-md text-yellow-400 tracking-wide mt-6">
  Innovation • Creativity • Real-Time Learning
</h3>

{/* Posters */}
<div className="w-full flex justify-center">
  <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 mt-6">
    <img
      src="/poster1.jpeg"
      alt="Poster 1"
      className="w-56 sm:w-64 md:w-72 rounded-xl shadow-lg border border-green-400/30"
    />
    <img
      src="/poster2.jpeg"
      alt="Poster 2"
      className="w-56 sm:w-64 md:w-72 rounded-xl shadow-lg border border-cyan-400/30"
    />
  </div>
</div>
</div>

  </motion.div>
)}

            {/* EVENTS */}
            {active === "events" && (
  <div className="w-full max-w-6xl px-4 md:px-10 pt-24 pb-16 mx-auto relative z-30">

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

            {/* ABOUT SECTION */}
            {active === "about" && (
  <div className="w-full max-w-5xl px-10 py-16 mx-auto text-center">

    <h1 className="text-5xl font-bold mb-16 bg-gradient-to-r from-green-400 via-cyan-400 to-green-300 bg-clip-text text-transparent">
      About Us
    </h1>

    <div className="bg-white/5 backdrop-blur-md border border-green-400/20 rounded-2xl p-10 space-y-6">

      <p className="text-gray-300 leading-relaxed text-lg">
        <span className="text-green-400 font-semibold">Arduino Days 2K26</span> 
         is a 4-day technical event designed to inspire innovation, creativity,
        and hands-on learning in the fields of Arduino, IoT, Embedded Systems,
        and Real-Time Project Development.
      </p>

      <p className="text-gray-300 leading-relaxed text-lg">
        This event brings together students from all branches to collaborate,
        learn emerging technologies, and transform ideas into real-world
        working prototypes. Through workshops, hackathons, and project expos,
        participants gain practical exposure beyond classroom learning.
      </p>

      <p className="text-gray-300 leading-relaxed text-lg">
        Our mission is to promote technical excellence, teamwork, and
        problem-solving skills while building a strong community of
        passionate innovators and future engineers.
      </p>

    </div>

    {/* Website Info Section */}
    <div className="mt-16">

      <h2 className="text-3xl font-bold mb-8 text-cyan-400">
        About This Website
      </h2>

      <div className="bg-white/5 backdrop-blur-md border border-cyan-400/20 rounded-2xl p-10 space-y-6">

        <p className="text-gray-300 leading-relaxed">
          This website serves as the official digital platform for Arduino Days 2K26.
          It provides complete information about events, registration details,
          coordinators, schedules, and announcements.
        </p>

        <p className="text-gray-300 leading-relaxed">
          Built with modern web technologies, the platform ensures a smooth,
          interactive, and responsive user experience across devices.
          It reflects the innovative spirit and technical excellence
          of the event itself.
        </p>

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