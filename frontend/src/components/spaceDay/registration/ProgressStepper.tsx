import { Check } from "lucide-react";
import clsx from "clsx";

import { EventType } from "./types";
import { eventThemes } from "./eventTheme";

interface ProgressStepperProps {
  currentStep: 1 | 2 | 3;
  eventType: EventType;
}

const steps = [
  {
    id: 1,
    title: "Details",
    subtitle: "Participant Information",
  },
  {
    id: 2,
    title: "Summary",
    subtitle: "Review Details",
  },
  {
    id: 3,
    title: "Payment",
    subtitle: "Complete Registration",
  },
];

export default function ProgressStepper({
  currentStep,
  eventType,
}: ProgressStepperProps) {
  const theme = eventThemes[eventType];

  return (
    <div className="w-full max-w-4xl mx-auto px-6 mb-6">
      <div className="grid grid-cols-3">
        {steps.map((step, index) => {
          const completed = step.id < currentStep;
          const active = step.id === currentStep;

          return (
            <div
              key={step.id}
              className="relative flex flex-col items-center"
            >
              {/* Connector Line */}
              {index !== steps.length - 1 && (
                <div
                  className={clsx(
                    "absolute top-5 left-1/2 w-full h-1 rounded-full",
                    completed ? theme.bg : "bg-slate-200"
                  )}
                />
              )}

              {/* Circle */}
              <div
                className={clsx(
                  "relative z-10 w-11 h-11 rounded-full flex items-center justify-center font-bold text-base transition-all duration-300",

                  completed && `${theme.bg} text-white`,

                  active &&
                    `${theme.bg} text-white ring-2 ${theme.light} scale-105 shadow-lg`,

                  !completed &&
                    !active &&
                    "bg-slate-200 text-slate-500"
                )}
              >
                {completed ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.id
                )}
              </div>

              {/* Text */}
              <h4 className="mt-3 text-base font-semibold text-slate-900 text-center">
                {step.title}
              </h4>

              <p className="mt-1 text-xs text-slate-500 text-center">
                {step.subtitle}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}