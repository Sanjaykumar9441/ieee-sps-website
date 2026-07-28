import MemberCard from "./MemberCard";
import Accommodation from "./Accommodation";
import { EventType } from "../types";
import { eventThemes } from "../eventTheme";

interface IndividualStep1Props {
  eventType: EventType;

  formData: any;
  errors: Record<string, string>;

  updateField: (field: string, value: any) => void;

  onNext: () => void;
  onBack: () => void;
}

export default function IndividualStep1({
  eventType,
  formData,
  errors,
  updateField,
  onNext,
  onBack,
}: IndividualStep1Props) {
  const theme = eventThemes[eventType];
  return (
   <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg h-[78vh] flex flex-col">
      <div className={`h-2 bg-gradient-to-r ${theme.gradient}`} />

     <div className="flex flex-col h-full">
        <div className="px-8 pt-6 pb-4 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">
            Individual Registration
          </h2>

          <div
            className={`mt-2 h-1 w-24 rounded-full bg-gradient-to-r ${theme.gradient}`}
          />

          <p className={`mt-2 text-sm ${theme.text}`}>Fill in your details.</p>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <MemberCard
            eventType={eventType}
            member={formData}
            index={0}
            errors={errors}
            isTeam={false}
            onChange={(_, field, value) => updateField(field, value)}
          />
        </div>

        <Accommodation
          eventType={eventType}
          accommodation={formData.accommodation}
          arrivalDate={formData.arrivalDate}
          arrivalTime={formData.arrivalTime}
          departureDate={formData.departureDate}
          departureTime={formData.departureTime}
          onChange={updateField}
          errors={errors}
        />
      </div>
      <div className="border-t border-slate-200 px-8 py-5 flex justify-between bg-white">
        <button
          onClick={onBack}
          className={`
  rounded-xl
  border
  ${theme.border}
  ${theme.text}
  ${theme.light}
  px-6
  py-3
  font-medium
  transition
  hover:shadow-md
`}
        >
          ← Back
        </button>

        <button
          onClick={onNext}
          className={`
  rounded-xl
  bg-gradient-to-r
  ${theme.gradient}
  px-8
  py-3
  font-semibold
  text-white
  shadow-lg
  transition-all
  duration-300
  hover:scale-105
`}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
