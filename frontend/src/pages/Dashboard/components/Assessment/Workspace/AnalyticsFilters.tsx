import { RotateCcw, RefreshCw } from "lucide-react";

interface Props {
  department: string;

  setDepartment: React.Dispatch<React.SetStateAction<string>>;

  section: string;

  setSection: React.Dispatch<React.SetStateAction<string>>;

  onRefresh: () => void;

  onReset: () => void;
}

export default function AnalyticsFilters({
  department,
  setDepartment,
  section,
  setSection,
  onRefresh,
  onReset,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left */}

        <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
          {/* Department */}

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-xl border px-4 py-3 transition focus:border-[#00629B] focus:outline-none"
          >
            <option value="all">All Departments</option>

            <option value="ECE">ECE</option>

            <option value="CSE">CSE</option>

            <option value="IT">IT</option>

            <option value="EEE">EEE</option>

            <option value="MECH">MECH</option>

            <option value="CIVIL">CIVIL</option>
          </select>

          {/* Section */}

          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="rounded-xl border px-4 py-3 transition focus:border-[#00629B] focus:outline-none"
          >
            <option value="all">All Sections</option>

            <option value="A">A</option>

            <option value="B">B</option>

            <option value="C">C</option>

            <option value="D">D</option>
          </select>
        </div>

        {/* Right */}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 rounded-xl border px-5 py-3 transition hover:bg-gray-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-2 rounded-xl border px-5 py-3 transition hover:bg-gray-50"
          >
            <RotateCcw size={18} />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
