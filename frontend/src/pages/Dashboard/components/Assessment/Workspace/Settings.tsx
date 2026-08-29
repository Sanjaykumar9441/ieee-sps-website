import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Save,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Trophy,
  LogIn,
  CalendarClock,
} from "lucide-react";
import { Assessment } from "../../Assessment/AssessmentCard";

const API = import.meta.env.VITE_API_URL;

interface Props { assessment: Assessment; }

interface Settings {
  schedule: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    duration: number;
  };
  rules: { randomQuestions: boolean; randomOptions: boolean };
  results: { passingPercentage: number };
}

const defaults: Settings = {
  schedule: { startDate: "", startTime: "", endDate: "", endTime: "", duration: 30 },
  rules: { randomQuestions: true, randomOptions: true },
  results: { passingPercentage: 40 },
};

export default function Settings({ assessment }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaults);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/api/assessment-settings/${assessment.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const incoming = data.settings || {};
      setSettings({
        ...defaults,
        schedule: { ...defaults.schedule, ...(incoming.schedule || {}) },
        rules: { ...defaults.rules, ...(incoming.rules || {}) },
        results: {
          ...defaults.results,
          ...(incoming.results || {}),
          passingPercentage: Number(incoming.results?.passingPercentage ?? defaults.results.passingPercentage),
        },
      });
    } catch (err) {
      console.error(err);
      toast.error("Unable to load settings.");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      await axios.put(`${API}/api/assessment-settings/${assessment.id}`, settings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Settings saved successfully.");
      await fetchSettings();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { void fetchSettings(); }, [assessment.id]);

  const setSchedule = (key: keyof Settings["schedule"], value: string | number) =>
    setSettings((s) => ({ ...s, schedule: { ...s.schedule, [key]: value } }));

  if (loading) return <div className="py-24 text-center">Loading Settings...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-3xl font-bold">
            <Settings2 size={30} className="text-[#00629B]" /> Assessment Settings
          </h2>
          <p className="mt-2 text-gray-500">Only settings used by this assessment are shown.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => void fetchSettings()} className="rounded-xl border px-4 py-3 hover:bg-gray-50" title="Reload settings">
            <RotateCcw size={18} />
          </button>
          <button onClick={() => void saveSettings()} disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#00629B] px-6 py-3 text-white disabled:opacity-50">
            <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <Section icon={<CalendarClock size={22} />} title="Schedule & Duration" description="Control when the assessment is available and how long each attempt lasts.">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Start Date"><input type="date" className="input" value={settings.schedule.startDate} onChange={(e) => setSchedule("startDate", e.target.value)} /></Field>
          <Field label="Start Time"><input type="time" className="input" value={settings.schedule.startTime} onChange={(e) => setSchedule("startTime", e.target.value)} /></Field>
          <Field label="End Date"><input type="date" className="input" value={settings.schedule.endDate} onChange={(e) => setSchedule("endDate", e.target.value)} /></Field>
          <Field label="End Time"><input type="time" className="input" value={settings.schedule.endTime} onChange={(e) => setSchedule("endTime", e.target.value)} /></Field>
          <Field label="Duration (minutes)"><input type="number" min={1} className="input" value={settings.schedule.duration} onChange={(e) => setSchedule("duration", Number(e.target.value))} /></Field>
        </div>
      </Section>

      <Section icon={<LogIn size={22} />} title="Login & Access" description="Student authentication is fixed and is not configurable per assessment.">
        <div className="rounded-xl border bg-gray-50 p-5">
          <p className="font-semibold">Registered Email + Common Password</p>
          <p className="mt-1 text-sm text-gray-600">Only students registered in this assessment can log in. The common password is verified on the backend and is never stored in Supabase or frontend code.</p>
        </div>
      </Section>

      <Section icon={<Settings2 size={22} />} title="Assessment Rules" description="These options are connected directly to question-paper generation.">
        <div className="grid gap-4 md:grid-cols-2">
          <Toggle label="Randomize Questions" description="Shuffle question order for each attempt." checked={settings.rules.randomQuestions} onChange={(v) => setSettings((s) => ({ ...s, rules: { ...s.rules, randomQuestions: v } }))} />
          <Toggle label="Randomize Options" description="Shuffle answer options for each attempt." checked={settings.rules.randomOptions} onChange={(v) => setSettings((s) => ({ ...s, rules: { ...s.rules, randomOptions: v } }))} />
        </div>
        <div className="mt-4 rounded-xl border bg-gray-50 p-5">
          <p className="font-semibold">Auto-submit is always enabled</p>
          <p className="mt-1 text-sm text-gray-600">The assessment is automatically submitted when the timer expires. Leaving the examination window also triggers security submission according to the exam policy.</p>
        </div>
      </Section>

      <Section icon={<ShieldCheck size={22} />} title="Security" description="Security behaviour is fixed for this assessment and does not need a per-assessment toggle.">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoBox title="Fullscreen required" text="Students are expected to remain in fullscreen while taking the assessment." />
          <InfoBox title="Security auto-submit" text="A tab/window exit submits the attempt according to the exam security policy." />
        </div>
      </Section>

      <Section icon={<Trophy size={22} />} title="Results" description="Set the percentage required to pass the assessment.">
        <div className="max-w-md">
          <Field label="Passing Percentage"><input type="number" min={0} max={100} className="input" value={settings.results.passingPercentage} onChange={(e) => setSettings((s) => ({ ...s, results: { ...s.results, passingPercentage: Number(e.target.value) } }))} /></Field>
        </div>
      </Section>
    </div>
  );
}

function Section({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border bg-white p-8"><div className="mb-7"><h2 className="flex items-center gap-3 text-2xl font-bold">{icon}{title}</h2><p className="mt-2 text-gray-500">{description}</p></div>{children}</section>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-2 block font-medium">{label}</label>{children}</div>;
}
function InfoBox({ title, text }: { title: string; text: string }) {
  return <div className="rounded-xl border bg-gray-50 p-5"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-gray-600">{text}</p></div>;
}
function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between rounded-xl border p-5"><div><p className="font-medium">{label}</p><p className="text-sm text-gray-500">{description}</p></div><button type="button" onClick={() => onChange(!checked)} aria-label={label} className={`relative h-6 w-11 shrink-0 rounded-full ${checked ? "bg-[#00629B]" : "bg-gray-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow ${checked ? "left-6" : "left-1"}`} /></button></div>;
}
