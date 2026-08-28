import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Save, RotateCcw, Settings2, Circle, ShieldCheck, Trophy, LogIn, CalendarClock } from "lucide-react";
import { Assessment } from "../../Assessment/AssessmentCard";

const API = import.meta.env.VITE_API_URL;

interface Props { assessment: Assessment; }
interface Settings {
  general: { title: string; description: string; assessmentCode: string; version: string; createdAt: string; updatedAt: string };
  schedule: { startDate: string; startTime: string; endDate: string; endTime: string; duration: number };
  login: { allowedStudentsOnly: boolean };
  rules: { randomQuestions: boolean; randomOptions: boolean; negativeMarking: boolean; negativeMarks: number; allowReview: boolean; autoSubmit: boolean };
  security: { antiCheatEnabled: boolean; socketMonitoring: boolean };
  results: { allowResultView: boolean; leaderboardEnabled: boolean; allowAnswerReview: boolean; passingPercentage: number };
  certificate: { enabled: boolean; autoGenerate: boolean };
}

const defaults: Settings = {
  general: { title: "", description: "", assessmentCode: "", version: "1.0", createdAt: "", updatedAt: "" },
  schedule: { startDate: "", startTime: "", endDate: "", endTime: "", duration: 30 },
  login: { allowedStudentsOnly: true },
  rules: { randomQuestions: true, randomOptions: true, negativeMarking: false, negativeMarks: 0, allowReview: true, autoSubmit: true },
  security: { antiCheatEnabled: true, socketMonitoring: true },
  results: { allowResultView: true, leaderboardEnabled: true, allowAnswerReview: true, passingPercentage: 40 },
  certificate: { enabled: false, autoGenerate: false },
};

