import Navbar from "../components/spaceDay/Navbar";
import Hero from "../components/spaceDay/Hero";
import MissionBrief from "../components/spaceDay/MissionBrief";
//import Objectives from "../components/spaceDay/Objectives";
//import Highlights from "../components/spaceDay/Highlights";
import Schedule from "../components/spaceDay/Timeline";
//import Events from "../components/spaceDay/Events";
import HelpDesk from "../components/spaceDay/HelpDesk";
import Guidelines from "../components/spaceDay/Guidelines";

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function SpaceDay() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));

      if (element) {
        setTimeout(() => {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    }
  }, [location]);

  return (
    <div className="bg-[#F8FAFC]">
      <Navbar />
      <Hero />
      <MissionBrief />
      {/* <Objectives /> */}
      {/* <Highlights /> */}
      {/* <Events /> */}
      <Guidelines />
      <Schedule />
      <HelpDesk />
      <section id="faq" className="h-screen"></section>
    </div>
  );
}
