import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

import ieeeLogo from "../assets/logos/ieee.png";
import spsLogo from "../assets/logos/sps.png";
import uniLogo from "../assets/logos/university.png";

const links = [
  { label: "About", href: "#about" },
  { label: "Events", href: "#events" },
  { label: "Team", href: "#team" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");

  useEffect(() => {
    const sections = document.querySelectorAll("section");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { threshold: 0.6 }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return (
    <>
      {/* ================= LOGOS ================= */}
      <div className="absolute top-6 left-0 right-0 flex justify-center md:justify-start md:left-12 z-50 gap-6">
        <a
          href="https://signalprocessingsociety.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-105 transition duration-300"
        >
          <img src={spsLogo} alt="SPS" className="h-12 md:h-14 w-auto" />
        </a>

        <a
          href="https://www.ieee.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-105 transition duration-300"
        >
          <img src={ieeeLogo} alt="IEEE" className="h-12 md:h-14 w-auto" />
        </a>

        <a
          href="https://adityauniversity.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-105 transition duration-300"
        >
          <img src={uniLogo} alt="University" className="h-12 md:h-14 w-auto" />
        </a>
      </div>

      
      {/* ================= MOBILE CONTROLS (Combined) ================= */}
<div className="md:hidden absolute top-24 left-0 right-0 flex justify-center z-50">

  <div className="flex items-center gap-3
                px-4 py-1.5
                rounded-full
                backdrop-blur-md
                bg-white/10
                border border-white/20
                shadow-md">

    {/* Theme Toggle */}
    <ThemeToggle />

    {/* Divider */}
    <div className="w-px h-5 bg-white/30" />

    {/* Hamburger */}
    <button
      onClick={() => setOpen(!open)}
      className="transition-all duration-300"
    >
      {open ? <X size={18} /> : <Menu size={18} />}
    </button>

  </div>
</div>

    
      {/* ================= PREMIUM DESKTOP NAV ================= */}
<nav className="fixed top-6 right-12 z-50 hidden md:flex items-center gap-4">

  <div className="flex items-center gap-4 
                px-6 py-2.5 
                rounded-full 
                backdrop-blur-2xl 
                
                /* Light Mode */
                bg-white/80 border border-gray-200 shadow-lg
                
                /* Dark Mode */
                dark:bg-white/5 dark:border-white/20 
                dark:shadow-[0_0_40px_rgba(6,182,212,0.25)]
                
                transition-all duration-500">

    <ThemeToggle />

    <div className="flex gap-2 text-sm font-semibold tracking-wide items-center">

      {links.map((l) => {
        const sectionId = l.href.replace("#", "");

        return (
          <a
            key={l.label}
            href={l.href}
            className={`relative px-4 py-1.5 rounded-full transition-all duration-300 ${
              active === sectionId
  ? "text-white bg-cyan-500 shadow-lg"
  : "text-black dark:text-white/80 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10"
            }`}
          >
            {l.label}
          </a>
        );
      })}

      <Link to="/admin-login" className="ml-3">
        <button className="px-4 py-1.5 text-xs font-semibold tracking-wider
                           bg-gradient-to-r from-cyan-500 to-blue-600
                           text-white rounded-full
                           hover:scale-105
                           transition-all duration-300
                           shadow-lg shadow-cyan-500/30">
          Admin
        </button>
      </Link>

    </div>
  </div>
</nav>

      {/* ================= MOBILE MENU ================= */}
      {open && (
        <div className="md:hidden fixed top-40 left-1/2 -translate-x-1/2 
                        w-[90%] max-w-sm 
                        bg-card/95 backdrop-blur-xl 
                        border border-border 
                        rounded-2xl 
                        px-6 py-6 
                        space-y-5 
                        z-40 
                        shadow-xl">

          {links.map((l) => {
            const sectionId = l.href.replace("#", "");

            return (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block text-center px-4 py-2 rounded-lg transition-all duration-300 ${
                  active === sectionId
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {l.label}
              </a>
            );
          })}

          <div className="h-px bg-border" />

          <Link
            to="/admin-login"
            onClick={() => setOpen(false)}
            className="block text-center border border-primary text-primary 
                       px-4 py-2 rounded-lg 
                       hover:bg-primary hover:text-primary-foreground 
                       transition-all duration-300"
          >
            Admin
          </Link>

        </div>
      )}
    </>
  );
};

export default Navbar;