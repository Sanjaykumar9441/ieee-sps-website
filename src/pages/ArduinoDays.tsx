import { useState, useEffect, useRef } from "react";
import { Home, HelpCircle, Info, Handshake } from "lucide-react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import { motion, AnimatePresence } from "framer-motion";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Users, IndianRupee, Calendar } from "lucide-react";
const particlesInit = async (main: any) => {
  await loadFull(main);
};

const ArduinoDays = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
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

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);
    };

    if (active === "rules") {
      window.addEventListener("scroll", handleScroll);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [active]);

  const studentCoordinators = [
    {
      name: "B. Navya",
      designation: "Chair",
      department: "ECE",
      roll: "24B11EC037",
      phone: " 6301443410",
    },
    {
      name: "Ch. Sanjay Kumar",
      designation: "Vice Chair",
      department: "ECE",
      roll: "24B11EC057",
      phone: "7095009441",
    },
    {
      name: "S. Veneela",
      designation: "Secretary",
      department: "ECE",
      roll: "24B11EC279",
      phone: "7995971239",
    },
    {
      name: "J. Rakesh",
      designation: "Treasurer",
      department: "ECE",
      roll: "24B11EC115",
      phone: "8309873938",
    },
    {
      name: "Ch. Naveen Sai",
      designation: "IEEE Member",
      department: "ECE",
      roll: "24B11EC048",
      phone: "7842443089",
    },
  ];

  const facultyCoordinators = [
    {
      name: "Mr. S. Jagadeesh",
      designation: "Assistant Professor",
      department: "ECE",
      phone: "9440722720",
    },
  ];

  const scrollToMap = () => {
    const section = document.getElementById("community-map");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      className="
min-h-screen
bg-gradient-to-br from-[#050a12] via-[#081420] to-[#050a12]
relative
text-white
overflow-x-hidden
overflow-y-auto
"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,255,200,0.06),transparent_40%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(0,150,255,0.06),transparent_40%)] pointer-events-none"></div>

      {/* Particles */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="fixed inset-0 z-20 pointer-events-none"
        options={{
          background: { color: "transparent" },
          fpsLimit: 60,
          particles: {
            number: { value: 60 },
            color: { value: ["#00ff99", "#00ffff"] },
            links: {
              enable: true,
              color: "#00ffcc",
              distance: 150,
              opacity: 0.4,
              width: 1,
            },
            move: { enable: true, speed: 1.5 },
            opacity: { value: 0.5 },
            size: { value: 2 },
          },
        }}
      />

      {/* Sidebar */}
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-black/80 p-2 rounded-lg border border-green-400"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <Menu size={22} />
      </button>
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-screen w-64
bg-black/90 backdrop-blur-xl
border-r border-green-500/20
shadow-[0_0_40px_rgba(0,255,200,0.1)]
p-6 flex flex-col gap-8
z-50 transform transition-transform duration-300
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
          <div className="text-lg md:text-2xl font-bold text-green-400 mb-6 leading-tight">
            Arduino Days 2026
          </div>

          {[
            { id: "home", icon: <Home size={20} />, label: "Home" },
            { id: "events", icon: <Calendar size={20} />, label: "Events" },
            {
              id: "rules",
              icon: <FileText size={20} />,
              label: "Rules & Regulations",
            },
            { id: "help", icon: <HelpCircle size={20} />, label: "Help Desk" },
            { id: "about", icon: <Info size={20} />, label: "About" },
            {
              id: "sponsors",
              icon: <Handshake size={20} />,
              label: "Sponsors",
            },
            { id: "main", icon: <Home size={20} />, label: "Main Website" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "main") {
                  window.open(
                    "https://ieee-sps-website-seven.vercel.app/",
                    "_blank",
                  );
                } else {
                  setActive(item.id);
                  setMenuOpen(false);
                }
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
      <div className="relative z-10 md:ml-64 min-h-screen">
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
              <>
                {/* ================= HOME HERO ================= */}
                <motion.section
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="relative min-h-screen flex flex-col justify-center items-center px-6 md:px-12 text-center space-y-10 pb-24"
                >
                  {/* Logos */}
                  <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14">
                    <img
                      src="/logo1.png"
                      alt="Logo 1"
                      className="h-10 md:h-14 object-contain"
                    />
                    <img
                      src="/logo2.png"
                      alt="Logo 2"
                      className="h-10 md:h-14 object-contain"
                    />
                    <img
                      src="/logo3.png"
                      alt="Logo 3"
                      className="h-10 md:h-14 object-contain"
                    />
                  </div>

                  {/* Title */}
                  <div className="space-y-6">
                    <img
                      src="/titlelogo.png"
                      alt="Arduino Days Logo"
                      className="w-[85vw] sm:w-[550px] md:w-[750px] mx-auto object-contain"
                    />

                    <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-3xl mx-auto">
                      A 4-Day Technical Event focused on Arduino, IoT, Embedded
                      Systems, and Real-Time Project Development.
                    </p>
                  </div>

                  {/* Date */}
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="px-6 py-3 rounded-full bg-green-500/20 border border-green-400 text-green-300 text-sm md:text-base">
                      <p className="text-gray-300 mb-2 flex items-center gap-2">
                        <Calendar size={18} className="text-cyan-400" />
                        <span>
                          March 23<sup>rd</sup> – 26<sup>th</sup>, 2026
                        </span>
                      </p>
                    </div>

                    <div className="px-6 py-3 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-sm md:text-base">
                      📍 Aditya University
                    </div>
                  </div>

                  {/* Tagline */}
                  <h3 className="text-sm md:text-lg text-yellow-400 tracking-wide">
                    Innovation • Creativity • Real-Time Learning
                  </h3>

                  {/* Scroll Arrow */}
                  <button
                    onClick={scrollToMap}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce cursor-pointer"
                  >
                    <span className="text-gray-400 text-xs tracking-wider mb-2">
                      Scroll
                    </span>

                    <div className="w-6 h-10 border-2 border-cyan-400 rounded-full flex items-start justify-center p-1">
                      <div className="w-1.5 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                    </div>
                  </button>
                </motion.section>

                {/* ================= MAP SECTION ================= */}
                <section
                  id="community-map"
                  className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-20 space-y-8"
                >
                  <h2 className="text-xl md:text-3xl font-semibold text-cyan-400 tracking-wide text-center">
                    Or organise a Community event around the world
                  </h2>

                  <div
                    className="
        w-full
        max-w-5xl
        bg-white/[0.05]
        backdrop-blur-xl
        border border-white/10
        rounded-2xl
        shadow-[0_10px_40px_rgba(0,0,0,0.5)]
        p-4
      "
                  >
                    <img
                      src="/map.png"
                      alt="Community Events Map"
                      className="w-full h-[260px] sm:h-[350px] md:h-[500px] object-cover rounded-xl"
                    />
                  </div>
                </section>
              </>
            )}

            {/* 🌍 Community Event Section */}

            {/* EVENTS */}
            {active === "events" && (
              <div className="w-full max-w-6xl px-4 md:px-10 pt-24 pb-16 mx-auto relative z-30">
                <h1 className="text-3xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-green-400 via-cyan-400 to-green-300 bg-clip-text text-transparent">
                  Events
                </h1>

                <div className="grid md:grid-cols-2 gap-10 items-stretch">
                  {/* ================== Skill Forze + Buildathon ============ */}
                  <div className="relative group">
                    <div className="absolute -inset-[3px] rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 via-pink-500 to-purple-600 blur opacity-90 transition duration-500"></div>

                    <div className="relative bg-black/80 backdrop-blur-md rounded-2xl p-8 z-10 h-full flex flex-col">
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        ★ Best Value
                      </div>
                      <h2 className="text-2xl font-bold mb-4 text-white">
                        Skill Forze + Buildathon
                      </h2>

                      <p className="text-gray-300 mb-2">
                        • Two-Day Workshop on Arduino and IoT Fundamentals
                      </p>

                      <p className="text-gray-300 mb-2">
                        • Full-Day Hackathon on Embedded/IoT Solutions
                      </p>

                      <p className="text-gray-300 mb-2">
                        • Project Expo showcasing hackathon outcomes
                      </p>
                      {/* Team Size */}
                      <p className="text-gray-300 mb-2 flex items-center gap-2">
                        <Users size={18} className="text-cyan-400" />
                        <span>Team Size: 2–4 Members</span>
                      </p>

                      <p className="text-gray-300 mb-2 flex items-center gap-2">
                        <Calendar size={18} className="text-cyan-400" />
                        <span>
                          23<sup>rd</sup> – 25<sup>th</sup> March 2026
                        </span>
                      </p>

                      {/* Event Fee */}
                      <p className="text-gray-300 mb-1 flex items-center gap-2">
                        <IndianRupee size={18} className="text-cyan-400" />
                        <span>Event Fee: ₹200 per person</span>
                      </p>
                      <p className="text-gray-400 text-sm mb-6">
                        All students from any branch can participate.
                      </p>
                      <div className="mt-auto">
                        <button
                          onClick={() => navigate("/register?event=combo")}
                          className="inline-block bg-white text-black font-semibold px-6 py-2 rounded-full hover:scale-105 transition"
                        >
                          Register Now
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ================= Buildathon ================= */}
                  <div className="relative group">
                    <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-green-400 via-cyan-400 via-purple-500 via-pink-500 to-yellow-400 blur opacity-70 group-hover:opacity-100 transition duration-500 animate-gradient"></div>

                    <div className="relative bg-black/80 backdrop-blur-md rounded-2xl p-8 z-10 h-full flex flex-col">
                      <h2 className="text-2xl font-bold mb-4 text-white">
                        Buildathon
                      </h2>

                      <p className="text-gray-300 mb-2">
                        • Full-Day Hackathon on Embedded/IoT Solutions
                      </p>

                      <p className="text-gray-300 mb-2">
                        • Project Expo showcasing hackathon outcomes
                      </p>

                      {/* Team Size */}
                      <p className="text-gray-300 mb-2 flex items-center gap-2">
                        <Users size={18} className="text-cyan-400" />
                        <span>Team Size: 2–4 Members</span>
                      </p>

                      <p className="text-gray-300 mb-2 flex items-center gap-2">
                        <Calendar size={18} className="text-cyan-400" />
                        <span>
                          25<sup>th</sup> March 2026
                        </span>
                      </p>

                      {/* Event Fee */}
                      <p className="text-gray-300 mb-1 flex items-center gap-2">
                        <IndianRupee size={18} className="text-cyan-400" />
                        <span>Event Fee: ₹100 per person</span>
                      </p>
                      <p className="text-gray-400 text-sm mb-6">
                        All students from any branch can participate.
                      </p>
                      <div className="mt-auto">
                        <button
                          onClick={() => navigate("/register?event=buildathon")}
                          className="inline-block bg-white text-black font-semibold px-6 py-2 rounded-full hover:scale-105 transition"
                        >
                          Register Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {active === "rules" && (
              <div className="w-full max-w-5xl px-6 md:px-10 py-16 mx-auto space-y-16">
                <h1 className="text-2xl md:text-3xl font-bold text-center bg-gradient-to-r from-green-400 via-cyan-400 to-green-300 bg-clip-text text-transparent">
                  Rules & Regulations
                </h1>

                {/* ================= GENERAL RULES ================= */}
                <div className="bg-white/5 backdrop-blur-xl border border-green-400/20 rounded-2xl p-8 space-y-6">
                  <h2 className="text-2xl font-semibold text-green-400">
                    Event Rules & Guidelines
                  </h2>

                  <ul className="space-y-3 text-gray-300 text-base md:text-lg list-disc list-inside">
                    <li>The event is open to all branches and all years.</li>
                    <li>Participants must carry a valid student ID card.</li>
                    <li>
                      A working laptop is mandatory with the latest Arduino IDE
                      installed before the event.
                    </li>
                    <li>Participation certificates will be provided.</li>
                    <li>Accommodation will be provided as per norms.</li>
                  </ul>
                </div>

                {/* ================= SKILL FORZE ================= */}
                <div className="bg-white/5 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-8 space-y-6">
                  <h2 className="text-2xl font-semibold text-cyan-400">
                    <span>
                      Skill Forze (23<sup>rd</sup> & 24<sup>th</sup> March) –
                      Workshop Guidelines
                    </span>
                  </h2>

                  <ul className="space-y-3 text-gray-300 text-base md:text-lg list-disc list-inside">
                    <li>Team registration is compulsory.</li>
                    <li>Team size: 2–4 members.</li>
                    <li>The workshop covers Arduino and IoT Fundamentals.</li>
                    <li>Active participation on both days is required.</li>
                    <li>
                      Teams are encouraged to participate in the Buildathon.
                    </li>
                    <div className="mt-6 flex justify-center">
                      <button
  onClick={() => window.location.href="/register?event=combo"}
  className="px-6 py-3 rounded-lg bg-cyan-400 text-black font-semibold
             hover:scale-105 transition shadow-lg shadow-cyan-400/30
             animate-pulse"
>
  Register for Skill Forze + Buildathon
</button>
                    </div>
                  </ul>
                </div>

                {/* ================= BUILDATHON ================= */}
                <div className="bg-white/5 backdrop-blur-xl border border-yellow-400/20 rounded-2xl p-8 space-y-6">
                  <h2 className="text-2xl font-semibold text-yellow-400">
                    Buildathon (25<sup>th</sup> March) – Hackathon Guidelines
                  </h2>

                  <ul className="space-y-3 text-gray-300 text-base md:text-lg list-disc list-inside">
                    <li>Team size: 2–4 members.</li>
                    <li>
                      Problem statements will be provided by the organizers.
                    </li>
                    <li>
                      Projects must be original and developed during the event.
                    </li>
                    <li>Minimum one working laptop per team is mandatory.</li>
                    <li>
                      Participants may choose to attend only Buildathon if
                      preferred.
                    </li>
                    <li>Teams must present a working prototype.</li>
                    <li>Winners will receive prizes and merit certificates.</li>
                    <div className="mt-6 flex justify-center">
                      <button
  onClick={() => window.location.href="/register?event=buildathon"}
  className="px-6 py-3 rounded-lg bg-yellow-400 text-black font-semibold
             hover:scale-105 transition shadow-lg shadow-yellow-400/30
             animate-pulse"
>
  Register for Buildathon
</button>
                    </div>
                  </ul>
                </div>
              </div>
            )}

            {/* HELP DESK */}
            {active === "help" && (
              <div className="w-full max-w-6xl px-6 md:px-10 py-16 mx-auto space-y-20">
                <h1 className="text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-green-400 via-cyan-400 to-green-300 bg-clip-text text-transparent">
                  Help Desk
                </h1>

                {/* ================= STUDENT COORDINATORS ================= */}
                <div className="space-y-12">
                  <h2 className="text-2xl md:text-3xl font-semibold text-green-400 text-center">
                    Student Coordinators
                  </h2>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {studentCoordinators.map((member, index) => (
                      <div
                        key={index}
                        className="bg-white/5 backdrop-blur-xl border border-green-400/20 rounded-2xl p-6 text-center hover:scale-105 transition duration-300"
                      >
                        <h3 className="text-lg font-semibold mb-2">
                          {member.name}
                        </h3>
                        <p className="text-sm text-gray-300">
                          {member.designation}
                        </p>
                        <p className="text-sm text-gray-400">
                          {member.department}
                        </p>
                        <p className="text-sm text-gray-400">{member.roll}</p>

                        <a
                          href={`tel:${member.phone}`}
                          className="text-green-400 font-semibold mt-4 block"
                        >
                          📞 {member.phone}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ================= FACULTY COORDINATORS ================= */}
                <div className="space-y-12">
                  <h2 className="text-2xl md:text-3xl font-semibold text-cyan-400 text-center">
                    Faculty Coordinator
                  </h2>

                  <div className="flex justify-center">
                    {facultyCoordinators.map((faculty, index) => (
                      <div
                        key={index}
                        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-8 text-center hover:scale-105 transition duration-300"
                      >
                        <h3 className="text-xl font-semibold mb-2">
                          {faculty.name}
                        </h3>
                        <p className="text-sm text-gray-300">
                          {faculty.designation}
                        </p>
                        <p className="text-sm text-gray-400">
                          {faculty.department}
                        </p>

                        <a
                          href={`tel:${faculty.phone}`}
                          className="text-cyan-400 font-semibold mt-4 block"
                        >
                          📞 {faculty.phone}
                        </a>
                      </div>
                    ))}
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
                    <span className="text-green-400 font-semibold">
                      Arduino Days 2026
                    </span>
                    is a 4-day technical event designed to inspire innovation,
                    creativity, and hands-on learning in the fields of Arduino,
                    IoT, Embedded Systems, and Real-Time Project Development.
                  </p>

                  <p className="text-gray-300 leading-relaxed text-lg">
                    This event brings together students from all branches to
                    collaborate, learn emerging technologies, and transform
                    ideas into real-world working prototypes. Through workshops,
                    hackathons, and project expos, participants gain practical
                    exposure beyond classroom learning.
                  </p>

                  <p className="text-gray-300 leading-relaxed text-lg">
                    Our mission is to promote technical excellence, teamwork,
                    and problem-solving skills while building a strong community
                    of passionate innovators and future engineers.
                  </p>
                </div>

                {/* Website Info Section */}
                <div className="mt-16">
                  <h2 className="text-3xl font-bold mb-8 text-cyan-400">
                    About This Website
                  </h2>

                  <div className="bg-white/5 backdrop-blur-md border border-cyan-400/20 rounded-2xl p-10 space-y-6">
                    <p className="text-gray-300 leading-relaxed">
                      This website serves as the official digital platform for
                      Arduino Days 2026. It provides complete information about
                      events, registration details, coordinators, schedules, and
                      announcements.
                    </p>

                    <p className="text-gray-300 leading-relaxed">
                      Built with modern web technologies, the platform ensures a
                      smooth, interactive, and responsive user experience across
                      devices. It reflects the innovative spirit and technical
                      excellence of the event itself.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {active === "rules" && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="relative w-14 h-14">
              <svg className="w-full h-full -rotate-90">
                {/* Background circle */}
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="4"
                  fill="transparent"
                />

                {/* Progress circle */}
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="#00ffff"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 24}
                  strokeDashoffset={
                    2 * Math.PI * 24 -
                    (scrollProgress / 100) * (2 * Math.PI * 24)
                  }
                  strokeLinecap="round"
                  className="transition-all duration-200"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center text-xs text-cyan-400 font-semibold">
                {Math.round(scrollProgress)}%
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArduinoDays;
