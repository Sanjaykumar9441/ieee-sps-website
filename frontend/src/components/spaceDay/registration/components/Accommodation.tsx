import DatePicker from "react-datepicker";
import { EventType } from "../types";
import { eventThemes } from "../eventTheme";

interface AccommodationProps {
  eventType: EventType;

  accommodation: boolean;

  members?: any[];

  accommodationMembers?: boolean[];

  arrivalDate: string;
  arrivalTime: string;

  departureDate: string;
  departureTime: string;

  onChange: (field: string, value: any) => void;

  errors?: Record<string, string>;
}

export default function Accommodation({
  eventType,

  accommodation,
  members = [],
  accommodationMembers = [],

  arrivalDate,
  arrivalTime,

  departureDate,
  departureTime,

  onChange,
  errors,
}: AccommodationProps) {
  const theme = eventThemes[eventType];

  const inputClass = `
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
  `;

  const errorInputClass = `
    w-full
    rounded-xl
    border
    border-red-500
    px-4
    py-3
    outline-none
    focus:ring-2
    focus:ring-red-500
  `;
  const hasAccommodationMember =
    members.length === 0 ? true : accommodationMembers.some(Boolean);
  return (
    <div className={`mt-12 border-t ${theme.border} pt-10`}>
      <h3 className="text-2xl font-bold text-slate-900">
        Hostel Accommodation
      </h3>

      <p className={`mt-2 font-medium ${theme.text}`}>
        ₹150 per student/day (Includes Breakfast, Lunch & Dinner)
      </p>

      <div className="flex gap-8 mt-8">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            className={theme.text}
            checked={accommodation}
            onChange={() => onChange("accommodation", true)}
          />
          Yes
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            className={theme.text}
            checked={!accommodation}
            onChange={() => onChange("accommodation", false)}
          />
          No
        </label>
      </div>

      {accommodation && (
        <div className="mt-8">
          {/* Team Registration Only */}

          {members.length > 0 && (
            <div className="mb-8">
              <label className="block font-semibold text-slate-900 mb-4">
                Select members requiring accommodation
              </label>

              <div className="space-y-3">
                {members.map((member, index) => (
                  <label
                    key={index}
                    className={`
  flex
  cursor-pointer
  items-center
  gap-3
  rounded-xl
  border
  p-4
  transition
  hover:shadow-md
  ${theme.border}
  ${theme.light}
`}
                  >
                    <input
                      type="checkbox"
                      checked={accommodationMembers[index] || false}
                      onChange={(e) => {
                        const updated = [...accommodationMembers];
                        updated[index] = e.target.checked;
                        onChange("accommodationMembers", updated);
                      }}
                    />

                    <span className="font-medium">
                      {member.fullName?.trim()
                        ? member.fullName
                        : `Member ${index + 1}`}

                      {index === 0 && (
                        <span className={`font-medium ${theme.text}`}> </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
              {errors?.accommodationMembers && (
                <p className="text-red-600 text-sm mt-2">
                  {errors.accommodationMembers}
                </p>
              )}
            </div>
          )}

          {/* Arrival / Departure */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium mb-2">Arrival Date</label>

              <input
                type="date"
                value={arrivalDate}
                min="2026-08-22"
                max="2026-08-23"
                onChange={(e) => onChange("arrivalDate", e.target.value)}
                className={errors?.arrivalDate ? errorInputClass : inputClass}
                disabled={!hasAccommodationMember}
              />
              {errors?.arrivalDate && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.arrivalDate}
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-2">Arrival Time</label>

              <DatePicker
                selected={
                  arrivalTime ? new Date(`2000-01-01T${arrivalTime}`) : null
                }
                onChange={(date: Date | null | undefined) => {
                  if (!date) {
                    onChange("arrivalTime", "");
                    return;
                  }

                  const time =
                    date.getHours().toString().padStart(2, "0") +
                    ":" +
                    date.getMinutes().toString().padStart(2, "0");

                  onChange("arrivalTime", time);
                }}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="h:mm aa"
                placeholderText="Select Arrival Time"
                isClearable
                autoComplete="off"
                className={errors?.arrivalTime ? errorInputClass : inputClass}
                disabled={!hasAccommodationMember}
              />
              {errors?.arrivalTime && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.arrivalTime}
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-2">Departure Date</label>

              <input
                type="date"
                value={departureDate}
                min="2026-08-23"
                max="2026-08-24"
                onChange={(e) => onChange("departureDate", e.target.value)}
                className={errors?.departureDate ? errorInputClass : inputClass}
                disabled={!hasAccommodationMember}
              />
              {errors?.departureDate && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.departureDate}
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-2">Departure Time</label>

              <DatePicker
                selected={
                  departureTime ? new Date(`2000-01-01T${departureTime}`) : null
                }
                onChange={(date: Date | null | undefined) => {
                  if (!date) {
                    onChange("departureTime", "");
                    return;
                  }

                  const time =
                    date.getHours().toString().padStart(2, "0") +
                    ":" +
                    date.getMinutes().toString().padStart(2, "0");

                  onChange("departureTime", time);
                }}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="h:mm aa"
                placeholderText="Select Departure Time"
                isClearable
                autoComplete="off"
                className={errors?.departureTime ? errorInputClass : inputClass}
                disabled={!hasAccommodationMember}
              />
              {errors?.departureTime && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.departureTime}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
