import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ieeeLogo from "../../../src/assets/logos/ieee.png";
import spsLogo from "../../../src/assets/logos/sps.png";
import adityaLogo from "../../../src/assets/logos/aditya.png";

const sections = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "guidelines", label: "Guidelines" },
  { id: "schedule", label: "Schedule" },
  { id: "help", label: "Help Desk" },
  { id: "faq", label: "FAQ" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);

      const scrollPosition = window.scrollY + 120;

      for (const section of sections) {
        const element = document.getElementById(section.id);

        if (!element) continue;

        if (
          scrollPosition >= element.offsetTop &&
          scrollPosition < element.offsetTop + element.offsetHeight
        ) {
          setActive(section.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMenuOpen(false);

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleNavigation = (id: string) => {
    setMenuOpen(false);

    if (id === "register") {
      navigate("/space-day/register");
      return;
    }

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <>
      {/* ================= Navbar ================= */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto h-16 md:h-16 px-4 md:px-6 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => scrollToSection("home")}
            className="flex items-center gap-2 sm:gap-4 md:gap-8 shrink-0"
          >
            <img
              src={ieeeLogo}
              alt="IEEE"
              className="h-8 sm:h-10 md:h-12 w-auto object-contain"
            />

            <img
              src={spsLogo}
              alt="IEEE SPS"
              className="h-8 sm:h-10 md:h-12 w-auto object-contain"
            />

            <img
              src={adityaLogo}
              alt="Aditya"
              className="h-8 sm:h-10 md:h-12 w-auto object-contain"
            />
          </button>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-7">
            {sections.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className="relative text-sm font-medium text-slate-600 hover:text-[#00629B] transition-colors"
              >
                {item.label}

                {active === item.id && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#00629B] rounded-full"
                  />
                )}
              </button>
            ))}

            {/* Register Button */}
            <button
              onClick={() => navigate("/space-day/register")}
              className="rounded-xl bg-[#00629B] px-4 py-2 text-xs font-semibold text-white transition-all duration-300 hover:bg-[#004E7C] hover:shadow-md"
            >
              Register
            </button>
          </div>

          {/* Mobile */}
          <button
            className="md:hidden shrink-0 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* ================= Mobile Menu ================= */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 25,
              }}
              className="fixed right-0 top-0 h-screen w-72 max-w-[85vw] bg-white z-50 shadow-xl p-6 sm:p-8"
            >
              <div className="mt-14 space-y-2">
                {sections.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      active === item.id
                        ? "bg-blue-50 text-[#00629B] font-semibold"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                <button
                  onClick={() => navigate("/space-day/register")}
                  className="w-full mt-4 rounded-xl bg-[#00629B] px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#004E7C]"
                >
                  Register
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}