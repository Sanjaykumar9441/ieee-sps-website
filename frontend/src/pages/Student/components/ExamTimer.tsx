import { useEffect } from "react";
import { Clock3 } from "lucide-react";

interface Props {
  seconds: number;
  onExpire: () => void;
}

export default function ExamTimer({ seconds, onExpire }: Props) {
  useEffect(() => {
    if (seconds <= 0) {
      onExpire();
    }
  }, [seconds, onExpire]);

  const hours = Math.floor(seconds / 3600);

  const minutes = Math.floor((seconds % 3600) / 60);

  const secs = seconds % 60;

  const formatted =
    hours > 0
      ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0",
        )}:${String(secs).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const danger = seconds <= 60;

  const warning = seconds <= 300;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${
        danger
          ? "bg-red-50 border-red-200 text-red-700"
          : warning
            ? "bg-amber-50 border-amber-200 text-amber-700"
            : "bg-slate-50 border-slate-200 text-slate-800"
      }`}
    >
      <Clock3 size={19} />

      <div>
        <p className="text-[10px] uppercase font-semibold tracking-wider opacity-60">
          Time Remaining
        </p>

        <p className="font-mono font-bold text-lg leading-none mt-0.5">
          {formatted}
        </p>
      </div>
    </div>
  );
}
