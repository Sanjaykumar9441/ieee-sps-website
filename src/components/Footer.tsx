import { Mail, Linkedin, Instagram, Facebook, Twitter, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-4 sm:px-6 bg-background">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">

        {/* Left Section */}
        <div className="text-center md:text-left">
          <h3
            className="font-bold text-lg text-foreground animate-rgb-text"
            style={{ fontFamily: "var(--font-display)" }}
          >
            IEEE SPS — Aditya University
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Signal Processing Society Student Branch Chapter
          </p>

          {/* Contact Info */}
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-2 justify-center md:justify-start">
              <Phone className="w-4 h-4" />
              +91 70950 09441
            </p>
            <p>
              Email: ieee.club.aus@gmail.com
            </p>
          </div>
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-6">

          {/* Email */}
          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=ieee.aus.club@gmail.com&su=IEEE%20SPS%20Inquiry"
            target="_blank"
            rel="noopener noreferrer"
            className="icon-hover"
            aria-label="Send Email"
          >
            <Mail className="w-5 h-5" />
          </a>

          

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/company/ieee-student-chapter-aditya-university/"
            target="_blank"
            rel="noopener noreferrer"
            className="icon-hover"
            aria-label="LinkedIn"
          >
            <Linkedin className="w-5 h-5" />
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/ieee.sps.aus?igsh=MXc0b3ViYjN6OGJ6bA=="
            target="_blank"
            rel="noopener noreferrer"
            className="icon-hover"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>

          {/* Facebook */}
          <a
            href="https://www.facebook.com/ieee.sps.aus"
            target="_blank"
            rel="noopener noreferrer"
            className="icon-hover"
            aria-label="Facebook"
           >
            <Facebook className="w-5 h-5" />
          </a>

          {/* Twitter / X */}
          <a
            href="https://x.com/ieee_sps_aus"
            target="_blank"
            rel="noopener noreferrer"
            className="icon-hover"
            aria-label="Twitter"
          >
            <Twitter className="w-5 h-5" />
          </a>

        </div>
      </div>

      <div className="rgb-line mt-10 mb-6" />

      <div className="text-center text-xs text-muted-foreground space-y-2">
  <p>
    © {new Date().getFullYear()} IEEE SPS Student Branch Chapter — Aditya University. All rights reserved.
  </p>

  <p>
    Created by{" "}
    <a
      href="https://www.linkedin.com/in/sanjaykumarchitturi"
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-primary hover:underline hover:drop-shadow-[0_0_6px_hsl(var(--primary))] transition-all duration-300"
    >
      Sanjay Kumar
    </a>
  </p>
</div>


      {/* Hover Glow Styles */}
      <style>{`
  .icon-hover {
    color: hsl(var(--muted-foreground));
    transition: all 0.3s ease;
  }

  .icon-hover:hover {
    color: hsl(var(--primary));
    transform: translateY(-3px) scale(1.1);
    filter: drop-shadow(0 0 6px hsl(var(--primary)));
  }
`}</style>

    </footer>
  );
};

export default Footer;
