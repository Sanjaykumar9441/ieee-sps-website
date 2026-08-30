import { useState } from "react";
import { RadioTower } from "lucide-react";
import toast from "react-hot-toast";
import type { Assessment } from "../AssessmentCard";
import { updateAssessmentSettings } from "../assessmentApi";

export default function LiveUpdatesToggle({ assessment, value, onChange }: { assessment: Assessment; value: boolean; onChange: (value: boolean) => void }) {
  const [saving, setSaving] = useState(false);
  const toggle = async () => {
    const next = !value;
    try {
      setSaving(true);
      await updateAssessmentSettings(assessment.id, { live: { enabled: next } });
      localStorage.setItem(`assessment_live_updates:${assessment.id}`, String(next));
      onChange(next);
      window.dispatchEvent(new CustomEvent("assessment-live-updates-changed", { detail: { assessmentId: assessment.id, enabled: next } }));
      toast.success(`Live updates ${next ? "enabled" : "disabled"}.`);
    } catch (error: any) {
      console.error("Live updates toggle error:", error);
      toast.error(error?.response?.data?.message || "Unable to update live settings.");
    } finally { setSaving(false); }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${value ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}><RadioTower size={19}/></div><div><p className="text-sm font-semibold text-slate-900">Live Updates</p><p className="text-xs text-slate-500">Real-time dashboard refresh</p></div></div>
      <button type="button" onClick={() => void toggle()} disabled={saving} aria-pressed={value} aria-label={`Live updates ${value ? "on" : "off"}`} className={`relative h-7 w-14 rounded-full transition ${value ? "bg-emerald-500" : "bg-slate-300"} disabled:opacity-60`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${value ? "left-8" : "left-1"}`} />{saving && <span className="absolute inset-0 flex items-center justify-center text-[9px] text-slate-600">•••</span>}</button>
    </div>
  );
}
