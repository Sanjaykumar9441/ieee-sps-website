import { Zap } from "lucide-react";
import { useEffect, useState } from "react";

const HeroSection = () => {
  const fonts = [
  "Orbitron",
  "Audiowide",
  "Bebas Neue",
  "Cinzel",
  "Playfair Display",
  "Oswald",
  "Righteous",
  "Anton",
  "Exo 2",
  "Rajdhani",
];

const [fontIndex, setFontIndex] = useState(0);

useEffect(() => {
  let lastChange = 0;

  const handleScroll = () => {
    const now = Date.now();

    if (now - lastChange > 500) {
      setFontIndex(prev => (prev + 1) % fonts.length);
      lastChange = now;
    }
  };

  window.addEventListener("wheel", handleScroll);      // Desktop
  window.addEventListener("touchmove", handleScroll);  // Mobile

  return () => {
    window.removeEventListener("wheel", handleScroll);
    window.removeEventListener("touchmove", handleScroll);
  };
}, []);

    return (
  <section
    id="home"
    className="relative min-h-screen 
           flex flex-col items-center justify-center
           pt-20 sm:pt-0
           px-6 
           overflow-hidden 
           bg-background text-foreground"
  >

    {/* Animated Gradient Background */}
    <div
  className="
  absolute inset-0 -z-10
  
  /* LIGHT MODE BACKGROUND */
  bg-gradient-to-br
  from-white
  via-slate-100
  to-slate-200
  
  /* DARK MODE BACKGROUND */
  dark:from-cyan-900/30
  dark:via-black
  dark:to-blue-900/40
"
/>

    {/* Floating Glow Blobs */}
    <div className="absolute top-20 left-10 w-72 h-72 
                    bg-cyan-400/30 rounded-full blur-3xl 
                    animate-pulse" />

    <div className="absolute bottom-20 right-10 w-80 h-80 
                    bg-blue-500/30 rounded-full blur-3xl 
                    animate-pulse delay-1000" />

    <div className="relative z-10 text-center max-w-5xl mx-auto">

      {/* Badge */}
      <div className="mb-8 inline-flex items-center gap-2 
                      px-6 py-2 rounded-full 
                      backdrop-blur-xl 
                      bg-white/80 border border-gray-200 
                      dark:bg-white/10 dark:border-white/20
                      shadow-lg shadow-cyan-500/20
                      text-xs sm:text-sm tracking-widest uppercase 
                      font-medium text-gray-800 dark:text-white/80">
        <Zap className="w-4 h-4 text-cyan-400" />
        IEEE Signal Processing Society
      </div>

      {/* Main Heading */}
      <h1 className="text-5xl sm:text-6xl md:text-8xl 
                     font-extrabold tracking-tight mb-6">
        IEEE{" "}
        <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">

  SPS
</span>
      </h1>
      

      {/* Animated Sub Heading */}
      <h2
  className="text-xl sm:text-3xl md:text-5xl 
             font-semibold mb-6 
             text-gray-900 dark:text-white/90"
        style={{
          fontFamily: `${fonts[fontIndex]}, sans-serif`,
          letterSpacing: "3px",
        }}
      >
        Student Branch Chapter
      </h2>

      {/* Paragraph */}
      <p className="text-sm sm:text-base md:text-xl 
              max-w-3xl mx-auto mb-10 
              text-gray-700 dark:text-white/70 
              leading-relaxed">
        Aditya University — Advancing signal processing research,
        fostering innovation, and building a globally connected
        technical community.
      </p>

      {/* CTA Button */}
<a
  href="https://forms.office.com/r/DU2j5CXpd2"
  target="_blank"
  rel="noreferrer"
  className="btn-glow-light inline-block"
>
  Join IEEE SPS
</a>

    </div>
  </section>
);
};

export default HeroSection;