import { useState, useEffect, useRef } from "react";
import {
  Home, HelpCircle, Info, Handshake, FileText, Menu, MapPin, Calendar,
  X, ChevronDown, ChevronLeft, ChevronRight, Download, ExternalLink,
  Trophy, Clock, Zap, Users, ArrowRight, Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";

/* ══════════════════════════════════════════
   PARTICLE BACKGROUND
══════════════════════════════════════════ */
const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    // Particles
    const count = 80;
    const particles = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
      color: i % 3 === 0 ? "#00979D" : i % 3 === 1 ? "#E07B39" : "#00c4a7",
      opacity: Math.random() * 0.6 + 0.2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 151, 157, ${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, "0");
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      });

      animFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
};

/* ══════════════════════════════════════════
   GALLERY TABS
══════════════════════════════════════════ */
const GalleryTabs = () => {
  const [day, setDay] = useState("day1");
  const [images, setImages] = useState<{ thumb: string; full: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleDownload = async () => {
    if (selectedIndex === null) return;
    const url = images[selectedIndex].full;
    const response = await fetch(url);
    const blob = await response.blob();
    const fileName = url.split("/").pop();
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName || "image.jpg";
    link.click();
  };

  const nextImage = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % images.length);
  };

  const prevImage = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
  };

  useEffect(() => { fetchImages(); }, [day]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "Escape") setSelectedIndex(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, images]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`https://ieee-sps-website.onrender.com/api/gallery/${day}`);
      const data = await res.json();
      setImages(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Day tabs */}
      <div className="flex justify-center gap-3 mb-10">
        {["day1", "day2", "day3"].map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: day === d ? "#00979D" : "rgba(255,255,255,0.06)",
              color: day === d ? "#fff" : "rgba(255,255,255,0.5)",
              border: day === d ? "1px solid #00979D" : "1px solid rgba(255,255,255,0.1)",
              boxShadow: day === d ? "0 0 20px rgba(0,151,157,0.35)" : "none",
              fontFamily: "'Space Mono', monospace",
            }}
          >
            {d.replace("day", "Day ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#00979D", borderTopColor: "transparent" }} />
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, i) => (
            <motion.div
              key={img.thumb}
              className="relative overflow-hidden rounded-xl cursor-pointer group"
              style={{ aspectRatio: "4/3" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedIndex(i)}
            >
              <img
                src={img.thumb}
                alt="gallery"
                loading="lazy"
                onError={(e) => { e.currentTarget.src = "/fallback.png"; }}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                <Play size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-center py-20 font-mono text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No images found</p>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIndex(null)}
          >
            <button onClick={(e) => { e.stopPropagation(); setSelectedIndex(null); }} className="absolute top-5 right-5 p-2 rounded-full text-white z-50" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
              <X size={18} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-5 p-3 rounded-full text-white z-50" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
              <ChevronLeft size={20} />
            </button>
            <motion.img
              src={images[selectedIndex].full}
              alt="preview"
              onError={(e) => { e.currentTarget.src = "/fallback.png"; }}
              className="max-w-[90%] max-h-[85vh] rounded-xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            />
            <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-5 p-3 rounded-full text-white z-50" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
              <ChevronRight size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              className="absolute bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium z-50"
              style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", backdropFilter: "blur(8px)" }}
            >
              <Download size={14} /> Download
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ══════════════════════════════════════════
   SECTION WRAPPER
══════════════════════════════════════════ */
const Section = ({ children, className = "" }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -24 }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className={`w-full max-w-6xl mx-auto px-6 md:px-10 py-20 ${className}`}
  >
    {children}
  </motion.div>
);

