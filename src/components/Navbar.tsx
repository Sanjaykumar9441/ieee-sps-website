import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ieeeLogo from "../assets/logos/ieee.png";
import spsLogo from "../assets/logos/sps.png";
import uniLogo from "../assets/logos/university.png";

const links = [
  { label: "About", href: "about" },
  { label: "Domains", href: "domains" },
  { label: "Events", href: "events" },
  { label: "Team", href: "team" },
  { label: "Contact", href: "contact" },
];

const Navbar = () => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-white border-b border-slate-200 shadow-sm" : "bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="flex items-center justify-between h-16">
            {/* LEFT LOGOS */}
            <div className="flex items-center gap-3">
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
              <div className="hidden lg:block ml-2">
                <h3 className="font-semibold text-slate-900 text-sm">
                  IEEE SPS
                </h3>

                <p className="text-xs text-slate-500">Aditya University</p>
              </div>
            </div>

            {/* DESKTOP NAV */}
            <div className="hidden md:flex items-center gap-10">
              <nav className="flex items-center gap-8">
                {links.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link.href)}
                    className="
text-sm
font-medium
text-slate-600
hover:text-[#00629B]
transition
"
                  >
                    {link.label}
                  </button>
                ))}
              </nav>
              <button
  onClick={() => navigate("/join-sps")}
  className="
  px-5
  py-2.5
  rounded-xl
  bg-[#00629B]
  text-white
  font-medium
  hover:bg-[#00517f]
  transition
  "
>
  Join SPS
</button>
            </div>

            {/* MOBILE BUTTON */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden text-slate-900"
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
        <div className="absolute inset-0 bg-black/30" />

        <div
          className="absolute top-24 left-1/2 -translate-x-1/2 w-[90%] rounded-3xl bg-white border border-slate-200 shadow-xl p-8"
        >
          <div className="flex flex-col gap-6">
            {links.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="
text-left
text-lg
font-medium
text-slate-700
hover:text-[#00629B]
transition
"
              >
                {link.label}
              </button>
            ))}
            <button
  onClick={() => {
    navigate("/join-sps");
    setOpen(false);
  }}
  className="
  mt-4
  w-full
  text-center
  bg-[#00629B]
  text-white
  py-3
  rounded-xl
  font-medium
  "
>
  Join SPS
</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
