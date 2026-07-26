import {
  Linkedin,
  Mail,
  Globe,
  MapPin,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Organization */}
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              IEEE SPS Student Branch Chapter
            </h3>

            <p className="mt-2 text-slate-600">
              Aditya University
            </p>

            <p className="text-slate-500">
              Surampalem, Andhra Pradesh
            </p>

            <div className="mt-5 flex items-center gap-2 text-slate-600">
              <MapPin size={18} />
              <span className="text-sm">
                National Space Day 2026
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Quick Links
            </h3>

            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href="#about"
                  className="text-slate-600 transition hover:text-[#00629B]"
                >
                  About Event
                </a>
              </li>

              <li>
                <a
                  href="#events"
                  className="text-slate-600 transition hover:text-[#00629B]"
                >
                  Competitions
                </a>
              </li>

              <li>
                <a
                  href="#shedule"
                  className="text-slate-600 transition hover:text-[#00629B]"
                >
                  Shedule
                </a>
              </li>

              <li>
                <a
                  href="#helpdesk"
                  className="text-slate-600 transition hover:text-[#00629B]"
                >
                  Help Desk
                </a>
              </li>

              <li>
                <a
                  href="#faq"
                  className="text-slate-600 transition hover:text-[#00629B]"
                >
                  FAQ
                </a>
              </li>

              
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Contact
            </h3>

            <div className="mt-4 space-y-4 text-sm">
              <a
                href="https://ieeespsaditya.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-600 transition hover:text-[#00629B]"
              >
                <Globe size={18} />
                ieeespsaditya.vercel.app
              </a>

              <a
                href="mailto:ieeesps@adityauniversity.in"
                className="flex items-center gap-3 text-slate-600 transition hover:text-[#00629B]"
              >
                <Mail size={18} />
                ieeesps@adityauniversity.in
              </a>

              <a
                href="https://www.linkedin.com/company/ieee-sps-student-branch-chapter-aditya-university/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-600 transition hover:text-[#00629B]"
              >
                <Linkedin size={18} />
                IEEE SPS Aditya University
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-slate-500 text-center md:text-left">
              © {new Date().getFullYear()} IEEE SPS Student Branch Chapter,
              Aditya University. All Rights Reserved.
            </p>

            <p className="text-sm text-slate-500 text-center md:text-right">
              Developed by{" "}
              <a
                href="https://www.linkedin.com/in/sanjaykumarchitturi"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#00629B] hover:underline"
              >
                Sanjay Kumar Chitturi
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}