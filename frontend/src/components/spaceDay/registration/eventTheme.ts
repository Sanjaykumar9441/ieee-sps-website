import { EventType } from "./types";

interface EventTheme {
  gradient: string;
  accent: string;
  bg: string;
  light: string;
  border: string;
  text: string;
  hover: string;
  ring: string;
  hoverBorder: string;
}

export const eventThemes: Record<
  EventType,
  EventTheme
> = {
  astroquiz: {
    gradient: "from-blue-600 to-cyan-500",
    accent: "blue",

    bg: "bg-blue-600",
    light: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-600",
    hover: "hover:bg-blue-700",
    ring: "focus:ring-blue-500",
    hoverBorder: "hover:border-blue-300",
  },

  astrodesign: {
    gradient: "from-purple-600 to-pink-500",
    accent: "purple",

    bg: "bg-purple-600",
    light: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-600",
    hover: "hover:bg-purple-700",
    ring: "focus:ring-purple-500",
    hoverBorder: "hover:border-purple-300",
  },

  astromodeler: {
    gradient: "from-orange-500 to-red-500",
    accent: "orange",

    bg: "bg-orange-500",
    light: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-600",
    hover: "hover:bg-orange-600",
    ring: "focus:ring-orange-500",
    hoverBorder: "hover:border-orange-300",
  },
};
