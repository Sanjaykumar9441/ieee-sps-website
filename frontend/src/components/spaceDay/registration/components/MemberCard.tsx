import {
  departments,
  years,
  colleges,
  genders,
  states,
} from "../data/formOptions";
import { EventType } from "../types";
import { eventThemes } from "../eventTheme";

interface Member {
  fullName: string;
  gender?: string;
  rollNumber: string;
  email: string;
  phone: string;
  department: string;
  year: string;
  college: string;
  otherCollege?: string;
  otherCollegeCity?: string;
  otherCollegeDistrict?: string;
  otherCollegeState?: string;
  otherCollegePincode?: string;
}

interface MemberCardProps {
  eventType: EventType;

  member: Member;
  index: number;
  onChange: (index: number, field: string, value: string) => void;
  errors: Record<string, string>;
  isTeam?: boolean;
}

export default function MemberCard({
  eventType,
  member,
  index,
  onChange,
  errors,
  isTeam = true,
}: MemberCardProps) {
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

  return (
    <div className={`rounded-2xl border ${theme.border} ${theme.light} p-6`}>
      <h3 className="text-xl font-bold mb-6">
        {isTeam ? (
          <>
            Member {index + 1}
            {index === 0 && (
              <span className={`ml-2 text-sm font-medium ${theme.text}`}>
                (Team Leader)
              </span>
            )}
          </>
        ) : (
          "Participant Details"
        )}
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Full Name */}

        <div>
          <label className="block font-medium mb-2">
            Full Name with Initial *
          </label>

          <input
            type="text"
            value={member.fullName}
            onChange={(e) => onChange(index, "fullName", e.target.value.replace(/[^A-Za-z\s]/g, "").toUpperCase())}
            className={
              errors[`fullName${index}`] ? errorInputClass : inputClass
            }
          />

          {errors[`fullName${index}`] && (
            <p className="mt-1 text-sm text-red-500">
              {errors[`fullName${index}`]}
            </p>
          )}
        </div>

        <div>
          <label className="block font-medium mb-2">Gender *</label>

          <select
            value={member.gender || ""}
            onChange={(e) => onChange(index, "gender", e.target.value)}
            className={
              errors[`fullName${index}`] ? errorInputClass : inputClass
            }
          >
            <option value="">Select Gender</option>

            {genders.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>

          {errors[`gender${index}`] && (
            <p className="mt-1 text-sm text-red-500">
              {errors[`gender${index}`]}
            </p>
          )}
        </div>

        {/* Roll Number */}

        <div>
          <label className="block font-medium mb-2">Roll Number *</label>

          <input
            type="text"
            value={member.rollNumber}
            onChange={(e) => onChange(index, "rollNumber", e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())}
            className={
              errors[`fullName${index}`] ? errorInputClass : inputClass
            }
          />

          {errors[`rollNumber${index}`] && (
            <p className="mt-1 text-sm text-red-500">
              {errors[`rollNumber${index}`]}
            </p>
          )}
        </div>
        {/* Email */}

        <div>
          <label className="block font-medium mb-2">Email *</label>

          <input
            type="email"
            value={member.email}
            onChange={(e) => onChange(index, "email", e.target.value)}
            className={
              errors[`fullName${index}`] ? errorInputClass : inputClass
            }
          />

          {errors[`email${index}`] && (
            <p className="mt-1 text-sm text-red-500">
              {errors[`email${index}`]}
            </p>
          )}
        </div>

        {/* Phone */}

        <div>
          <label className="block font-medium mb-2">WhatsApp Number *</label>

          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            value={member.phone}
            onChange={(e) => onChange(index, "phone", e.target.value.replace(/\D/g, ""))}
            className={
              errors[`fullName${index}`] ? errorInputClass : inputClass
            }
          />

          {errors[`phone${index}`] && (
            <p className="mt-1 text-sm text-red-500">
              {errors[`phone${index}`]}
            </p>
          )}
        </div>

        {/* Department */}

        <div>
          <label className="block font-medium mb-2">Department *</label>

          <select
            value={member.department}
            onChange={(e) => onChange(index, "department", e.target.value)}
            className={
              errors[`fullName${index}`] ? errorInputClass : inputClass
            }
          >
            <option value="">Select Department</option>

            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>

          {errors[`department${index}`] && (
            <p className="mt-1 text-sm text-red-500">
              {errors[`department${index}`]}
            </p>
          )}
        </div>

        {/* Year */}

        <div>
          <label className="block font-medium mb-2">Year *</label>

          <select
            value={member.year}
            onChange={(e) => onChange(index, "year", e.target.value)}
            className={
              errors[`fullName${index}`] ? errorInputClass : inputClass
            }
          >
            <option value="">Select Year</option>

            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {errors[`year${index}`] && (
            <p className="mt-1 text-sm text-red-500">
              {errors[`year${index}`]}
            </p>
          )}
        </div>

        {/* College */}

        <div>
          <label className="block font-medium mb-2">College *</label>

          <select
            value={member.college}
            onChange={(e) => onChange(index, "college", e.target.value)}
            className={
              errors[`fullName${index}`] ? errorInputClass : inputClass
            }
          >
            <option value="">Select College</option>

            {colleges.map((college) => (
              <option key={college} value={college}>
                {college}
              </option>
            ))}
          </select>

          {errors[`college${index}`] && (
            <p className="mt-1 text-sm text-red-500">
              {errors[`college${index}`]}
            </p>
          )}
        </div>
        {/* Other College Details */}

        {member.college === "Other" && (
          <div
            className={`md:col-span-2 rounded-2xl border ${theme.border} bg-white p-6`}
          >
            <h4 className="text-lg font-semibold mb-6">
              Other College Details
            </h4>

            <div className="grid md:grid-cols-2 gap-6">
              {/* College Name */}

              <div>
                <label className="block font-medium mb-2">College Name *</label>

                <input
                  type="text"
                  value={member.otherCollege || ""}
                  onChange={(e) =>
                    onChange(index, "otherCollege", e.target.value.replace(/[^A-Za-z\s]/g, "").toUpperCase())
                  }
                  placeholder="Enter College Name"
                  className={
                    errors[`otherCollege${index}`]
                      ? errorInputClass
                      : inputClass
                  }
                />

                {errors[`otherCollege${index}`] && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors[`otherCollege${index}`]}
                  </p>
                )}
              </div>

              {/* City */}

              <div>
                <label className="block font-medium mb-2">City / Town *</label>

                <input
                  type="text"
                  value={member.otherCollegeCity || ""}
                  onChange={(e) =>
                    onChange(index, "otherCollegeCity", e.target.value.replace(/[^A-Za-z\s]/g, "").toUpperCase())
                  }
                  placeholder="Enter City / Town"
                  className={
                    errors[`otherCollegeCity${index}`]
                      ? errorInputClass
                      : inputClass
                  }
                />

                {errors[`otherCollegeCity${index}`] && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors[`otherCollegeCity${index}`]}
                  </p>
                )}
              </div>

              {/* District */}

              <div>
                <label className="block font-medium mb-2">District *</label>

                <input
                  type="text"
                  value={member.otherCollegeDistrict || ""}
                  onChange={(e) =>
                    onChange(index, "otherCollegeDistrict", e.target.value.replace(/[^A-Za-z\s]/g, "").toUpperCase())
                  }
                  placeholder="Enter District"
                  className={
                    errors[`otherCollegeDistrict${index}`]
                      ? errorInputClass
                      : inputClass
                  }
                />

                {errors[`otherCollegeDistrict${index}`] && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors[`otherCollegeDistrict${index}`]}
                  </p>
                )}
              </div>

              {/* State */}

              <div>
                <label className="block font-medium mb-2">State *</label>

                <select
                  value={member.otherCollegeState || ""}
                  onChange={(e) =>
                    onChange(index, "otherCollegeState", e.target.value)
                  }
                  className={
                    errors[`otherCollegeState${index}`]
                      ? errorInputClass
                      : inputClass
                  }
                >
                  <option value="">Select State</option>

                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>

                {errors[`otherCollegeState${index}`] && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors[`otherCollegeState${index}`]}
                  </p>
                )}
              </div>

              {/* PIN Code */}

              <div>
                <label className="block font-medium mb-2">PIN Code *</label>

                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={member.otherCollegePincode || ""}
                  onChange={(e) =>
                    onChange(index, "otherCollegePincode", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Enter PIN Code"
                  className={
                    errors[`otherCollegePincode${index}`]
                      ? errorInputClass
                      : inputClass
                  }
                />

                {errors[`otherCollegePincode${index}`] && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors[`otherCollegePincode${index}`]}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
