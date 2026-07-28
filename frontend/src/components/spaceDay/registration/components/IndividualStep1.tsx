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
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      <div className={`h-2 bg-gradient-to-r ${theme.gradient}`} />

      <div className="p-8 md:p-10">
        <h2 className="text-3xl font-bold text-slate-900">
          Individual Registration
        </h2>

        <div
          className={`mt-3 h-1 w-32 rounded-full bg-gradient-to-r ${theme.gradient}`}
        />

        <p className={`mt-3 font-medium ${theme.text}`}>
          Fill in your details.
        </p>

        <div className="mt-10">
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

        <div className="flex justify-between mt-12">
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
    </div>
  );
}
