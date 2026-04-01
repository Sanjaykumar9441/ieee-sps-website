import { useState, useEffect, useRef } from "react";
import { Home, HelpCircle, Info, Handshake } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Users, IndianRupee, Calendar } from "lucide-react";
import { MapPin } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const MovingWaves = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <img
        src="/freepik_arduino_background.webp"
        decoding="async"
        loading="lazy"
        alt="background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black/50" />
    </div>
  );
};

const ArduinoDays = () => {
  const navigate = useNavigate();
  const [registerLoading, setRegisterLoading] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const rawSection = searchParams.get("section") || "home";

  // ❌ Block events completely
  const active = rawSection === "events" ? "home" : rawSection;
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [rollNo, setRollNo] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [certificates, setCertificates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [progress, setProgress] = useState(0);
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

  const collegeMap: Record<string, string> = {
    AUS: "Aditya University (AUS)",
    ACET: "Aditya College of Engineering & Technology (ACET)",
  };

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
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
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
      name: "Ch. Harini",
      designation: "Web Master",
      department: "ECE",
      roll: "24B11EC055",
      phone: "6302041984",
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

  const sponsors = [
    {
      name: "Arkance In Pvt Ltd, Hyderabad",
      logo: "/arkance.jpg",
      description:
        "Arkance is a global technology partner providing digital transformation solutions for the architecture, engineering, and construction industries.",
      website: "https://www.arkance.world",
    },
    {
      name: "Silicon Touch Technologies, Vijayawada",
      logo: "/OIP.jpg",
      description:
        "Silicon Touch Technologies, Vijayawada is a technology partner delivering innovative software solutions and digital services that help organizations enhance efficiency and drive technological growth.",
      website: "https://www.sttmani.com/home",
    },
    {
      name: "Arihant Electronics, Kakinada",
      description:
        "Arihant Electronics is a premier technical partner in Kakinada, providing high-quality electronic components and industrial solutions for student projects, research, and engineering sectors.",
    },
    {
      name: "Agripeuners, Visakhapatnam",
      description:
        "Agripeuners, Visakhapatnam is an organization promoting agricultural innovation and entrepreneurship by connecting technology, research, and sustainable farming practices.",
    },
  ];

  const scrollToMap = () => {
    const section = document.getElementById("community-map");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleFetchCertificate = () => {
    if (!rollNo) return;

    setSearched(true);
    setLoading(true);
    setCertificates([]);
    setProgress(0);

    const base = rollNo.trim();

    const files = [
      `/certificates/${base}_participation.pdf`,
      `/certificates/${base}_merit.pdf`,
    ];

    // 🔥 Animate progress
    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setProgress(current);
      if (current >= 90) clearInterval(interval); // stop at 90%
    }, 200);

    Promise.all(
      files.map((url) =>
        fetch(url)
          .then((res) => {
            const contentType = res.headers.get("content-type");
            if (res.ok && contentType?.includes("application/pdf")) {
              return url;
            }
            return null;
          })
          .catch(() => null),
      ),
    ).then((results) => {
      const validFiles = results.filter(Boolean) as string[];

      setTimeout(() => {
        clearInterval(interval);
        setProgress(100); // complete

        setCertificates(validFiles);
        setLoading(false);
      }, 3000);
    });
  };
  return (
    <div className="min-h-screen bg-[#02060c] relative text-white overflow-x-hidden overflow-y-auto">
      {/* 1. Add the moving waves here */}
      <MovingWaves />

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
        className={`fixed top-0 left-0 h-screen w-64 bg-black/50 backdrop-blur-3xl border-r border-green-500/20 shadow-xl p-6 flex flex-col gap-8 z-50 transform transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
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
            {
              id: "certificate",
              icon: <FileText size={20} />,
              label: "Download Certificate",
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
                  setSearchParams({ section: item.id });
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
                  className="relative min-h-[85vh] md:min-h-screen flex flex-col justify-center items-center px-6 md:px-10 pt-16 md:pt-0 text-center space-y-8 md:space-y-6 pb-16"
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
                  {/* Department + Association Text */}
                  <div className="text-center space-y-2 mt-6">
                    <p className="text-lg md:text-xl font-semibold text-gray-200">
                      Department of Electronics and Communication Engineering
                    </p>

                    <p className="text-sm md:text-base text-gray-400">
                      In Association with IEEE SPS Student Branch Chapter
                    </p>

                    <p className="text-base md:text-lg text-cyan-400 font-semibold tracking-wider">
                      Presents
                    </p>
                  </div>
                  {/* Title */}
                  <div className="space-y-6">
                    <img
                      src="/titlelogo.png"
                      alt="Arduino Days Logo"
                      className="w-[85vw] sm:w-[520px] md:w-[620px] lg:w-[680px] mx-auto object-contain"
                    />

                    <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-xl md:max-w-2xl mx-auto">
                      A 3-Day Technical Event focused on Arduino, IoT, Embedded
                      Systems, and Real-Time Project Development.
                    </p>
                  </div>

                  {/* Date */}
                  <div className="flex flex-wrap justify-center items-center gap-6">
                    <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-green-500/20 border border-green-400 text-green-300 text-sm md:text-base">
                      <Calendar
                        size={18}
                        className="text-cyan-400 flex-shrink-0"
                      />
                      <span>
                        March 23<sup>rd</sup> – 25<sup>th</sup>, 2026
                      </span>
                    </div>

                    <div className="relative group flex items-center gap-3 px-6 py-3 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-sm md:text-base">
                      <MapPin
                        size={18}
                        className="text-pink-400 flex-shrink-0"
                      />

                      <a
                        href="https://maps.app.goo.gl/hFCpjSyJV1oPQzEZ8"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-cyan-200"
                      >
                        Aditya University
                      </a>

                      <span className="text-xs text-green-400 underline">
                        Click here to get map
                      </span>

                      {/* MAP PREVIEW POPUP */}
                      <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 hidden group-hover:block z-40">
                        <div className="bg-black/90 backdrop-blur-lg border border-cyan-400/30 rounded-xl p-3 shadow-xl w-[260px]">
                          <img
                            src="/map.png"
                            alt="Aditya University Map"
                            className="rounded-lg mb-2"
                          />

                          <a
                            href="https://maps.app.goo.gl/hFCpjSyJV1oPQzEZ8"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-center text-sm text-cyan-400 hover:text-cyan-200"
                          >
                            Open in Google Maps →
                          </a>
                        </div>
                      </div>
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
                    Organise a Community event around the world
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
            {active === "certificate" && (
              <div className="w-full max-w-xl px-6 py-20 mx-auto text-center">
                {/* HEADER */}
                <h1
                  className="text-4xl md:text-5xl font-bold mb-10 
    bg-gradient-to-r from-green-400 via-cyan-400 to-green-300 
    bg-clip-text text-transparent tracking-wide"
                >
                  Download Certificate
                </h1>

                {/* CARD */}
                <div className="bg-black/80 backdrop-blur-xl rounded-xl p-8 border border-cyan-400/20">
                  {/* INPUT */}
                  <input
                    type="text"
                    placeholder="Enter Roll Number"
                    value={rollNo}
                    onChange={(e) => {
                      setRollNo(e.target.value.toUpperCase());
                      setSearched(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleFetchCertificate();
                      }
                    }}
                    className="w-full p-3 mb-6 rounded-lg bg-black border border-gray-600 text-white focus:outline-none"
                  />

                  {/* BUTTON */}
                  <button
                    onClick={handleFetchCertificate}
                    disabled={loading}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-400 to-cyan-400 text-black font-semibold disabled:opacity-50"
                  >
                    Get Certificate
                  </button>
                  {loading && (
                    <div className="mt-8 w-full text-left">
                      {/* STATUS TEXT */}
                      <p className="text-cyan-400 text-sm mb-3 animate-pulse">
                        {progress < 30 && "🔍 Checking database..."}
                        {progress >= 30 &&
                          progress < 70 &&
                          "⚙️ Verifying certificate..."}
                        {progress >= 70 && "📄 Preparing your certificate..."}
                      </p>

                      {/* PROGRESS BAR */}
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden relative">
                        {/* MAIN BAR */}
                        <div
                          className="h-full bg-gradient-to-r from-green-400 via-cyan-400 to-green-400 
    relative overflow-hidden transition-all duration-300 
    shadow-[0_0_15px_rgba(0,255,200,0.8)]"
                          style={{ width: `${progress}%` }}
                        >
                          {/* SHIMMER EFFECT */}
                          <div
                            className="absolute inset-0 
      bg-gradient-to-r from-transparent via-white/30 to-transparent 
      animate-shimmer"
                          ></div>
                        </div>
                      </div>

                      {/* PERCENT */}
                      <p className="text-xs text-gray-400 mt-2">
                        {progress}% completed
                      </p>
                    </div>
                  )}

                  {/* ERROR */}
                  {error && <p className="text-red-400 mt-4">{error}</p>}

                  {/* DOWNLOAD */}
                  <div className="mt-8 grid md:grid-cols-2 gap-8 items-start">
                    {certificates.map((file, index) => (
                      <div
                        key={index}
                        className="p-6 bg-black/60 border border-cyan-400/20 rounded-xl 
hover:shadow-[0_0_20px_rgba(0,255,200,0.4)] transition"
                      >
                        {/* PREVIEW */}
                        <p className="text-sm text-gray-400 mb-3">
                          {file.includes("merit")
                            ? "🏆 Merit Certificate"
                            : "🎓 Participation Certificate"}
                        </p>
                        <iframe
                          src={`${file}#toolbar=0&navpanes=0&scrollbar=0`}
                          title={`Certificate ${index}`}
                          className="w-full aspect-[16/9] rounded-lg mb-6 border border-gray-700 bg-white"
                        />

                        {/* DOWNLOAD BUTTON */}
                        <a
                          href={file}
                          download
                          className="inline-block px-6 py-2 rounded-full 
      bg-green-500 text-black font-semibold hover:scale-105 transition"
                        >
                          Download Certificate {index + 1}
                        </a>
                      </div>
                    ))}
                  </div>
                  {!loading && searched && certificates.length === 0 && (
                    <div className="space-y-4">
                      <p className="text-red-400 mt-4">
                        No certificate found for this roll number
                      </p>
                      <div className="mt-8 text-sm text-gray-300">
                        <p>
                          If you attended the event but your certificate is not
                          available, please contact:
                        </p>

                        <p className="mt-2 text-green-400 font-semibold">
                          Sanjay Kumar
                        </p>

                        <a
                          href="tel:7095009441"
                          className="text-cyan-400 underline"
                        >
                          📞 7095009441
                        </a>
                      </div>
                    </div>
                  )}
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
                    Faculty Advisor
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

            {/* SPONSORS */}
            {active === "sponsors" && (
              <div className="w-full max-w-6xl px-6 md:px-10 py-16 mx-auto">
                <h1
                  className="text-4xl md:text-5xl font-bold text-center mb-16
    bg-gradient-to-r from-green-400 via-cyan-400 to-green-300 
    bg-clip-text text-transparent"
                >
                  Sponsors
                </h1>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10">
                  {sponsors.map((sponsor, index) => (
                    <div
                      key={index}
                      className="
          bg-white/5 backdrop-blur-xl
          border border-green-400/20
          rounded-2xl p-8
          text-center
          hover:scale-105
          transition duration-300
          "
                    >
                      {/* Logo */}
                      <div className="flex justify-center mb-6">
                        <img
                          src={sponsor.logo}
                          alt={sponsor.name}
                          className="h-20 object-contain"
                        />
                      </div>

                      {/* Name */}
                      <h3 className="text-xl font-semibold text-green-400 mb-3">
                        {sponsor.name}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-300 text-sm mb-5">
                        {sponsor.description}
                      </p>

                      {/* Website */}
                      <a
                        href={sponsor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-cyan-400 text-black px-5 py-2 rounded-full
            font-semibold hover:scale-105 transition"
                      >
                        Visit Website
                      </a>
                    </div>
                  ))}
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
                    is a 3-day technical event designed to inspire innovation,
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
      </div>
    </div>
  );
};

export default ArduinoDays;
