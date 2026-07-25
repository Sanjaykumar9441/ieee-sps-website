import { EventType } from "../types";
import { eventThemes } from "../eventTheme";

interface TeamDetailsProps {
  eventType: EventType;

  teamName: string;
  teamSize: 2 | 3;

  onTeamNameChange: (value: string) => void;
  onTeamSizeChange: (value: 2 | 3) => void;

  errors: Record<string, string>;
}

export default function TeamDetails({
  eventType,
  teamName,
  teamSize,
  onTeamNameChange,
  onTeamSizeChange,
  errors,
}: TeamDetailsProps) {
  const theme = eventThemes[eventType];
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <label className="block font-semibold mb-2">
          Team Name <span className="text-red-500">*</span>
        </label>

        <input
          type="text"
          value={teamName}
          onChange={(e) => onTeamNameChange(e.target.value)}
          placeholder="Enter Team Name"
          className={`
  w-full
  rounded-xl
  border
  px-4
  py-3
  outline-none
  transition
  ${
    errors.teamName
      ? "border-red-500 focus:ring-2 focus:ring-red-500"
      : `${theme.border} focus:ring-2 ${theme.ring}`
  }
`}
        />

        {errors.teamName && (
          <p className="mt-1 text-sm text-red-600">{errors.teamName}</p>
        )}
      </div>

      <div>
        <label className="block font-semibold mb-2">
          Team Size <span className="text-red-500">*</span>
        </label>

        <select
          value={teamSize}
          onChange={(e) => onTeamSizeChange(Number(e.target.value) as 2 | 3)}
          className={`
  w-full
  rounded-xl
  border
  px-4
  py-3
  outline-none
  transition
  ${theme.border}
  focus:ring-2
  ${theme.ring}
`}
        >
          <option value={2}>2 Members</option>
          <option value={3}>3 Members</option>
        </select>
      </div>
    </div>
  );
}