const SectionHeading = ({ children, accent = "teal" }: any) => (
  <h1
    className="text-4xl md:text-5xl font-black text-center mb-16 leading-tight"
    style={{
      fontFamily: "'Space Mono', monospace",
      background: accent === "teal"
        ? "linear-gradient(135deg, #00979D, #00c4a7, #4dd9e0)"
        : "linear-gradient(135deg, #E07B39, #f0a060, #00979D)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    }}
  >
    {children}
  </h1>
);

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const ArduinoDays = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawSection = searchParams.get("section") || "home";
  const active = rawSection === "events" ? "home" : rawSection;

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress((scrollTop / docHeight) * 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [active]);

  const scrollToMap = () => {
    document.getElementById("community-map")?.scrollIntoView({ behavior: "smooth" });
  };

  /* ── DATA ── */
  const studentCoordinators = [
    { name: "B. Navya", designation: "Chair", department: "ECE" },
    { name: "Ch. Sanjay Kumar", designation: "Vice Chair", department: "ECE" },
    { name: "S. Veneela", designation: "Secretary", department: "ECE" },
    { name: "J. Rakesh", designation: "Treasurer", department: "ECE" },
    { name: "Ch. Harini", designation: "Web Master", department: "ECE" },
    { name: "Ch. Naveen Sai", designation: "IEEE Member", department: "ECE" },
  ];

  const facultyCoordinators = [
    { name: "Mr. S. Jagadeesh", designation: "Assistant Professor", department: "ECE" },
  ];

  const sponsors = [
    { name: "Arkance In Pvt Ltd", location: "Hyderabad", logo: "/arkance.jpg", description: "Global technology partner providing digital transformation solutions for architecture, engineering, and construction industries.", website: "https://www.arkance.world" },
    { name: "Silicon Touch Technologies", location: "Vijayawada", logo: "/OIP.png", description: "Delivering innovative software solutions and digital services that help organizations enhance efficiency and drive technological growth.", website: "https://www.sttmani.com/home" },
    { name: "Arihant Electronics", location: "Kakinada", logo: null, description: "Premier technical partner providing high-quality electronic components and industrial solutions for student projects, research, and engineering sectors.", website: null },
    { name: "Agripeuners", location: "Visakhapatnam", logo: null, description: "Organization promoting agricultural innovation and entrepreneurship by connecting technology, research, and sustainable farming practices.", website: null },
  ];

  const schedule = [
    {
      day: "Day 1", date: "March 23rd", color: "#00979D",
      events: [
        { time: "09:00 AM", title: "Inauguration Ceremony", desc: "Opening remarks, chief guest address, and event kickoff" },
        { time: "10:30 AM", title: "Arduino Workshop — Basics", desc: "Hands-on introduction to Arduino hardware and programming" },
        { time: "02:00 PM", title: "IoT Demonstration", desc: "Live demo of IoT use cases and project showcases" },
        { time: "04:00 PM", title: "Team Formation & Buildathon Brief", desc: "Teams announced, problem statements distributed" },
      ],
    },
    {
      day: "Day 2", date: "March 24th", color: "#E07B39",
      events: [
        { time: "09:00 AM", title: "Buildathon Begins", desc: "12-hour intensive hardware hackathon starts" },
        { time: "11:00 AM", title: "Workshop — Embedded Systems", desc: "Deep dive into embedded systems and real-time applications" },
        { time: "02:00 PM", title: "Mentor Sessions", desc: "One-on-one guidance from industry experts" },
        { time: "05:00 PM", title: "Project Review Round 1", desc: "Initial prototype evaluation and feedback" },
      ],
    },
    {
      day: "Day 3", date: "March 25th", color: "#00c4a7",
      events: [
        { time: "09:00 AM", title: "Final Submissions", desc: "Teams submit final projects for evaluation" },
        { time: "10:30 AM", title: "Project Expo", desc: "Public demonstration of all team projects" },
        { time: "02:00 PM", title: "Panel Judging", desc: "Expert panel evaluation and Q&A with teams" },
        { time: "04:00 PM", title: "Valedictory & Prize Distribution", desc: "Award ceremony, certificates, and closing remarks" },
      ],
    },
  ];

  const prizes = [
    { rank: "1st", label: "Winner", amount: "₹15,000", icon: "🥇", color: "#E07B39", glow: "rgba(224,123,57,0.3)" },
    { rank: "2nd", label: "Runner Up", amount: "₹10,000", icon: "🥈", color: "#00979D", glow: "rgba(0,151,157,0.3)" },
    { rank: "3rd", label: "2nd Runner Up", amount: "₹5,000", icon: "🥉", color: "#00c4a7", glow: "rgba(0,196,167,0.2)" },
    { rank: "Special", label: "Best Innovation", amount: "₹3,000", icon: "⚡", color: "#f0a060", glow: "rgba(240,160,96,0.2)" },
  ];

  const faqs = [
    { q: "Who can participate in Arduino Days 2026?", a: "Any undergraduate or postgraduate student from any branch of engineering or science can participate. Teams of 2–4 members are required for the Buildathon." },
    { q: "Is prior Arduino/coding knowledge required?", a: "Basic programming knowledge is helpful but not mandatory. The workshops on Day 1 are designed to get beginners up to speed." },
    { q: "What is the registration fee?", a: "Registration fees vary by event type. Please check the registration form for the latest pricing details." },
    { q: "Is accommodation available?", a: "Yes, limited hostel accommodation is available for outstation participants. Please indicate your requirement during registration." },
    { q: "What should teams bring?", a: "Laptops, any hardware components your project requires, and your enthusiasm! Basic Arduino kits will be provided at the venue." },
    { q: "When are results announced?", a: "Results will be announced at the Valedictory ceremony on Day 3 (March 25th, 2026)." },
  ];

  /* ── NAV ITEMS ── */
  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "gallery", icon: FileText, label: "Gallery" },
    { id: "schedule", icon: Clock, label: "Schedule" },
    { id: "prizes", icon: Trophy, label: "Prizes" },
    { id: "sponsors", icon: Handshake, label: "Sponsors" },
    { id: "help", icon: HelpCircle, label: "Help Desk" },
    { id: "about", icon: Info, label: "About" },
    { id: "faq", icon: HelpCircle, label: "FAQ" },
  ];

  const navigate_ = (id: string) => {
    if (id === "main") {
      window.open("https://ieee-sps-website-seven.vercel.app/", "_blank");
    } else {
      setSearchParams({ section: id });
      setMenuOpen(false);
    }
  };

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <div
      className="min-h-screen relative text-white overflow-x-hidden"
      style={{ backgroundColor: "#030a0a", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #030a0a; }
        ::-webkit-scrollbar-thumb { background: #00979D; border-radius: 2px; }
      `}</style>

      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-[200]" style={{ backgroundColor: "rgba(0,151,157,0.15)" }}>
        <div className="h-full transition-all duration-100" style={{ width: `${scrollProgress}%`, background: "linear-gradient(to right, #00979D, #E07B39)" }} />
      </div>

      {/* ── TOP NAVBAR ── */}
      <nav
        className="fixed top-0.5 left-0 right-0 z-[100] transition-all duration-300"
        style={{
          backgroundColor: scrolled ? "rgba(3,10,10,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(0,151,157,0.12)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate_("home")}
            className="flex items-center gap-3"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
              style={{ background: "linear-gradient(135deg, #00979D, #E07B39)", fontFamily: "'Space Mono', monospace" }}
            >
              AD
            </div>
            <span className="font-bold text-sm hidden sm:block" style={{ fontFamily: "'Space Mono', monospace", color: "#00979D" }}>
              Arduino Days <span style={{ color: "rgba(255,255,255,0.4)" }}>2026</span>
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate_(item.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                style={{
                  color: active === item.id ? "#00979D" : "rgba(255,255,255,0.45)",
                  backgroundColor: active === item.id ? "rgba(0,151,157,0.1)" : "transparent",
                  fontFamily: active === item.id ? "'Space Mono', monospace" : "inherit",
                }}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => window.open("https://ieee-sps-website-seven.vercel.app/", "_blank")}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <ExternalLink size={11} /> Main Site
            </button>
          </div>

          {/* Register CTA + mobile menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate_("home")}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all"
              style={{
                background: "linear-gradient(135deg, #00979D, #E07B39)",
                color: "#fff",
                boxShadow: "0 0 20px rgba(0,151,157,0.3)",
                fontFamily: "'Space Mono', monospace",
              }}
            >
              Register <ArrowRight size={12} />
            </button>
            <button
              className="lg:hidden p-2 rounded-lg"
              style={{ backgroundColor: "rgba(0,151,157,0.1)", color: "#00979D" }}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE MENU ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[90] lg:hidden"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              ref={sidebarRef}
              className="fixed top-0 right-0 bottom-0 w-72 z-[95] lg:hidden flex flex-col pt-20 pb-8 px-6"
              style={{ backgroundColor: "#030a0a", borderLeft: "1px solid rgba(0,151,157,0.12)" }}
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <div className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate_(item.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left"
                    style={{
                      backgroundColor: active === item.id ? "rgba(0,151,157,0.12)" : "transparent",
                      color: active === item.id ? "#00979D" : "rgba(255,255,255,0.5)",
                      borderLeft: active === item.id ? "2px solid #00979D" : "2px solid transparent",
                    }}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="mt-auto">
                <button
                  className="w-full py-3 rounded-xl font-bold text-sm"
                  style={{ background: "linear-gradient(135deg, #00979D, #E07B39)", color: "#fff", fontFamily: "'Space Mono', monospace" }}
                >
                  Register Now
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════
          CONTENT
      ══════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >

          {/* ─────────────────────────────────────
              HOME
          ───────────────────────────────────── */}
          {active === "home" && (
            <>
              {/* HERO */}
              <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
                {/* Background image */}
                <div className="absolute inset-0">
                  <img
                    src="/freepik_arduino_background.webp"
                    alt="background"
                    className="w-full h-full object-cover"
                    style={{ opacity: 0.15 }}
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(3,10,10,0.3) 0%, rgba(3,10,10,0.7) 60%, #030a0a 100%)" }} />
                </div>

                {/* Particle canvas */}
                <ParticleBackground />

                {/* Circuit grid overlay */}
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: `linear-gradient(rgba(0,151,157,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,151,157,0.5) 1px, transparent 1px)`,
                    backgroundSize: "80px 80px",
                  }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center gap-6 pt-20">
                  {/* Logos */}
                  <motion.div
                    className="flex flex-wrap justify-center items-center gap-8 md:gap-14"
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  >
                    <img src="/logo1.png" alt="Logo 1" className="h-10 md:h-14 object-contain" />
                    <img src="/logo2.png" alt="Logo 2" className="h-10 md:h-14 object-contain" />
                    <img src="/logo3.png" alt="Logo 3" className="h-10 md:h-14 object-contain" />
                  </motion.div>

                  {/* Association text */}
                  <motion.div
                    className="space-y-1.5"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  >
                    <p className="text-sm md:text-base font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
                      Department of Electronics and Communication Engineering
                    </p>
                    <p className="text-xs md:text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                      In Association with IEEE SPS Student Branch Chapter
                    </p>
                    <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: "#00979D", fontFamily: "'Space Mono', monospace" }}>
                      Presents
                    </p>
                  </motion.div>

                  {/* Title logo */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <img
                      src="/titlelogo.png"
                      alt="Arduino Days Logo"
                      className="w-[85vw] sm:w-[500px] md:w-[600px] lg:w-[680px] mx-auto object-contain"
                      style={{ filter: "drop-shadow(0 0 40px rgba(0,151,157,0.4))" }}
                    />
                  </motion.div>

                  {/* Tagline */}
                  <motion.p
                    className="text-sm md:text-base max-w-xl"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                  >
                    A 3-Day Technical Event on Arduino, IoT, Embedded Systems & Real-Time Project Development
                  </motion.p>

                  {/* Date + Location badges */}
                  <motion.div
                    className="flex flex-wrap justify-center gap-3"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                  >
                    <div
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium"
                      style={{ backgroundColor: "rgba(0,151,157,0.12)", border: "1px solid rgba(0,151,157,0.35)", color: "#00c4a7" }}
                    >
                      <Calendar size={15} />
                      March 23<sup>rd</sup> – 25<sup>th</sup>, 2026
                    </div>
                    <div className="relative group">
                      <div
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium cursor-pointer"
                        style={{ backgroundColor: "rgba(224,123,57,0.12)", border: "1px solid rgba(224,123,57,0.35)", color: "#f0a060" }}
                      >
                        <MapPin size={15} />
                        <a href="https://maps.app.goo.gl/hFCpjSyJV1oPQzEZ8" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                          Aditya University
                        </a>
                        <span className="text-xs underline" style={{ color: "#00979D" }}>Map</span>
                      </div>
                      {/* Map popup */}
                      <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 hidden group-hover:block z-40">
                        <div className="rounded-xl p-3 shadow-2xl w-[260px]" style={{ backgroundColor: "rgba(3,10,10,0.95)", border: "1px solid rgba(0,151,157,0.2)", backdropFilter: "blur(12px)" }}>
                          <img src="/map.png" alt="Map" className="rounded-lg mb-2 w-full" />
                          <a href="https://maps.app.goo.gl/hFCpjSyJV1oPQzEZ8" target="_blank" rel="noopener noreferrer" className="block text-center text-xs" style={{ color: "#00979D" }}>
                            Open in Google Maps →
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Innovation tagline */}
                  <motion.p
                    className="text-xs tracking-[0.3em] uppercase font-semibold"
                    style={{ color: "#E07B39", fontFamily: "'Space Mono', monospace" }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
                  >
                    Innovation • Creativity • Real-Time Learning
                  </motion.p>

                  {/* CTA buttons */}
                  <motion.div
                    className="flex flex-wrap justify-center gap-4 pt-2"
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
                  >
                    <button
                      className="flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm transition-all"
                      style={{
                        background: "linear-gradient(135deg, #00979D, #E07B39)",
                        color: "#fff",
                        boxShadow: "0 0 32px rgba(0,151,157,0.4)",
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      Register Now <ArrowRight size={15} />
                    </button>
                    <button
                      onClick={() => navigate_("schedule")}
                      className="flex items-center gap-2 px-8 py-3.5 rounded-full font-medium text-sm transition-all"
                      style={{ border: "1px solid rgba(0,151,157,0.4)", color: "#00979D" }}
                    >
                      View Schedule
                    </button>
                  </motion.div>
                </div>

                {/* Scroll indicator */}
                <button
                  onClick={scrollToMap}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  <span className="text-xs tracking-widest uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>Scroll</span>
                  <div className="w-5 h-8 border rounded-full flex items-start justify-center p-1" style={{ borderColor: "rgba(0,151,157,0.4)" }}>
                    <div className="w-1 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#00979D" }} />
                  </div>
                </button>
              </section>

              {/* MAP SECTION */}
              <section id="community-map" className="min-h-screen flex flex-col items-center justify-center px-6 py-24 gap-8">
                <h2
                  className="text-xl md:text-3xl font-bold text-center"
                  style={{ fontFamily: "'Space Mono', monospace", color: "#00979D" }}
                >
                  Organise a Community Event Around the World
                </h2>
                <div
                  className="w-full max-w-5xl rounded-2xl overflow-hidden p-1"
                  style={{ background: "linear-gradient(135deg, rgba(0,151,157,0.3), rgba(224,123,57,0.3))", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
                >
                  <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#030a0a" }}>
                    <img
                      src="/map.png"
                      alt="Community Events Map"
                      className="w-full h-[260px] sm:h-[350px] md:h-[500px] object-cover"
                    />
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ─────────────────────────────────────
              SCHEDULE
          ───────────────────────────────────── */}
          {active === "schedule" && (
            <div className="pt-16">
              <Section>
                <SectionHeading accent="orange">Event Schedule</SectionHeading>
                <div className="space-y-12">
                  {schedule.map((dayData, di) => (
                    <motion.div
                      key={dayData.day}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: di * 0.1 }}
                    >
                      {/* Day header */}
                      <div className="flex items-center gap-4 mb-6">
                        <div
                          className="px-4 py-1.5 rounded-full text-xs font-black"
                          style={{ backgroundColor: dayData.color + "20", color: dayData.color, border: `1px solid ${dayData.color}40`, fontFamily: "'Space Mono', monospace" }}
                        >
                          {dayData.day}
                        </div>
                        <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Space Mono', monospace" }}>{dayData.date}, 2026</span>
                        <div className="flex-1 h-px" style={{ backgroundColor: `${dayData.color}20` }} />
                      </div>

                      {/* Events */}
                      <div className="space-y-3 ml-4">
                        {dayData.events.map((ev, ei) => (
                          <motion.div
                            key={ei}
                            className="flex gap-5 p-4 rounded-xl group"
                            style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                            whileHover={{ backgroundColor: "rgba(0,151,157,0.04)", borderColor: `${dayData.color}25` }}
                          >
                            <div className="flex-shrink-0 w-16 text-xs font-mono pt-0.5" style={{ color: dayData.color, fontFamily: "'Space Mono', monospace" }}>
                              {ev.time}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm mb-0.5" style={{ color: "#f0f4ff" }}>{ev.title}</p>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{ev.desc}</p>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: dayData.color }} />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* ─────────────────────────────────────
              PRIZES
          ───────────────────────────────────── */}
          {active === "prizes" && (
            <div className="pt-16">
              <Section>
                <SectionHeading accent="orange">Prizes & Rewards</SectionHeading>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                  {prizes.map((prize, i) => (
                    <motion.div
                      key={i}
                      className="relative flex flex-col items-center text-center p-8 rounded-2xl"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.03)",
                        border: `1px solid ${prize.color}25`,
                        boxShadow: `0 0 40px ${prize.glow}`,
                      }}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ y: -4, boxShadow: `0 8px 50px ${prize.glow}` }}
                    >
                      <div className="text-5xl mb-4">{prize.icon}</div>
                      <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: prize.color, fontFamily: "'Space Mono', monospace" }}>{prize.label}</p>
                      <p className="text-3xl font-black mb-1" style={{ color: prize.color, fontFamily: "'Space Mono', monospace" }}>{prize.amount}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Cash Prize + Certificate</p>
                    </motion.div>
                  ))}
                </div>

                {/* Additional perks */}
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{ background: "linear-gradient(135deg, rgba(0,151,157,0.06), rgba(224,123,57,0.06))", border: "1px solid rgba(0,151,157,0.15)" }}
                >
                  <h3 className="text-lg font-bold mb-4" style={{ color: "#00979D", fontFamily: "'Space Mono', monospace" }}>All Participants Receive</h3>
                  <div className="flex flex-wrap justify-center gap-4">
                    {["Participation Certificate", "Event Kit & Goodies", "Networking Opportunities", "Industry Mentorship"].map((perk) => (
                      <div key={perk} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm" style={{ backgroundColor: "rgba(0,151,157,0.08)", color: "#00c4a7", border: "1px solid rgba(0,151,157,0.2)" }}>
                        <Zap size={12} /> {perk}
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* ─────────────────────────────────────
              GALLERY
          ───────────────────────────────────── */}
          {active === "gallery" && (
            <div className="pt-16">
              <Section>
                <SectionHeading>Gallery</SectionHeading>
                {/* YouTube */}
                <div className="mb-12 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,151,157,0.2)", boxShadow: "0 0 40px rgba(0,151,157,0.08)" }}>
                  <div className="aspect-video">
                    <iframe
                      className="w-full h-full"
                      src="https://www.youtube.com/embed/zaR2MDoh3OE"
                      title="Gallery Video"
                      allowFullScreen
                    />
                  </div>
                </div>
                <GalleryTabs />
              </Section>
            </div>
          )}

          {/* ─────────────────────────────────────
              HELP DESK
          ───────────────────────────────────── */}
          {active === "help" && (
            <div className="pt-16">
              <Section>
                <SectionHeading>Help Desk</SectionHeading>

                {/* Student Coordinators */}
                <div className="mb-16">
                  <h2 className="text-xl font-bold text-center mb-8" style={{ color: "#00979D", fontFamily: "'Space Mono', monospace" }}>
                    Student Coordinators
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {studentCoordinators.map((member, i) => (
                      <motion.div
                        key={i}
                        className="p-6 rounded-2xl text-center group"
                        style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,151,157,0.12)" }}
                        whileHover={{ borderColor: "rgba(0,151,157,0.35)", backgroundColor: "rgba(0,151,157,0.04)" }}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      >
                        <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-lg font-black" style={{ background: "linear-gradient(135deg, #00979D20, #E07B3920)", border: "1px solid rgba(0,151,157,0.2)", color: "#00979D" }}>
                          {member.name.charAt(0)}
                        </div>
                        <h3 className="font-semibold text-sm mb-0.5" style={{ color: "#f0f4ff" }}>{member.name}</h3>
                        <p className="text-xs font-medium mb-0.5" style={{ color: "#00979D" }}>{member.designation}</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{member.department}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Faculty */}
                <div>
                  <h2 className="text-xl font-bold text-center mb-8" style={{ color: "#E07B39", fontFamily: "'Space Mono', monospace" }}>
                    Faculty Advisor
                  </h2>
                  <div className="flex justify-center">
                    {facultyCoordinators.map((faculty, i) => (
                      <motion.div
                        key={i}
                        className="w-full max-w-sm p-8 rounded-2xl text-center"
                        style={{ background: "linear-gradient(135deg, rgba(0,151,157,0.06), rgba(224,123,57,0.06))", border: "1px solid rgba(224,123,57,0.2)" }}
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      >
                        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-black" style={{ background: "linear-gradient(135deg, #00979D, #E07B39)", color: "#fff" }}>
                          {faculty.name.charAt(0)}
                        </div>
                        <h3 className="font-semibold mb-1" style={{ color: "#f0f4ff" }}>{faculty.name}</h3>
                        <p className="text-sm" style={{ color: "#E07B39" }}>{faculty.designation}</p>
                        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{faculty.department}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* ─────────────────────────────────────
              SPONSORS
          ───────────────────────────────────── */}
          {active === "sponsors" && (
            <div className="pt-16">
              <Section>
                <SectionHeading>Sponsors</SectionHeading>
                <div className="grid sm:grid-cols-2 gap-6">
                  {sponsors.map((sponsor, i) => (
                    <motion.div
                      key={i}
                      className="p-7 rounded-2xl flex flex-col gap-4"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,151,157,0.1)" }}
                      whileHover={{ borderColor: "rgba(0,151,157,0.3)", backgroundColor: "rgba(0,151,157,0.04)" }}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    >
                      {sponsor.logo && (
                        <div className="h-16 flex items-center">
                          <img src={sponsor.logo} alt={sponsor.name} className="h-full object-contain" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-base mb-0.5" style={{ color: "#00979D", fontFamily: "'Space Mono', monospace" }}>{sponsor.name}</h3>
                        <p className="text-xs mb-3" style={{ color: "#E07B39" }}>{sponsor.location}</p>
                        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{sponsor.description}</p>
                      </div>
                      {sponsor.website && (
                        <a
                          href={sponsor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="self-start flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all"
                          style={{ backgroundColor: "rgba(0,151,157,0.12)", color: "#00979D", border: "1px solid rgba(0,151,157,0.25)" }}
                        >
                          Visit Website <ExternalLink size={11} />
                        </a>
                      )}
                    </motion.div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* ─────────────────────────────────────
              ABOUT
          ───────────────────────────────────── */}
          {active === "about" && (
            <div className="pt-16">
              <Section>
                <SectionHeading>About Arduino Days</SectionHeading>

                <div className="space-y-6 mb-16">
                  {[
                    { highlight: "Arduino Days 2026", text: " is a 3-day technical event designed to inspire innovation, creativity, and hands-on learning in the fields of Arduino, IoT, Embedded Systems, and Real-Time Project Development." },
                    { text: "This event brings together students from all branches to collaborate, learn emerging technologies, and transform ideas into real-world working prototypes. Through workshops, hackathons, and project expos, participants gain practical exposure beyond classroom learning." },
                    { text: "Our mission is to promote technical excellence, teamwork, and problem-solving skills while building a strong community of passionate innovators and future engineers." },
                  ].map((para, i) => (
                    <motion.div
                      key={i}
                      className="p-6 rounded-2xl text-base leading-relaxed"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,151,157,0.08)", color: "rgba(255,255,255,0.65)" }}
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    >
                      {para.highlight && <span className="font-semibold" style={{ color: "#00979D" }}>{para.highlight}</span>}
                      {para.text}
                    </motion.div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                  {[
                    { value: "3", label: "Days", color: "#00979D" },
                    { value: "500+", label: "Expected Participants", color: "#E07B39" },
                    { value: "10+", label: "Events & Workshops", color: "#00c4a7" },
                    { value: "₹33K+", label: "Total Prize Pool", color: "#f0a060" },
                  ].map((stat, i) => (
                    <div key={i} className="p-5 rounded-xl text-center" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${stat.color}20` }}>
                      <p className="text-3xl font-black mb-1" style={{ color: stat.color, fontFamily: "'Space Mono', monospace" }}>{stat.value}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* About website */}
                <div className="rounded-2xl p-8" style={{ background: "linear-gradient(135deg, rgba(0,151,157,0.06), rgba(224,123,57,0.04))", border: "1px solid rgba(0,151,157,0.15)" }}>
                  <h2 className="text-xl font-bold mb-6" style={{ color: "#E07B39", fontFamily: "'Space Mono', monospace" }}>About This Website</h2>
                  <div className="space-y-4">
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                      This website is the official digital platform for Arduino Days 2026, providing complete information about events, registration, coordinators, schedules, and announcements.
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Built with modern web technologies, the platform ensures a smooth, interactive, and responsive user experience across all devices — reflecting the innovative spirit of the event itself.
                    </p>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* ─────────────────────────────────────
              FAQ
          ───────────────────────────────────── */}
          {active === "faq" && (
            <div className="pt-16">
              <Section>
                <SectionHeading>Frequently Asked Questions</SectionHeading>
                <div className="space-y-3 max-w-3xl mx-auto">
                  {faqs.map((faq, i) => (
                    <FAQItem key={i} faq={faq} index={i} />
                  ))}
                </div>
              </Section>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ── FAQ ACCORDION ITEM ── */
const FAQItem = ({ faq, index }: { faq: { q: string; a: string }; index: number }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className="rounded-xl overflow-hidden"
      style={{ border: open ? "1px solid rgba(0,151,157,0.3)" : "1px solid rgba(255,255,255,0.06)", backgroundColor: open ? "rgba(0,151,157,0.04)" : "rgba(255,255,255,0.02)" }}
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
    >
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium" style={{ color: open ? "#00979D" : "rgba(255,255,255,0.75)" }}>{faq.q}</span>
        <ChevronDown
          size={16}
          className="flex-shrink-0 transition-transform duration-200"
          style={{ color: "#00979D", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ArduinoDays;