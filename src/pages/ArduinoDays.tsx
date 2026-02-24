import { useState } from "react";
import {
  Home,
  Calendar,
  HelpCircle,
  Info,
  Handshake
} from "lucide-react";

const ArduinoDays = () => {
  const [active, setActive] = useState("home");

  const renderContent = () => {
    switch (active) {
      case "home":
        return (
          <div>
            <h1 className="text-5xl font-bold mb-6">
              ARDUINO DAYS 2K26
            </h1>
            <p className="text-lg text-gray-400 max-w-3xl">
              A 4-Day Technical Event focused on Arduino, IoT, Embedded
              Systems, and Real-Time Project Development.
            </p>
          </div>
        );

      case "events":
        return (
          <div>
            <h2 className="text-4xl font-semibold mb-6">
              Event Schedule
            </h2>
            <ul className="space-y-4 text-gray-300">
              <li>📅 Day 1 – Arduino Basics & Setup</li>
              <li>📅 Day 2 – Sensors & IoT Integration</li>
              <li>📅 Day 3 – Mini Project Building</li>
              <li>📅 Day 4 – Final Project & Showcase</li>
            </ul>
          </div>
        );

      case "help":
        return (
          <div>
            <h2 className="text-4xl font-semibold mb-6">
              Help Desk
            </h2>
            <p className="text-gray-300">
              📞 Contact: +91 XXXXX XXXXX  
              <br />
              📧 Email: ieee@adityauniversity.in
            </p>
          </div>
        );

      case "about":
        return (
          <div>
            <h2 className="text-4xl font-semibold mb-6">
              About Arduino Days
            </h2>
            <p className="text-gray-300 max-w-3xl">
              Arduino Days is a student-focused technical event designed
              to introduce hands-on learning in microcontrollers, IoT,
              and real-world hardware applications.
            </p>
          </div>
        );

      case "sponsors":
        return (
          <div>
            <h2 className="text-4xl font-semibold mb-6">
              Sponsors
            </h2>
            <p className="text-gray-400">
              Sponsorship details coming soon.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-black text-white">

      {/* Sidebar */}
      <div className="w-64 bg-black/90 backdrop-blur-xl border-r border-gray-800 p-6 flex flex-col gap-8">

        <div className="text-2xl font-bold text-cyan-400">
          Arduino Days
        </div>

        <button
          onClick={() => setActive("home")}
          className={`flex items-center gap-3 ${
            active === "home" ? "text-cyan-400" : "text-gray-400"
          }`}
        >
          <Home size={20} /> Home
        </button>

        <button
          onClick={() => setActive("events")}
          className={`flex items-center gap-3 ${
            active === "events" ? "text-cyan-400" : "text-gray-400"
          }`}
        >
          <Calendar size={20} /> Events
        </button>

        <button
          onClick={() => setActive("help")}
          className={`flex items-center gap-3 ${
            active === "help" ? "text-cyan-400" : "text-gray-400"
          }`}
        >
          <HelpCircle size={20} /> Help Desk
        </button>

        <button
          onClick={() => setActive("about")}
          className={`flex items-center gap-3 ${
            active === "about" ? "text-cyan-400" : "text-gray-400"
          }`}
        >
          <Info size={20} /> About
        </button>

        <button
          onClick={() => setActive("sponsors")}
          className={`flex items-center gap-3 ${
            active === "sponsors" ? "text-cyan-400" : "text-gray-400"
          }`}
        >
          <Handshake size={20} /> Sponsors
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-16 bg-gradient-to-br from-black via-gray-900 to-black">
        {renderContent()}
      </div>
    </div>
  );
};

export default ArduinoDays;