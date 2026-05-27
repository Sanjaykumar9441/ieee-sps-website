import {
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  Mail,
  Phone,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden border-t dark:border-white/10 border-black/5 bg-background">
      {/* BACKGROUND LIGHTS */}
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 blur-[120px] rounded-full" />

      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-pink-500/10 blur-[120px] rounded-full" />

      {/* MAIN CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-20">
        {/* TOP */}
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* LEFT */}
          <div>
            {/* BADGE */}
            <div className="inline-flex px-4 py-2 rounded-full border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 backdrop-blur-xl text-sm text-foreground/70 mb-6">
              IEEE SPS Aditya University
            </div>

            {/* TITLE */}
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight text-foreground">
              Building The Future Through
              <span className="block mt-3 bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                Innovation & Collaboration
              </span>
            </h2>

            {/* DESCRIPTION */}
            <p className="mt-8 text-lg leading-relaxed dark:text-slate-300 text-slate-600 max-w-xl">
              IEEE Signal Processing Society empowers students through
              innovation, research, workshops, and collaborative technical
              experiences.
            </p>
          </div>

          {/* RIGHT */}
          <div className="grid sm:grid-cols-2 gap-10">
            {/* CONTACT */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Contact
              </h3>

              <div className="space-y-5">
                <div className="flex items-center gap-4 dark:text-slate-300 text-slate-600">
                  <div className="w-11 h-11 rounded-2xl border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>

                  <span>ieee.club.aus@gmail.com</span>
                </div>

                <div className="flex items-center gap-4 dark:text-slate-300 text-slate-600">
                  <div className="w-11 h-11 rounded-2xl border dark:border-white/10 border-black/5 dark:bg-white/5 bg-white/70 flex items-center justify-center">
                    <Phone className="w-5 h-5" />
                  </div>

                  <span>+91 70950 09441</span>
                </div>
              </div>
            </div>

            {/* SOCIALS */}
            <ul className="example-2 flex-row">
              <li className="icon-content">
                <a
                  data-social="linkedin"
                  aria-label="LinkedIn"
                  href="https://www.linkedin.com/company/ieee-student-chapter-aditya-university/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="filled"></div>

                  <svg
                    xmlSpace="preserve"
                    viewBox="0 0 16 16"
                    className="bi bi-linkedin"
                    fill="currentColor"
                    height="16"
                    width="16"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill="currentColor"
                      d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z"
                    ></path>
                  </svg>
                </a>

                <div className="tooltip">LinkedIn</div>
              </li>

              <li className="icon-content">
                <a
                  data-social="facebook"
                  aria-label="Facebook"
                  href="https://www.facebook.com/ieee.sps.aus"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="filled"></div>

                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    height="16"
                    width="16"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M22 12.07C22 6.477 17.523 2 12 2S2 6.477 2 12.07c0 5.017 3.657 9.175 8.438 9.93v-7.03H7.898v-2.9h2.54V9.845c0-2.52 1.492-3.913 3.777-3.913 1.094 0 2.238.198 2.238.198v2.475h-1.26c-1.243 0-1.63.775-1.63 1.57v1.885h2.773l-.443 2.9h-2.33V22c4.78-.755 8.437-4.913 8.437-9.93z"></path>
                  </svg>
                </a>

                <div className="tooltip">Facebook</div>
              </li>

              <li className="icon-content">
                <a
                  data-social="instagram"
                  aria-label="Instagram"
                  href="https://www.instagram.com/ieee.sps.aus?igsh=MXc0b3ViYjN6OGJ6bA=="
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="filled"></div>

                  <svg
                    xmlSpace="preserve"
                    viewBox="0 0 16 16"
                    className="bi bi-instagram"
                    fill="currentColor"
                    height="16"
                    width="16"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill="currentColor"
                      d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"
                    ></path>
                  </svg>
                </a>

                <div className="tooltip">Instagram</div>
              </li>

              <li className="icon-content">
                <a
                  data-social="twitter"
                  aria-label="Twitter"
                  href="https://x.com/ieee_sps_aus"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="filled"></div>

                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    height="16"
                    width="16"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M18.244 2H21.5l-7.12 8.135L22 22h-6.828l-5.347-6.99L3.7 22H.44l7.62-8.71L1 2h7l4.833 6.35zm-1.197 18h1.8L7.02 3.894H5.09z"></path>
                  </svg>
                </a>

                <div className="tooltip">Twitter</div>
              </li>
            </ul>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="mt-16 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* BOTTOM */}
        <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm dark:text-slate-400 text-slate-500 text-center md:text-left">
            © {new Date().getFullYear()} IEEE SPS Student Branch Chapter —
            Aditya University. All rights reserved.
          </p>

          <p className="text-sm dark:text-slate-400 text-slate-500 text-center md:text-right">
            Developed by{" "}
            <a
              href="https://www.linkedin.com/in/sanjaykumarchitturi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-pink-300 transition-all duration-300"
            >
              Sanjay Kumar Chitturi
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
