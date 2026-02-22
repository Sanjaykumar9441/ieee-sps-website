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

  // 🔥 Scroll Spy Logic
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
      {
        threshold: 0.6,
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return (
    <>
     <div className="absolute top-6 left-12 flex items-center z-50 gap-6">

  {/* SPS */}
  <a
    href="https://signalprocessingsociety.org/"
    target="_blank"
    rel="noopener noreferrer"
    className="hover:scale-105 transition duration-300"
  >
    <img src={spsLogo} alt="SPS" className="h-14 w-auto" />
  </a>

  {/* IEEE */}
  <a
    href="https://www.ieee.org/"
    target="_blank"
    rel="noopener noreferrer"
    className="hover:scale-105 transition duration-300"
  >
    <img src={ieeeLogo} alt="IEEE" className="h-14 w-auto" />
  </a>

  {/* University */}
  <a
    href="https://adityauniversity.in/"   // change if different
    target="_blank"
    rel="noopener noreferrer"
    className="hover:scale-105 transition duration-300"
  >
    <img src={uniLogo} alt="University" className="h-14 w-auto" />
  </a>

</div>


      {/* Navbar */}
      <nav className="fixed top-8 left-[75%] -translate-x-1/2 z-50">
        <div className="relative bg-card/80 backdrop-blur-xl border border-border px-5 py-1.5 rounded-full shadow-md dark:shadow-[0_0_20px_rgba(6,182,212,0.3)] hidden md:flex gap-2 text-sm font-medium items-center">
          {/* Nav Links */}
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

          {/* Admin Button */}
          <Link to="/admin-login" className="ml-3">
            <button className="px-3 py-1 text-xs tracking-wide text-cyan-400 border border-cyan-400 rounded-full hover:bg-cyan-400 hover:text-black transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]">
              Admin
            </button>
          </Link>

        </div>

       <div className="flex items-center gap-4">
            <ThemeToggle />
            <button>Admin</button>
       </div>

        {/* Mobile Toggle */}
        <div className="md:hidden fixed top-4 right-4">
          <button
            onClick={() => setOpen(!open)}
            className="bg-white/10 backdrop-blur-md p-2 rounded-lg border border-white/20 text-white"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden fixed top-16 right-4 bg-black/90 backdrop-blur-xl border border-cyan-400/40 rounded-lg px-6 py-4 space-y-4 z-40 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          {links.map((l) => {
            const sectionId = l.href.replace("#", "");

            return (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded-lg transition ${
                  active === sectionId
                    ? "bg-cyan-400 text-black"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {l.label}
              </a>
            );
          })}

          <Link
            to="/admin-login"
            onClick={() => setOpen(false)}
            className="block border border-cyan-400 text-cyan-400 px-4 py-2 rounded-lg text-center hover:bg-cyan-400 hover:text-black transition"
          >
            Admin
          </Link>
        </div>
      )}
    </>
  );
};

export default Navbar;
