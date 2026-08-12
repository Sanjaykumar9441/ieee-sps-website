import { ShieldCheck, UserRound } from "lucide-react";

import ExamTimer from "./ExamTimer";

interface Props {
  assessmentTitle: string;
  studentName: string;
  remainingSeconds: number;
  onExpire: () => void;
}

export default function ExamHeader({
  assessmentTitle,
  studentName,
  remainingSeconds,
  onExpire,
}: Props) {
  return (
    <header className="h-[76px] bg-white border-b border-slate-200 flex items-center justify-between px-5 lg:px-8 shrink-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00629B] text-white flex items-center justify-center">
            <ShieldCheck size={17} />
          </div>

          <p className="font-bold text-slate-900 truncate">{assessmentTitle}</p>
        </div>

        <p className="text-xs text-slate-400 ml-10 mt-0.5">
          Secure Examination Portal
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
          <UserRound size={17} className="text-slate-400" />

          <span className="max-w-[180px] truncate">{studentName}</span>
        </div>
      </div>
      <ExamTimer seconds={remainingSeconds} onExpire={onExpire} />
    </header>
  );
}
