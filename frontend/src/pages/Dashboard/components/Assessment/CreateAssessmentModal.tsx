import { FormEvent, useEffect, useState } from "react";
import { X, Plus, Settings2, Calendar, Clock, Shuffle, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import { createAssessment, updateAssessment } from "./assessmentApi";

interface AssessmentRecord {
  id?: string;
  title: string;
  slug?: string;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration_minutes?: number | null;
  total_questions?: number | null;
  marks_per_question?: number | null;
  negative_marks?: number | null;
  pass_percentage?: number | null;
  passing_score?: number | null;
  shuffle_questions?: boolean | null;
  shuffle_options?: boolean | null;
  random_questions?: boolean | null;
  allow_resume?: boolean | null;
  auto_submit?: boolean | null;
  show_leaderboard?: boolean | null;
  anti_cheat_enabled?: boolean | null;
  socket_monitoring?: boolean | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  assessment?: AssessmentRecord | null;
}

interface FormState {
  title: string;
  slug: string;
  description: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_questions: number;
  marks_per_question: number;
  negative_marks: number;
  pass_percentage: number;
  passing_score: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  random_questions: boolean;
  auto_submit: boolean;
  show_leaderboard: boolean;
  anti_cheat_enabled: boolean;
  socket_monitoring: boolean;
}

const initialForm: FormState = {
  title: "",
  slug: "",
  description: "",
  start_time: "",
  end_time: "",
  duration_minutes: 30,
  total_questions: 20,
  marks_per_question: 1,
  negative_marks: 0,
  pass_percentage: 40,
  passing_score: 8,
  shuffle_questions: true,
  shuffle_options: true,
  random_questions: false,
  auto_submit: true,
  show_leaderboard: false,
  anti_cheat_enabled: true,
  socket_monitoring: true,
};

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

export default function CreateAssessmentModal({ open, onClose, onCreated, assessment }: Props) {
  const isEdit = Boolean(assessment?.id);
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setSlugTouched(false);
      setSaving(false);
      return;
    }

    if (assessment) {
      setForm({
        title: assessment.title || "",
        slug: assessment.slug || "",
        description: assessment.description || "",
        start_time: toDateTimeLocal(assessment.start_time),
        end_time: toDateTimeLocal(assessment.end_time),
        duration_minutes: Number(assessment.duration_minutes ?? 30),
        total_questions: Number(assessment.total_questions ?? 20),
        marks_per_question: Number(assessment.marks_per_question ?? 1),
        negative_marks: Number(assessment.negative_marks ?? 0),
        pass_percentage: Number(assessment.pass_percentage ?? 40),
        passing_score: Number(assessment.passing_score ?? 8),
        shuffle_questions: assessment.shuffle_questions ?? true,
        shuffle_options: assessment.shuffle_options ?? true,
        random_questions: assessment.random_questions ?? false,
        auto_submit: assessment.auto_submit ?? true,
        show_leaderboard: assessment.show_leaderboard ?? false,
        anti_cheat_enabled: assessment.anti_cheat_enabled ?? true,
        socket_monitoring: assessment.socket_monitoring ?? true,
      });
      setSlugTouched(true);
    } else {
      setForm(initialForm);
      setSlugTouched(false);
    }
  }, [open, assessment]);

  if (!open) return null;

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTitleChange = (value: string) => {
    updateField("title", value);
    if (!slugTouched) updateField("slug", slugify(value));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) return toast.error("Assessment title is required.");
    if (!form.slug.trim()) return toast.error("Assessment slug is required.");
    if (!form.start_time || !form.end_time) return toast.error("Start and end date/time are required.");
    if (new Date(form.end_time).getTime() <= new Date(form.start_time).getTime()) return toast.error("End time must be after start time.");
    if (form.duration_minutes < 1) return toast.error("Duration must be at least 1 minute.");
    if (form.total_questions < 1) return toast.error("Total questions must be at least 1.");
    if (form.marks_per_question <= 0) return toast.error("Marks per question must be greater than 0.");
    if (form.negative_marks < 0) return toast.error("Negative marks cannot be negative.");
    if (form.pass_percentage < 0 || form.pass_percentage > 100) return toast.error("Pass percentage must be between 0 and 100.");

    const totalMarks = form.total_questions * form.marks_per_question;
    if (form.passing_score < 0 || form.passing_score > totalMarks) return toast.error(`Passing marks must be between 0 and ${totalMarks}.`);

    try {
      setSaving(true);
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        duration_minutes: Number(form.duration_minutes),
        total_questions: Number(form.total_questions),
        marks_per_question: Number(form.marks_per_question),
        negative_marks: Number(form.negative_marks),
        pass_percentage: Number(form.pass_percentage),
        passing_score: Number(form.passing_score),
        shuffle_questions: form.shuffle_questions,
        shuffle_options: form.shuffle_options,
        random_questions: form.random_questions,
        auto_submit: form.auto_submit,
        show_leaderboard: form.show_leaderboard,
        anti_cheat_enabled: form.anti_cheat_enabled,
        socket_monitoring: form.socket_monitoring,
      };

      if (isEdit && assessment?.id) {
        await updateAssessment(assessment.id, payload);
        toast.success("Assessment updated successfully.");
      } else {
        await createAssessment({ ...payload, status: "DRAFT", is_active: false });
        toast.success("Assessment created successfully.");
      }

      onCreated();
      onClose();
    } catch (error: any) {
      console.error(isEdit ? "Update assessment error:" : "Create assessment error:", error);
      toast.error(error?.response?.data?.message || "Unable to save assessment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00629B]/10 text-[#00629B]"><Plus size={22} /></div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{isEdit ? "Edit Assessment" : "Create Assessment"}</h2>
              <p className="mt-1 text-sm text-gray-500">{isEdit ? "Update assessment details and settings." : "Configure your assessment before adding questions."}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X size={21} /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-6">
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex items-center gap-2"><Settings2 size={18} className="text-[#00629B]" /><h3 className="font-semibold">Basic Information</h3></div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Assessment Title" required><input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Space Day Quiz 2026" className="input" required /></Field>
                <Field label="Assessment Code" required><input value={form.slug} onChange={(e) => { setSlugTouched(true); updateField("slug", slugify(e.target.value)); }} placeholder="space-day-quiz-2026" className="input" required /><p className="mt-1 text-xs text-gray-400">This code is also used to access the assessment.</p></Field>
                <div className="md:col-span-2"><Field label="Description"><textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Optional assessment description..." rows={3} className="input resize-none" /></Field></div>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2"><Calendar size={18} className="text-[#00629B]" /><h3 className="font-semibold">Schedule & Duration</h3></div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Starts At" required><input type="datetime-local" value={form.start_time} onChange={(e) => updateField("start_time", e.target.value)} className="input" required /></Field>
                <Field label="Ends At" required><input type="datetime-local" value={form.end_time} onChange={(e) => updateField("end_time", e.target.value)} className="input" required /></Field>
                <Field label="Duration (minutes)" required><div className="relative"><Clock size={17} className="absolute left-3 top-3 text-gray-400" /><input type="number" min={1} value={form.duration_minutes} onChange={(e) => updateField("duration_minutes", Number(e.target.value))} className="input pl-10" required /></div></Field>
                <Field label="Total Questions" required><input type="number" min={1} value={form.total_questions} onChange={(e) => updateField("total_questions", Number(e.target.value))} className="input" required /></Field>
                <Field label="Marks Per Question" required><input type="number" min={0.01} step="0.01" value={form.marks_per_question} onChange={(e) => updateField("marks_per_question", Number(e.target.value))} className="input" required /></Field>
                <Field label="Negative Marks"><input type="number" min={0} step="0.01" value={form.negative_marks} onChange={(e) => updateField("negative_marks", Number(e.target.value))} className="input" /></Field>
                <Field label="Pass Percentage"><input type="number" min={0} max={100} step="0.01" value={form.pass_percentage} onChange={(e) => updateField("pass_percentage", Number(e.target.value))} className="input" /></Field>
                <Field label="Passing Marks"><input type="number" min={0} step="0.01" value={form.passing_score} onChange={(e) => updateField("passing_score", Number(e.target.value))} className="input" /></Field>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2"><Shuffle size={18} className="text-[#00629B]" /><h3 className="font-semibold">Assessment Rules</h3></div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Toggle label="Shuffle Questions" description="Randomize question order." checked={form.shuffle_questions} onChange={(v) => updateField("shuffle_questions", v)} />
                <Toggle label="Shuffle Options" description="Randomize answer option order." checked={form.shuffle_options} onChange={(v) => updateField("shuffle_options", v)} />
                <Toggle label="Random Question Selection" description="Select a random set from the question banks." checked={form.random_questions} onChange={(v) => updateField("random_questions", v)} />
                <Toggle label="Auto Submit" description="Submit automatically when the assessment timer expires." checked={form.auto_submit} onChange={(v) => updateField("auto_submit", v)} />
                <Toggle label="Leaderboard" description="Enable leaderboard functionality." checked={form.show_leaderboard} onChange={(v) => updateField("show_leaderboard", v)} />
                <Toggle label="Anti-Cheat" description="Enable assessment anti-cheat controls." checked={form.anti_cheat_enabled} onChange={(v) => updateField("anti_cheat_enabled", v)} />
                <Toggle label="Live Monitoring" description="Enable live assessment monitoring." checked={form.socket_monitoring} onChange={(v) => updateField("socket_monitoring", v)} />
              </div>
            </section>

            {!isEdit && <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3"><div className="flex items-start gap-3"><Trophy size={18} className="mt-0.5 text-[#00629B]" /><div><p className="text-sm font-semibold text-blue-900">New assessment will be created as Draft</p><p className="mt-1 text-xs leading-5 text-blue-700">Add question banks and registered students, then publish the assessment.</p></div></div></div>}
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t pt-5">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border px-5 py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#00629B] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Plus size={17} />{saving ? "Saving..." : isEdit ? "Save Changes" : "Create Assessment"}</button>
          </div>
        </form>
      </div>
      <style>{`.input{width:100%;border:1px solid #d1d5db;border-radius:.75rem;padding:.7rem .9rem;font-size:.875rem;outline:none;background:white}.input:focus{border-color:#00629B;box-shadow:0 0 0 3px rgba(0,98,155,.1)}`}</style>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div><label className="mb-2 block text-sm font-medium text-gray-700">{label}{required && <span className="ml-1 text-red-500">*</span>}</label>{children}</div>;
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <button type="button" onClick={() => onChange(!checked)} className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 p-4 text-left hover:bg-gray-50"><div><p className="text-sm font-medium text-gray-900">{label}</p><p className="mt-1 text-xs leading-5 text-gray-500">{description}</p></div><div className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full ${checked ? "bg-[#00629B]" : "bg-gray-300"}`}><div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow ${checked ? "left-6" : "left-1"}`} /></div></button>;
}
