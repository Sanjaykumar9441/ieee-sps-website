import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import ieeeLogo from "../assets/logos/ieee.png";
import spsLogo from "../assets/logos/sps.png";
import uniLogo from "../assets/logos/university.png";

const links = [
  { label: "About", href: "about" },
  { label: "Events", href: "events" },
  { label: "Team", href: "team" },
  { label: "Contact", href: "contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const toggleTheme = () => {
    setDarkMode(!darkMode);

    document.documentElement.classList.toggle("dark");
  };

  const handleNavClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });

    setOpen(false);
  };

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? "backdrop-blur-xl bg-white/60 dark:bg-background/80 border-b border-white/40 dark:border-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-16">
          <div className="flex items-center justify-between h-20">
            {/* LEFT LOGOS */}
            <div className="flex items-center gap-5 ml-16">
              <img
                src={spsLogo}
                alt="SPS"
                className="h-8 md:h-9 w-auto object-contain"
              />

              <img
                src={ieeeLogo}
                alt="IEEE"
                className="h-8 md:h-9 w-auto object-contain"
              />

              <img
                src={uniLogo}
                alt="University"
                className="h-8 md:h-9 w-auto object-contain"
              />

              {/* IEEE TEXT BADGE */}
              <div className="hidden lg:flex items-center gap-5 px-4 py-2 ml-16 rounded-full border border-white/10 dark:bg-white/5 bg-black/5 backdrop-blur-xl">
                <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />

                <span className="text-sm font-medium text-foreground/80">
                  IEEE Signal Processing Society
                </span>
              </div>
            </div>

            {/* DESKTOP NAV */}
            <div className="hidden md:flex items-center gap-10">
              <nav className="flex items-center gap-8">
                {links.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link.href)}
                    className="relative text-sm font-medium text-foreground/80 hover:text-foreground transition-all duration-300 group"
                  >
                    {link.label}

                    <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300 group-hover:w-full" />
                  </button>
                ))}
              </nav>

              <label className="switch">
                <input
                  id="input"
                  type="checkbox"
                  checked={darkMode}
                  onChange={toggleTheme}
                />

                <div className="slider round">
                  <div className="sun-moon">
                    <svg
                      id="moon-dot-1"
                      className="moon-dot"
                      viewBox="0 0 100 100"
                    >
                      <circle cx="50" cy="50" r="50"></circle>
                    </svg>

                    <svg
                      id="moon-dot-2"
                      className="moon-dot"
                      viewBox="0 0 100 100"
                    >
                      <circle cx="50" cy="50" r="50"></circle>
                    </svg>

                    <svg
                      id="moon-dot-3"
                      className="moon-dot"
                      viewBox="0 0 100 100"
                    >
                      <circle cx="50" cy="50" r="50"></circle>
                    </svg>

                    <svg
                      id="light-ray-1"
                      className="light-ray"
                      viewBox="0 0 100 100"
                    >
                      <circle cx="50" cy="50" r="50"></circle>
                    </svg>

                    <svg
                      id="light-ray-2"
                      className="light-ray"
                      viewBox="0 0 100 100"
                    >
                      <circle cx="50" cy="50" r="50"></circle>
                    </svg>

                    <svg
                      id="light-ray-3"
                      className="light-ray"
                      viewBox="0 0 100 100"
                    >
                      <circle cx="50" cy="50" r="50"></circle>
                    </svg>
                  </div>

                  <div className="stars">
                    <svg id="star-1" className="star" viewBox="0 0 20 20">
                      <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
                    </svg>

                    <svg id="star-2" className="star" viewBox="0 0 20 20">
                      <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
                    </svg>
                  </div>
                </div>
              </label>
            </div>

            {/* MOBILE BUTTON */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden text-foreground"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-lg" />

        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[90%] rounded-3xl border dark:border-white/10 border-black/5 bg-[#0F172A]/90 backdrop-blur-2xl p-8">
          <div className="flex flex-col gap-6">
            {links.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="text-left text-lg text-foreground/80 hover:text-foreground transition"
              >
                {link.label}
              </button>
            ))}

            <div className="pt-4 border-t dark:border-white/10 border-black/5">
              <label className="switch">
                <input
                  id="input"
                  type="checkbox"
                  checked={darkMode}
                  onChange={toggleTheme}
                />

                <div className="slider round">
                  <div className="sun-moon">
                    <svg
                      id="moon-dot-1"
                      className="moon-dot"
                      viewBox="0 0 100 100"
                    >
                      <circle cx="50" cy="50" r="50"></circle>
                    </svg>

                    <svg
                      id="moon-dot-2"
                      className="moon-dot"
                      viewBox="0 0 100 100"
                    >
                      <circle cx="50" cy="50" r="50"></circle>
                    </svg>

                    <svg
                      id="moon-dot-3"
                      className="moon-dot"
                      viewBox="0 0 100 100"
                    >
                      <circle cx="50" cy="50" r="50"></circle>
                    </svg>

                    <svg
                      id="light-ray-1"
                      className="light-ray"
                      viewBox="0 0 100 100"
                    >
                      <circle cx="50" cy="50" r="50"></circle>
                    </svg>

                    <svg
                      id="light-ray-2"
                      className="light-ray"
                      viewBox="0 0 100 100"
                    >
                      <circle cx="50" cy="50" r="50"></circle>
                    </svg>

                    <svg
                      id="light-ray-3"
                      className="light-ray"
                      viewBox="0 0 100 100"
                    >
                      <circle cx="50" cy="50" r="50"></circle>
                    </svg>
                  </div>

                  <div className="stars">
                    <svg id="star-1" className="star" viewBox="0 0 20 20">
                      <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
                    </svg>

                    <svg id="star-2" className="star" viewBox="0 0 20 20">
                      <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
                    </svg>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
