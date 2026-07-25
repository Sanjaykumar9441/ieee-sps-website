import {
  BrainCircuit,
  Palette,
  Rocket,
} from "lucide-react";
import { EventType } from "./registration/types";

import { LucideIcon } from "lucide-react";

interface RegistrationEvent {
  id: EventType;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  type: string;
  team: string;
  duration: string;
  color: string;
  description: string;
}

export const registrationEvents: RegistrationEvent[] = [
  {
    id: "astroquiz",
    title: "AstroQuiz",
    subtitle: "The Galactic Intellect",
    icon: BrainCircuit,
    type: "Individual",
    team: "1 Participant",
    duration: "75 Minutes",
    color: "from-blue-500 to-cyan-500",
    description:
      "Challenge your knowledge of ISRO, satellites, Chandrayaan, Gaganyaan, astronomy and space technology through two exciting competitive rounds.",
  },

  {
    id: "astrodesign",
    title: "AI Astro-Design",
    subtitle: "AI Poster Creation",
    icon: Palette,
    type: "Team",
    team: "2–3 Members",
    duration: "30 Minutes",
    color: "from-violet-500 to-fuchsia-500",
    description:
      "Create an innovative AI-powered space poster using modern generative AI tools and present your ideas before the judging panel.",
  },

  {
    id: "astromodeler",
    title: "Astro-Modeler",
    subtitle: "Space Crafting & Prototyping",
    icon: Rocket,
    type: "Team",
    team: "2–3 Members",
    duration: "2–3 Hours",
    color: "from-orange-500 to-red-500",
    description:
      "Design and build a physical spacecraft prototype using simple materials while demonstrating creativity and engineering skills.",
  },
];