import TeamDetails from "./TeamDetails";
import MemberCard from "./MemberCard";
import Accommodation from "./Accommodation";
import { EventType } from "../types";
import ThemeSelection from "./ThemeSelection";
import { eventThemes } from "../eventTheme";

interface TeamStep1Props {
  eventType: EventType;

  teamSize: 2 | 3;
  setTeamSize: React.Dispatch<React.SetStateAction<2 | 3>>;

  formData: any;

  updateMember: (index: number, field: string, value: string) => void;
  updateField: (field: string, value: any) => void;

  onNext: () => void;
  onBack: () => void;

  errors: Record<string, string>;
}

export default function TeamStep1({
  eventType,
  teamSize,
  setTeamSize,
  formData,
  updateMember,
  updateField,
  onNext,
  onBack,
  errors,
}: TeamStep1Props) {
  const theme = eventThemes[eventType];
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      {/* Gradient Top Border */}
      <div className={`h-2 bg-gradient-to-r ${theme.gradient}`} />

      <div className="p-8 md:p-10">
        <h2 className="text-3xl font-bold text-slate-900">Team Registration</h2>

        <div
          className={`mt-3 h-1 w-28 rounded-full bg-gradient-to-r ${theme.gradient}`}
        />

        <p className={`mt-2 ${theme.text} font-medium`}>
          Fill in your team details.
        </p>

        <div className="mt-10">
          <TeamDetails
            eventType={eventType}
            teamName={formData.teamName}
            teamSize={teamSize}
            onTeamNameChange={(value) => updateField("teamName", value)}
            onTeamSizeChange={setTeamSize}
            errors={errors}
          />
        </div>

        <div className="mt-12 space-y-8">
          {formData.members
            .slice(0, teamSize)
            .map((member: any, index: number) => (
              <MemberCard
                key={index}
                eventType={eventType}
                member={member}
                index={index}
                onChange={updateMember}
                errors={errors}
                isTeam={true}
              />
            ))}
        </div>

        {eventType === "astromodeler" && (
          <ThemeSelection
            eventType={eventType}
            value={formData.selectedTheme}
            onChange={(value) => updateField("selectedTheme", value)}
            error={errors.selectedTheme}
          />
        )}

        <Accommodation
          eventType={eventType}
          accommodation={formData.accommodation}
          members={formData.members.slice(0, teamSize)}
          accommodationMembers={formData.accommodationMembers}
          arrivalDate={formData.arrivalDate}
          arrivalTime={formData.arrivalTime}
          departureDate={formData.departureDate}
          departureTime={formData.departureTime}
          onChange={updateField}
          errors={errors}
        />

        {/* Duplicate Validation Errors */}
        {(errors.duplicateRoll ||
          errors.duplicateEmail ||
          errors.duplicatePhone) && (
          <div className="mt-8 space-y-2">
            {errors.duplicateRoll && (
              <p className="text-red-600 text-sm font-medium">
                {errors.duplicateRoll}
              </p>
            )}

            {errors.duplicateEmail && (
              <p className="text-red-600 text-sm font-medium">
                {errors.duplicateEmail}
              </p>
            )}

            {errors.duplicatePhone && (
              <p className="text-red-600 text-sm font-medium">
                {errors.duplicatePhone}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-between mt-8">
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
