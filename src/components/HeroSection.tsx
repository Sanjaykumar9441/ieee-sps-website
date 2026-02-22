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
  "Rajdhani"
];


  const [fontIndex, setFontIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFontIndex(Math.floor(Math.random() * fonts.length));
    }, 200); // FAST switch

    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-start justify-center pt-40 overflow-hidden bg-background text-foreground"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,181,226,0.18),transparent_60%)]" />

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">

        {/* Badge */}
        <div className="relative p-[2px] rounded-full animate-rgb-border inline-block mb-8">
          <div className="px-6 py-2 rounded-full bg-card border border-border backdrop-blur-md">
            <div className="inline-flex items-center gap-2 text-sm tracking-widest uppercase font-medium text-muted-foreground">
              <Zap className="w-4 h-4 text-primary" />
              IEEE Signal Processing Society
            </div>
          </div>
        </div>

        {/* Main Heading */}
        <h1
          className="text-6xl md:text-8xl font-bold tracking-tight mb-8"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          IEEE{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            SPS
          </span>
        </h1>

        {/* Instant Font Change */}
        <h2
          className="text-3xl md:text-5xl font-semibold mb-8 text-gray-300"
          style={{
            fontFamily: `${fonts[fontIndex]}, sans-serif`,
            letterSpacing: "2px"
          }}
        >
          Student Branch Chapter
        </h2>

        <p className="text-lg md:text-xl max-w-3xl mx-auto mb-14 text-muted-foreground">
          Aditya University — Advancing signal processing research,
          fostering innovation, and building a globally connected
          technical community.
        </p>

        <a
  href="https://forms.office.com/r/DU2j5CXpd2"
  target="_blank"
  rel="noreferrer"
  className="
    btn-glow-light
    inline-block
  "
>
  Join IEEE SPS
</a>

      </div>
    </section>
  );
};

export default HeroSection;
