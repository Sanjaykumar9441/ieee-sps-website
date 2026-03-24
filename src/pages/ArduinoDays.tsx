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
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const problems = [
    {
      title: "Low power Smart Solar Dryer Monitoring System",
      description:
        "In low-cost solar dryers, lack of automated climate control leads to uncontrolled temperature and humidity variations. Extreme heat buildup can damage or destroy agricultural produce, resulting in significant financial losses for small-scale entrepreneurs.",
    },
    {
      title: "Smart Irrigation Control System",
      description:
        "Lack of automated climate control in solar dryers leads to temperature spikes, causing crop damage and financial loss—necessitating a low-cost IoT-based monitoring and control solution.",
    },
    {
      title: "Arduino-Based 360° Smart Radar Scanning System",
      description:
        "cost-effective Arduino-based radar scanning system that can perform 360° monitoring by rotating an ultrasonic sensor, detect objects within a defined range, generate alerts, and display real-time information such as angle, distance, and detection status in a structured and user-friendly format.",
    },
    {
      title: "Arduino-Based Smart Greenhouse Monitoring and Control System",
      description:
        "To develop an Arduino-based automated greenhouse system that monitors environmental conditions and controls irrigation, ventilation, and lighting for optimal plant growth.",
    },
    {
      title: "Arduino-Based Smart Multi-Sensor Domestic Security Alert System",
      description:
        "Develop a low-cost Arduino-based multi-sensor security system that detects different types of intrusions and provides real-time alerts and automated responses.",
    },
    {
      title:
        "Arduino-Based Smart Refrigerator Air-Quality and Safety Monitoring System",
      description:
        "Develop an Arduino-based system to monitor refrigerator air quality and storage conditions, providing real-time alerts for gas leakage and food safety risks.",
    },
    {
      title:
        "Arduino-Based Smart Library Environment and Silence Monitoring System",
      description:
        "Develop an Arduino-based system to monitor library silence, environment, and occupancy, with real-time alerts and logging for effective management.",
    },
    {
      title: "Arduino-Based Multi-Mode Smart Switchboard with Usage Monitoring",
      description:
        "Develop an Arduino-based smart switchboard with multiple control methods and real-time usage tracking for efficient and user-friendly home automation.",
    },
    {
      title: "Arduino-Based Smart Car Parking Management System",
      description:
        "Develop an Arduino-based system to monitor parking space availability and guide vehicles for efficient parking management.",
    },
    {
      title: "Arduino-Based Smart Weather Monitoring System with GSM Alerts",
      description:
        "Develop an Arduino-based weather station with GSM alerts to monitor environmental conditions and notify users in real time.",
    },
    {
      title: "Portable Drinking Water Quality Tester",
      description: "Detect unsafe drinking water using sensors.",
    },
    {
      title: "Pipeline Leakage Detection Device",
      description:
        "Detect water leakage in pipelines using pressure and flow sensors.",
    },
    {
      title: "Farm Animal Intrusion Detection System",
      description: "Detect animals entering farms and alert farmers.",
    },
    {
      title: "Smart Fertilizer Dispenser",
      description: "Automatically dispense fertilizer based on soil condition.",
    },
    {
      title: "River Water Pollution Detection Device",
      description: "Measure pH and turbidity of nearby water bodies.",
    },
    {
      title: "Noise Pollution Monitoring System",
      description: "Measure noise levels in urban areas.",
    },
    {
      title: "Flood Level Early Warning System",
      description: "Monitor river water levels to warn nearby communities.",
    },
    {
      title: "Landslide Detection Device",
      description: "Detect soil movement and moisture in hilly regions.",
    },
    {
      title: "Lightning Alert for Farmers",
      description: "Detect lightning activity and warn users.",
    },
    {
      title: "Mosquito Breeding Detection Device",
      description: "Detect stagnant water areas where mosquitoes breed.",
    },
    {
      title: "Milk Quality Testing Device",
      description: "Detect acidity levels in milk.",
    },
  ];
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
              id: "problems",
              icon: <FileText size={20} />,
              label: "Problem Statements",
            },
            {
              id: "components",
              icon: <FileText size={20} />,
              label: "Components Available",
            },
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

            {active === "problems" && (
              <div className="w-full max-w-7xl px-6 md:px-10 py-16 mx-auto">
                {/* HEADER */}
                <h1
                  className="text-4xl md:text-5xl font-bold text-center mb-14 
    bg-gradient-to-r from-green-400 via-cyan-400 to-green-300 
    bg-clip-text text-transparent tracking-wide"
                >
                  Problem Statements
                </h1>

                {/* GRID */}
                <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-8">
                  {problems.map((problem, index) => {
                    const isOpen = openIndex === index;

                    return (
                      <div
                        key={index}
                        onClick={() => setOpenIndex(isOpen ? null : index)}
                        className="cursor-pointer group relative p-[1px] rounded-xl 
            bg-gradient-to-r from-cyan-500/40 via-green-400/40 to-cyan-500/40
            hover:shadow-[0_0_25px_rgba(0,255,200,0.6)] transition duration-500"
                      >
                        <div className="bg-black/80 backdrop-blur-xl rounded-xl p-6">
                          {/* TOP */}
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-xs text-gray-400 tracking-widest">
                              PROBLEM
                            </span>

                            <span className="text-sm font-bold text-cyan-400">
                              #{String(index + 1).padStart(2, "0")}
                            </span>
                          </div>

                          {/* TITLE */}
                          <h2 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition">
                            {problem.title}
                          </h2>

                          {/* VIEW BUTTON */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenIndex(isOpen ? null : index);
                            }}
                            className="mt-4 text-cyan-400 text-sm hover:underline"
                          >
                            {isOpen
                              ? "Hide Description ▲"
                              : "View Description ▼"}
                          </button>

                          {/* DESCRIPTION */}
                          {isOpen && (
                            <div className="mt-3 text-gray-300 text-sm leading-relaxed">
                              {problem.description}
                            </div>
                          )}

                          {/* LINE */}
                          <div
                            className={`mt-4 h-[2px] bg-gradient-to-r from-cyan-400 to-green-400 transition-all duration-500 
                ${isOpen ? "w-full" : "w-0 group-hover:w-full"}`}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {active === "components" && (
              <div className="w-full max-w-7xl px-6 md:px-10 py-16 mx-auto">
                {/* HEADER */}
                <h1
                  className="text-4xl md:text-5xl font-bold text-center mb-14 
    bg-gradient-to-r from-green-400 via-cyan-400 to-green-300 
    bg-clip-text text-transparent tracking-wide"
                >
                  Components Available
                </h1>

                {/* GRID */}
                <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    "Arduino UNO",
                    "NodeMCU",
                    "IR Proximity Sensor",
                    "Moisture Sensor",
                    "Temperature Sensor (LM35)",
                    "Motion Sensor (PIR)",
                    "Smoke Sensor",
                    "Ultrasonic Sensor",
                    "Servo Motor",
                    "LCD Display",
                    "Real Time Clock",
                    "Relay Module",
                    "Bluetooth Module",
                    "LDR Module",
                    "GPS Module",
                    "LED (Red, Green)",
                    "Resistors (220Ω, 1kΩ, 10kΩ)",
                    "Potentiometer (1k, 10k)",
                    "Push Button",
                    "Breadboard",
                    "Patch Chords (M-M, M-F, F-F)",
                    "Soldering Gun",
                    "Flux",
                    "Led",
                  ].map((component, index) => (
                    <div
                      key={index}
                      className="group relative p-[1px] rounded-xl 
          bg-gradient-to-r from-green-400/40 via-cyan-400/40 to-green-400/40
          hover:shadow-[0_0_25px_rgba(0,255,200,0.6)] transition duration-500 min-h-[100px]"
                    >
                      <div className="bg-black/80 backdrop-blur-xl rounded-xl p-6 flex items-center justify-between">
                        {/* TEXT */}
                        <h2 className="text-lg font-semibold text-white group-hover:text-green-300 transition">
                          {component}
                        </h2>

                        {/* NUMBER */}
                        <span className="text-sm font-bold text-green-400">
                          #{String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {active === "rules" && (
              <div className="w-full max-w-7xl px-6 md:px-10 py-16 mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold text-center bg-gradient-to-r from-green-400 via-cyan-400 to-green-300 bg-clip-text text-transparent">
                  Rules & Regulations
                </h1>
                <div className="grid md:grid-cols-3 gap-10 mt-12 items-stretch">
                  {/* ================= GENERAL RULES ================= */}
                  <div className="bg-white/5 backdrop-blur-xl border border-green-400/20 rounded-2xl p-8 flex flex-col">
                    <h2 className="text-2xl font-semibold text-green-400">
                      Event Rules & Guidelines
                    </h2>

                    <ul className="space-y-3 text-gray-300 text-base md:text-lg list-disc list-inside">
                      <li>The event is open to all branches and all years.</li>
                      <li>
                        Students from different branches are allowed to register
                        as a team.
                      </li>
                      <li>Participants must carry a valid student ID card.</li>
                      <li>
                        A working laptop is mandatory with the latest Arduino
                        IDE installed before the event.
                      </li>
                      <li>Participation certificates will be provided.</li>
                      <li>Accommodation will be provided as per norms.</li>
                      <li>
                        Download the latest version of Arduino IDE –
                        <a
                          href="https://www.arduino.cc/en/software"
                          target="_blank"
                          style={{ color: "#2563eb" }}
                        >
                          https://www.arduino.cc/en/software
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* ================= SKILL FORZE ================= */}
                  <div className="bg-white/5 backdrop-blur-xl border border-green-400/20 rounded-2xl p-8 flex flex-col">
                    <h2 className="text-2xl font-semibold text-cyan-400">
                      <span>
                        Skill Forze (23<sup>rd</sup> & 24<sup>th</sup> March) –
                        Workshop Guidelines
                      </span>
                    </h2>

                    <ul className="space-y-3 text-gray-300 text-base md:text-lg list-disc list-inside">
                      <li>Team registration is compulsory.</li>
                      <li>
                        Students must be registered as a Team (3-4 members).
                      </li>
                      <li>The workshop covers Arduino and IoT Fundamentals.</li>
                      <li>Active participation on both days is required.</li>
                      <li>
                        Teams are encouraged to participate in the Buildathon.
                      </li>
                    </ul>
                  </div>

                  {/* ================= BUILDATHON ================= */}
                  <div className="bg-white/5 backdrop-blur-xl border border-green-400/20 rounded-2xl p-8 flex flex-col">
                    <h2 className="text-2xl font-semibold text-yellow-400">
                      Buildathon (25<sup>th</sup> March) – Hackathon Guidelines
                    </h2>

                    <ul className="space-y-3 text-gray-300 text-base md:text-lg list-disc list-inside">
                      <li>
                        Students must be registered as a Team (3-4 members).
                      </li>
                      <li>
                        Problem statements will be provided by the organizers.
                      </li>
                      <li>
                        Projects must be original and developed during the
                        event.
                      </li>
                      <li>Minimum one working laptop per team is mandatory.</li>
                      <li>
                        Participants may choose to attend only Buildathon if
                        preferred.
                      </li>
                      <li>Teams must present a working prototype.</li>
                      <li>
                        Winners will receive prizes and merit certificates.
                      </li>
                      <li>Snacks will be provided during event.</li>
                    </ul>
                  </div>
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