export default function Settings({ assessment }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaults);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/api/assessment-settings/${assessment.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const incoming = data.settings || {};
      setSettings({
        ...defaults,
        ...incoming,
        general: { ...defaults.general, ...(incoming.general || {}) },
        schedule: { ...defaults.schedule, ...(incoming.schedule || {}) },
        login: { ...defaults.login, ...(incoming.login || {}) },
        rules: { ...defaults.rules, ...(incoming.rules || {}) },
        security: { ...defaults.security, ...(incoming.security || {}) },
        results: { ...defaults.results, ...(incoming.results || {}) },
        certificate: { ...defaults.certificate, ...(incoming.certificate || {}) },
      });
    } catch (err) {
      console.error(err);
      toast.error("Unable to load settings.");
    } finally { setLoading(false); }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      await axios.put(`${API}/api/assessment-settings/${assessment.id}`, settings, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Settings saved successfully.");
      await fetchSettings();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Unable to save settings.");
    } finally { setSaving(false); }
  };

  useEffect(() => { void fetchSettings(); }, [assessment.id]);

  const setSchedule = (key: keyof Settings["schedule"], value: string | number) => setSettings((s) => ({ ...s, schedule: { ...s.schedule, [key]: value } }));
  const setRule = (key: keyof Settings["rules"], value: boolean | number) => setSettings((s) => ({ ...s, rules: { ...s.rules, [key]: value } }));
  const setSecurity = (key: keyof Settings["security"], value: boolean) => setSettings((s) => ({ ...s, security: { ...s.security, [key]: value } }));
  const setResult = (key: keyof Settings["results"], value: boolean | number) => setSettings((s) => ({ ...s, results: { ...s.results, [key]: value } }));
  const setCertificate = (key: keyof Settings["certificate"], value: boolean) => setSettings((s) => ({ ...s, certificate: { ...s.certificate, [key]: value } }));

  if (loading) return <div className="py-24 text-center">Loading Settings...</div>;

  return <div className="space-y-8">
    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between"><div><h2 className="flex items-center gap-3 text-3xl font-bold"><Settings2 size={30} className="text-[#00629B]" />Assessment Settings</h2><p className="mt-2 text-gray-500">Only settings that are connected to the assessment backend are shown here.</p></div><div className="flex items-center gap-3"><div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2"><Circle size={10} fill="currentColor" className="text-green-600" /><span className="text-sm font-medium">Configured</span></div><button onClick={() => void fetchSettings()} className="rounded-xl border px-4 py-3 hover:bg-gray-50"><RotateCcw size={18} /></button><button onClick={() => void saveSettings()} disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#00629B] px-6 py-3 text-white disabled:opacity-50"><Save size={18} />{saving ? "Saving..." : "Save Changes"}</button></div></div>

    <Section icon={<Settings2 size={22} />} title="General Settings" description="Basic assessment information."><div className="grid gap-6 md:grid-cols-2"><Field label="Assessment Title"><input className="input" value={settings.general.title} onChange={(e) => setSettings((s) => ({ ...s, general: { ...s.general, title: e.target.value } }))} /></Field><Field label="Assessment ID / Code"><input className="input bg-gray-50 font-mono" value={settings.general.assessmentCode || assessment.id} readOnly /></Field><div className="md:col-span-2"><Field label="Description"><textarea rows={3} className="input resize-none" value={settings.general.description} onChange={(e) => setSettings((s) => ({ ...s, general: { ...s.general, description: e.target.value } }))} /></Field></div><div className="md:col-span-2 grid gap-5 md:grid-cols-3"><Meta label="Version" value={settings.general.version} /><Meta label="Created" value={settings.general.createdAt ? new Date(settings.general.createdAt).toLocaleString() : "-"} /><Meta label="Last Updated" value={settings.general.updatedAt ? new Date(settings.general.updatedAt).toLocaleString() : "-"} /></div></div></Section>

    <Section icon={<CalendarClock size={22} />} title="Schedule & Duration" description="Control when the assessment is available and how long each attempt lasts."><div className="grid gap-6 md:grid-cols-2"><Field label="Start Date"><input type="date" className="input" value={settings.schedule.startDate} onChange={(e) => setSchedule("startDate", e.target.value)} /></Field><Field label="Start Time"><input type="time" className="input" value={settings.schedule.startTime} onChange={(e) => setSchedule("startTime", e.target.value)} /></Field><Field label="End Date"><input type="date" className="input" value={settings.schedule.endDate} onChange={(e) => setSchedule("endDate", e.target.value)} /></Field><Field label="End Time"><input type="time" className="input" value={settings.schedule.endTime} onChange={(e) => setSchedule("endTime", e.target.value)} /></Field><Field label="Duration (minutes)"><input type="number" min={1} className="input" value={settings.schedule.duration} onChange={(e) => setSchedule("duration", Number(e.target.value))} /></Field></div></Section>

    <Section icon={<LogIn size={22} />} title="Login & Access" description="Student login is fixed to registered email + one common backend password."><div className="rounded-xl border bg-gray-50 p-5"><p className="font-semibold">Email + Common Password</p><p className="mt-1 text-sm text-gray-600">Only students listed in this assessment can log in. The common password is verified on the backend and is never stored in Supabase or frontend code.</p></div><Toggle label="Registered Students Only" description="Allow login only when the email exists in this assessment's student list." checked={settings.login.allowedStudentsOnly} onChange={() => setSettings((s) => ({ ...s, login: { ...s.login, allowedStudentsOnly: true } }))} locked /></Section>

    <Section icon={<Settings2 size={22} />} title="Assessment Rules" description="Question order, marking and attempt behaviour."><div className="grid gap-4 md:grid-cols-2"><Toggle label="Randomize Questions" description="Shuffle question order for each attempt." checked={settings.rules.randomQuestions} onChange={(v) => setRule("randomQuestions", v)} /><Toggle label="Randomize Options" description="Shuffle answer options." checked={settings.rules.randomOptions} onChange={(v) => setRule("randomOptions", v)} /><Toggle label="Allow Answer Review" description="Allow students to revisit questions." checked={settings.rules.allowReview} onChange={(v) => setRule("allowReview", v)} /><Toggle label="Auto Submit" description="Submit automatically when the timer expires." checked={settings.rules.autoSubmit} onChange={(v) => setRule("autoSubmit", v)} /><Toggle label="Negative Marking" description="Deduct marks for incorrect answers." checked={settings.rules.negativeMarking} onChange={(v) => setRule("negativeMarking", v)} /><Field label="Negative Marks"><input type="number" min={0} step="0.25" className="input" disabled={!settings.rules.negativeMarking} value={settings.rules.negativeMarks} onChange={(e) => setRule("negativeMarks", Number(e.target.value))} /></Field></div></Section>

    <Section icon={<ShieldCheck size={22} />} title="Security & Live Monitoring" description="These controls map directly to the assessment security fields."><div className="grid gap-4 md:grid-cols-2"><Toggle label="Anti-Cheat" description="Enable anti-cheat controls during the assessment." checked={settings.security.antiCheatEnabled} onChange={(v) => setSecurity("antiCheatEnabled", v)} /><Toggle label="Live Monitoring" description="Enable socket-based live monitoring." checked={settings.security.socketMonitoring} onChange={(v) => setSecurity("socketMonitoring", v)} /></div></Section>

    <Section icon={<Trophy size={22} />} title="Results & Certificate" description="Control result visibility, leaderboard and certificate generation."><div className="grid gap-4 md:grid-cols-2"><Toggle label="Show Results" description="Allow students to view their result." checked={settings.results.allowResultView} onChange={(v) => setResult("allowResultView", v)} /><Toggle label="Leaderboard" description="Enable leaderboard functionality." checked={settings.results.leaderboardEnabled} onChange={(v) => setResult("leaderboardEnabled", v)} /><Toggle label="Allow Answer Review" description="Allow answer review after submission." checked={settings.results.allowAnswerReview} onChange={(v) => setResult("allowAnswerReview", v)} /><Field label="Passing Percentage"><input type="number" min={0} max={100} className="input" value={settings.results.passingPercentage} onChange={(e) => setResult("passingPercentage", Number(e.target.value))} /></Field><Toggle label="Certificate Download" description="Allow certificate downloads for the assessment." checked={settings.certificate.enabled} onChange={(v) => setCertificate("enabled", v)} /><Toggle label="Auto Generate Certificate" description="Automatically generate certificates after completion." checked={settings.certificate.autoGenerate} onChange={(v) => setCertificate("autoGenerate", v)} /></div></Section>
  </div>;
}

function Section({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) { return <section className="rounded-2xl border bg-white p-8"><div className="mb-7"><h2 className="flex items-center gap-3 text-2xl font-bold">{icon}{title}</h2><p className="mt-2 text-gray-500">{description}</p></div>{children}</section>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><label className="mb-2 block font-medium">{label}</label>{children}</div>; }
function Meta({ label, value }: { label: string; value: string }) { return <div><p className="text-sm text-gray-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
function Toggle({ label, description, checked, onChange, locked = false }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void; locked?: boolean }) { return <div className="flex items-center justify-between rounded-xl border p-5"><div><p className="font-medium">{label}</p><p className="text-sm text-gray-500">{description}</p></div><button type="button" disabled={locked} onClick={() => onChange(!checked)} aria-label={label} className={`relative h-6 w-11 shrink-0 rounded-full ${checked ? "bg-[#00629B]" : "bg-gray-300"} ${locked ? "cursor-not-allowed opacity-80" : ""}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow ${checked ? "left-6" : "left-1"}`} /></button></div>; }
