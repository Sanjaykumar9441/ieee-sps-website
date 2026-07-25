import { EventType } from "./types";

interface RegistrationConfig {
  title: string;

  type: "individual" | "team";

  eventFee: number;

  feeType: "student" | "team";

  accommodationFee: number;

  minTeamSize: number;

  maxTeamSize: number;
}

export const registrationConfig: Record<
  EventType,
  RegistrationConfig
> = {
  astroquiz: {
    title: "AstroQuiz",
    type: "individual",

    eventFee: 50,
    feeType: "student", // AstroQuiz is individual

    accommodationFee: 150,

    minTeamSize: 1,
    maxTeamSize: 1,
  },

  astrodesign: {
    title: "AI Astro-Design",
    type: "team",

    eventFee: 50,
    feeType: "student", // Change to "student" later if required

    accommodationFee: 150,

    minTeamSize: 2,
    maxTeamSize: 3,
  },

  astromodeler: {
    title: "Astro-Modeler",
    type: "team",

    eventFee: 50,
    feeType: "student", // Change later if required

    accommodationFee: 150,

    minTeamSize: 2,
    maxTeamSize: 3,
  },
};