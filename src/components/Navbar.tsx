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
      {/* Logos */}
      <div className="absolute top-6 left-12 flex items-center z-50 gap-6">
        <a
          href="https://signalprocessingsociety.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-105 transition duration-300"
        >
          <img src={spsLogo} alt="SPS" className="h-14 w-auto" />
        </a>

        <a
          href="https://www.ieee.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-105 transition duration-300"
        >
          <img src={ieeeLogo} alt="IEEE" className="h-14 w-auto" />
        </a>

        <a
          href="https://adityauniversity.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-105 transition duration-300"
        >
          <img src={uniLogo} alt="University" className="h-14 w-auto" />
        </a>
      </div>

      {/* Desktop Navbar */}
      <nav className="fixed top-8 right-10 z-50 hidden md:flex items-center gap-4">

        {/* 🌙 Separate Theme Toggle */}
        <ThemeToggle />

        {/* Glass Navigation */}
        <div className="bg-card/80 backdrop-blur-xl border border-border px-5 py-1.5 rounded-full shadow-md dark:shadow-[0_0_20px_rgba(6,182,212,0.3)] flex gap-2 text-sm font-medium items-center">

          {links.map((l) => {
            const sectionId = l.href.replace("#", "");

            return (
              <a
                key={l.label}
                href={l.href}
                className={`px-4 py-1 rounded-full transition-all duration-300 ${
                  active === sectionId
                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary))]"
                    : "text-foreground hover:text-primary hover:bg-muted"
                }`}
              >
                {l.label}
              </a>
            );
          })}

          <Link to="/admin-login" className="ml-2">
            <button className="px-3 py-1 text-xs tracking-wide text-primary border border-primary rounded-full hover:bg-primary hover:text-primary-foreground transition">
              Admin
            </button>
          </Link>

        </div>
      </nav>

      {/* ================= MOBILE NAV ================= */}
<div className="md:hidden fixed top-5 right-5 z-50 flex items-center gap-3">

  {/* Theme Toggle */}
  <ThemeToggle />

  {/* Hamburger */}
  <button
    onClick={() => setOpen(!open)}
    className="bg-card/90 backdrop-blur-xl p-2.5 rounded-full 
               border border-border shadow-md
               transition-all duration-300"
  >
    {open ? <X size={20} /> : <Menu size={20} />}
  </button>
</div>


{/* ================= MOBILE MENU ================= */}
{open && (
  <div className="md:hidden fixed top-20 left-1/2 -translate-x-1/2 
                  w-[90%] max-w-sm 
                  bg-card/95 backdrop-blur-xl 
                  border border-border 
                  rounded-2xl 
                  px-6 py-6 
                  space-y-5 
                  z-40 
                  shadow-xl 
                  animate-fadeIn">

    {/* Links */}
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

    {/* Divider */}
    <div className="h-px bg-border" />

    {/* Admin */}
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