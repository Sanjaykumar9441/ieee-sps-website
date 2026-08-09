import { RotateCcw, RefreshCw } from "lucide-react";

interface Props {
  department: string;

  setDepartment: React.Dispatch<React.SetStateAction<string>>;

  onRefresh: () => void;

  onReset: () => void;
}

export default function AnalyticsFilters({
  department,
  setDepartment,
  onRefresh,
  onReset,
}: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-white p-5 md:flex-row md:items-center md:justify-between">
      {/* Department */}

      <div className="flex-1">
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full rounded-xl border px-4 py-3 transition focus:border-[#00629B] focus:outline-none md:max-w-sm"
        >
          <option value="all">All Departments</option>

          <option value="ECE">ECE</option>
          <option value="CSE">CSE</option>
          <option value="IT">IT</option>
          <option value="EEE">EEE</option>
          <option value="MECH">MECH</option>
          <option value="CIVIL">CIVIL</option>
        </select>
      </div>

      {/* Actions */}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-2 rounded-xl border px-5 py-3 transition hover:bg-gray-50"
        >
          <RefreshCw size={18} />
          Refresh
        </button>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 rounded-xl border px-5 py-3 transition hover:bg-gray-50"
        >
          <RotateCcw size={18} />
          Reset
        </button>
      </div>
    </div>
  );
}