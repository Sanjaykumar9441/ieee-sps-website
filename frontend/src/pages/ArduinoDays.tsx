import { useState, useEffect, useRef } from "react";
import {
  Home, HelpCircle, Info, Handshake, FileText, Menu, MapPin, Calendar,
  X, ChevronDown, ChevronLeft, ChevronRight, Download, ExternalLink, Play, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";

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
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
              day === d
                ? "bg-[#00629B] text-white border-[#00629B] shadow-sm"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            }`}
          >
            {d.replace("day", "Day ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-[#00629B]" />
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, i) => (
            <motion.div
              key={img.thumb}
              className="relative overflow-hidden rounded-xl cursor-pointer group border border-slate-200 bg-white"
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
        <p className="text-center py-20 text-sm text-slate-400">No images found</p>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(15,23,42,0.92)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIndex(null)}
          >
            <button onClick={(e) => { e.stopPropagation(); setSelectedIndex(null); }} className="absolute top-5 right-5 p-2 rounded-full text-white z-50 bg-white/10 hover:bg-white/20">
              <X size={18} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-5 p-3 rounded-full text-white z-50 bg-white/10 hover:bg-white/20">
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
            <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-5 p-3 rounded-full text-white z-50 bg-white/10 hover:bg-white/20">
              <ChevronRight size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              className="absolute bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium z-50 bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
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
    className={`w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-14 sm:py-20 ${className}`}
  >
    {children}
  </motion.div>
);

const SectionHeading = ({ children }: any) => (
  <div className="text-center mb-12 sm:mb-16">
    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
      {children}
    </h1>
    <div className="w-14 h-1 rounded-full bg-[#00629B] mx-auto mt-4" />
  </div>
);

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const ArduinoDays = () => {
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
    <div className="min-h-screen bg-[#F8FAFC]">
      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #F8FAFC; }
        ::-webkit-scrollbar-thumb { background: #00629B; border-radius: 2px; }
      `}</style>

      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-[200] bg-slate-100">
        <div className="h-full transition-all duration-100 bg-[#00629B]" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* ── TOP NAVBAR ── */}
      <nav
        className={`fixed top-0.5 left-0 right-0 z-[100] transition-all duration-300 bg-white ${
          scrolled ? "shadow-sm border-b border-slate-200" : "border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate_("home")}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white bg-[#00629B]">
              AD
            </div>
            <span className="font-bold text-sm hidden sm:block text-[#00629B]">
              Arduino Days <span className="text-slate-400">2026</span>
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate_(item.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                  active === item.id
                    ? "bg-blue-50 text-[#0C447C]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => window.open("https://ieee-sps-website-seven.vercel.app/", "_blank")}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border border-slate-200 text-slate-500 hover:border-slate-300"
            >
              <ExternalLink size={11} /> Main Site
            </button>
          </div>

          {/* mobile menu */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg bg-blue-50 text-[#00629B]"
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
              className="fixed inset-0 z-[90] lg:hidden bg-slate-900/40 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              ref={sidebarRef}
              className="fixed top-0 right-0 bottom-0 w-72 z-[95] lg:hidden flex flex-col pt-20 pb-8 px-6 bg-white border-l border-slate-200"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <div className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate_(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                      active === item.id
                        ? "bg-blue-50 text-[#0C447C]"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                ))}
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
              <section className="px-4 sm:px-6 pt-28 sm:pt-36 pb-10 sm:pb-16">
                <div className="max-w-4xl mx-auto">

                  {/* HERO CARD */}
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden mb-4 shadow-sm"
                  >
                    <div className="h-1 w-full bg-[#00629B]" />

                    <div className="p-6 sm:p-10 text-center">
                      {/* IEEE chip */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-[#0C447C] text-xs font-medium mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00629B]" />
                        Department of Electronics and Communication Engineering
                      </div>

                      <p className="text-xs sm:text-sm text-slate-400 mb-6">
                        In Association with IEEE SPS Student Branch Chapter
                      </p>

                      {/* Logos */}
                      <motion.div
                        className="flex flex-wrap justify-center items-center gap-8 md:gap-14 mb-6"
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                      >
                        <img src="/logo1.png" alt="Logo 1" className="h-8 md:h-10 object-contain" />
                        <img src="/logo2.png" alt="Logo 2" className="h-8 md:h-10 object-contain" />
                        <img src="/logo3.png" alt="Logo 3" className="h-8 md:h-10 object-contain" />
                      </motion.div>

                      <p className="text-xs font-semibold tracking-widest uppercase text-[#00629B] mb-4">
                        Presents
                      </p>

                      {/* Title */}
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-4">
                        Arduino Days <span className="text-[#00629B]">2026</span>
                      </h1>

                      {/* Tagline */}
                      <p className="text-sm sm:text-base max-w-xl mx-auto text-slate-500 mb-8">
                        A 3-Day Technical Event on Arduino, IoT, Embedded Systems &amp; Real-Time Project Development
                      </p>

                      {/* Meta pills */}
                      <div className="flex flex-wrap justify-center gap-2 mb-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-blue-50 text-[#0C447C] border border-blue-100">
                          <Calendar className="w-3.5 h-3.5" />
                          March 23rd – 25th, 2026
                        </span>
                        <div className="relative group">
                          <div className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer">
                            <MapPin className="w-3.5 h-3.5" />
                            <a href="https://maps.app.goo.gl/hFCpjSyJV1oPQzEZ8" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
                              Aditya University
                            </a>
                            <span className="text-xs underline text-[#00629B]">Map</span>
                          </div>
                          {/* Map popup */}
                          <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 hidden group-hover:block z-40">
                            <div className="rounded-xl p-3 shadow-2xl w-[260px] bg-white border border-slate-200">
                              <img src="/map.png" alt="Map" className="rounded-lg mb-2 w-full" />
                              <a href="https://maps.app.goo.gl/hFCpjSyJV1oPQzEZ8" target="_blank" rel="noopener noreferrer" className="block text-center text-xs text-[#00629B]">
                                Open in Google Maps →
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs tracking-[0.25em] uppercase font-semibold text-slate-400">
                        Innovation • Creativity • Real-Time Learning
                      </p>
                    </div>
                  </motion.div>

                  {/* QUICK STATS */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4"
                  >
                    {[
                      { value: "3", label: "Days" },
                      { value: "150+", label: "Expected Participants" },
                      { value: "3+", label: "Events & Workshops" },
                      { value: "₹50000", label: "Total Prize Pool" },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-[#00629B] mb-1">{stat.value}</p>
                        <p className="text-xs text-slate-400">{stat.label}</p>
                      </div>
                    ))}
                  </motion.div>

                  {/* Scroll to map button */}
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={scrollToMap}
                      className="inline-flex items-center gap-2 text-[#00629B] text-sm font-medium hover:gap-3 transition-all"
                    >
                      See the event map
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>

              {/* MAP SECTION */}
              <section id="community-map" className="px-4 sm:px-6 py-14 sm:py-20">
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4 text-center">
                      Organise a Community Event Around the World
                    </p>
                    <div className="rounded-xl overflow-hidden border border-slate-200">
                      <img
                        src="/map.png"
                        alt="Community Events Map"
                        className="w-full h-[220px] sm:h-[320px] md:h-[420px] object-cover"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ─────────────────────────────────────
              GALLERY
          ───────────────────────────────────── */}
          {active === "gallery" && (
            <div className="pt-24 sm:pt-28">
              <Section>
                <SectionHeading>Gallery</SectionHeading>
                {/* YouTube */}
                <div className="mb-12 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
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
            <div className="pt-24 sm:pt-28">
              <Section>
                <SectionHeading>Help Desk</SectionHeading>

                {/* Student Coordinators */}
                <div className="mb-16">
                  <h2 className="text-xl font-bold text-center mb-8 text-slate-900">
                    Student Coordinators
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {studentCoordinators.map((member, i) => (
                      <motion.div
                        key={i}
                        className="p-6 rounded-2xl text-center bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-colors"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      >
                        <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-lg font-black bg-blue-50 border border-blue-100 text-[#00629B]">
                          {member.name.charAt(0)}
                        </div>
                        <h3 className="font-semibold text-sm mb-0.5 text-slate-900">{member.name}</h3>
                        <p className="text-xs font-medium mb-0.5 text-[#00629B]">{member.designation}</p>
                        <p className="text-xs text-slate-400">{member.department}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Faculty */}
                <div>
                  <h2 className="text-xl font-bold text-center mb-8 text-slate-900">
                    Faculty Advisor
                  </h2>
                  <div className="flex justify-center">
                    {facultyCoordinators.map((faculty, i) => (
                      <motion.div
                        key={i}
                        className="w-full max-w-sm p-8 rounded-2xl text-center bg-white border border-slate-200 shadow-sm"
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      >
                        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-black text-white bg-[#00629B]">
                          {faculty.name.charAt(0)}
                        </div>
                        <h3 className="font-semibold mb-1 text-slate-900">{faculty.name}</h3>
                        <p className="text-sm text-[#00629B]">{faculty.designation}</p>
                        <p className="text-xs mt-1 text-slate-400">{faculty.department}</p>
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
            <div className="pt-24 sm:pt-28">
              <Section>
                <SectionHeading>Sponsors</SectionHeading>
                <div className="grid sm:grid-cols-2 gap-6">
                  {sponsors.map((sponsor, i) => (
                    <motion.div
                      key={i}
                      className="p-7 rounded-2xl flex flex-col gap-4 bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-colors"
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    >
                      {sponsor.logo && (
                        <div className="h-16 flex items-center">
                          <img src={sponsor.logo} alt={sponsor.name} className="h-full object-contain" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-base mb-0.5 text-slate-900">{sponsor.name}</h3>
                        <p className="text-xs mb-3 text-[#00629B]">{sponsor.location}</p>
                        <p className="text-sm leading-relaxed text-slate-500">{sponsor.description}</p>
                      </div>
                      {sponsor.website && (
                        <a
                          href={sponsor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="self-start flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all bg-blue-50 text-[#00629B] border border-blue-100 hover:bg-blue-100"
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
            <div className="pt-24 sm:pt-28">
              <Section>
                <SectionHeading>About Arduino Days</SectionHeading>

                <div className="space-y-4 mb-16">
                  {[
                    { highlight: "Arduino Days 2026", text: " is a 3-day technical event designed to inspire innovation, creativity, and hands-on learning in the fields of Arduino, IoT, Embedded Systems, and Real-Time Project Development." },
                    { text: "This event brings together students from all branches to collaborate, learn emerging technologies, and transform ideas into real-world working prototypes. Through workshops, hackathons, and project expos, participants gain practical exposure beyond classroom learning." },
                    { text: "Our mission is to promote technical excellence, teamwork, and problem-solving skills while building a strong community of passionate innovators and future engineers." },
                  ].map((para, i) => (
                    <motion.div
                      key={i}
                      className="p-6 rounded-2xl text-base leading-relaxed bg-white border border-slate-200 shadow-sm text-slate-600"
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    >
                      {para.highlight && <span className="font-semibold text-[#00629B]">{para.highlight}</span>}
                      {para.text}
                    </motion.div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                  {[
                    { value: "3", label: "Days" },
                    { value: "150+", label: "Expected Participants" },
                    { value: "3+", label: "Events & Workshops" },
                    { value: "₹50000", label: "Total Prize Pool" },
                  ].map((stat, i) => (
                    <div key={i} className="p-5 rounded-xl text-center bg-white border border-slate-200 shadow-sm">
                      <p className="text-3xl font-bold mb-1 text-[#00629B]">{stat.value}</p>
                      <p className="text-xs text-slate-400">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* About website */}
                <div className="rounded-2xl p-8 bg-blue-50/60 border border-blue-100">
                  <h2 className="text-xl font-bold mb-6 text-slate-900">About This Website</h2>
                  <div className="space-y-4">
                    <p className="text-sm leading-relaxed text-slate-600">
                      This website is the official digital platform for Arduino Days 2026, providing complete information about events, registration, coordinators, schedules, and announcements.
                    </p>
                    <p className="text-sm leading-relaxed text-slate-600">
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
            <div className="pt-24 sm:pt-28">
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
      className={`rounded-xl overflow-hidden bg-white border shadow-sm ${open ? "border-[#00629B]/40" : "border-slate-200"}`}
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
    >
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
        onClick={() => setOpen(!open)}
      >
        <span className={`text-sm font-medium flex items-center gap-2 ${open ? "text-[#00629B]" : "text-slate-700"}`}>
          {open && <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
          {faq.q}
        </span>
        <ChevronDown
          size={16}
          className="flex-shrink-0 transition-transform duration-200 text-[#00629B]"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
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
            <p className="px-6 pb-5 text-sm leading-relaxed text-slate-500">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ArduinoDays;