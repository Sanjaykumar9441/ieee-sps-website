import { FormEvent, useEffect, useState } from "react";
import {
  X,
  Plus,
  Settings2,
  Calendar,
  Clock,
  Shuffle,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createAssessment,
  getAssessmentCategories,
  getAssessmentSubjects,
} from "./assessmentApi";

interface CreateAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface AssessmentCategory {
  id: string;
  name: string;
}

interface FormState {
  title: string;
  slug: string;
  description: string;
  instructions: string;

  banner_image: string;

  category_id: string;
  subject_id: string;

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

  allow_resume: boolean;
  auto_submit: boolean;

  show_leaderboard: boolean;

  anti_cheat_enabled: boolean;
  socket_monitoring: boolean;
}

const initialForm: FormState = {
  title: "",
  slug: "",

  description: "",
  instructions: "",

  banner_image: "",

  category_id: "",
  subject_id: "",

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

  allow_resume: true,

  auto_submit: true,

  show_leaderboard: false,

  anti_cheat_enabled: true,

  socket_monitoring: true,
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function CreateAssessmentModal({
  open,
  onClose,
  onCreated,
}: CreateAssessmentModalProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  interface AssessmentSubject {
    id: string;
    name: string;
    category_id: string;
  }

  const [subjects, setSubjects] = useState<AssessmentSubject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setSlugTouched(false);
      setSaving(false);
      setSubjects([]);
      return;
    }

    const loadData = async () => {
      try {
        setCategoriesLoading(true);

        const categoriesData = await getAssessmentCategories();

        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Failed to load assessment categories:", error);

        toast.error("Unable to load categories.");

        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }

      try {
        setSubjectsLoading(true);

        const subjectsData = await getAssessmentSubjects();

        setSubjects(subjectsData || []);
      } catch (error) {
        console.error("Failed to load assessment subjects:", error);

        toast.error("Unable to load subjects.");

        setSubjects([]);
      } finally {
        setSubjectsLoading(false);
      }
    };

    loadData();
  }, [open]);

  if (!open) return null;

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTitleChange = (value: string) => {
    updateField("title", value);

    if (!slugTouched) {
      updateField("slug", slugify(value));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Assessment title is required.");
      return;
    }

    if (!form.slug.trim()) {
      toast.error("Assessment slug is required.");
      return;
    }

    if (!form.category_id) {
      toast.error("Please select a category.");
      return;
    }

    if (!form.subject_id) {
      toast.error("Please select a subject.");
      return;
    }

    if (!form.start_time) {
      toast.error("Start date and time is required.");
      return;
    }

    if (!form.end_time) {
      toast.error("End date and time is required.");
      return;
    }

    if (
      new Date(form.end_time).getTime() <= new Date(form.start_time).getTime()
    ) {
      toast.error("End time must be after start time.");
      return;
    }

    if (form.duration_minutes < 1) {
      toast.error("Duration must be at least 1 minute.");
      return;
    }

    if (form.total_questions < 1) {
      toast.error("Total questions must be at least 1.");
      return;
    }

    if (form.passing_score < 0) {
      toast.error("Passing marks cannot be negative.");
      return;
    }

    const totalMarks = form.total_questions * form.marks_per_question;

    if (form.passing_score > totalMarks) {
      toast.error(`Passing score cannot exceed total marks (${totalMarks}).`);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),

        slug: form.slug.trim(),

        description: form.description.trim() || null,

        instructions: form.instructions.trim() || null,

        banner_image: form.banner_image.trim() || null,

        category_id: form.category_id.trim() || null,

        subject_id: form.subject_id.trim() || null,

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

        allow_resume: form.allow_resume,

        auto_submit: form.auto_submit,

        show_leaderboard: form.show_leaderboard,

        anti_cheat_enabled: form.anti_cheat_enabled,

        socket_monitoring: form.socket_monitoring,

        status: "DRAFT",

        is_active: false,
      };

      await createAssessment(payload);

      toast.success("Assessment created successfully.");

      onCreated();
      onClose();
    } catch (error: any) {
      console.error("Create assessment error:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        "Failed to create assessment.";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00629B]/10 text-[#00629B]">
              <Plus size={22} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Create Assessment
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Configure your assessment before adding questions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed"
          >
            <X size={21} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-6">
          <div className="space-y-8">
            {/* Basic Information */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Settings2 size={18} className="text-[#00629B]" />
                <h3 className="font-semibold text-gray-900">
                  Basic Information
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Assessment Title" required>
                  <input
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Space Day Quiz 2026"
                    className="input"
                    required
                  />
                </Field>

                <Field label="Slug" required>
                  <input
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      updateField("slug", slugify(e.target.value));
                    }}
                    placeholder="space-day-quiz-2026"
                    className="input"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Used as the unique assessment identifier.
                  </p>
                </Field>

                <Field label="Category" required>
                  <select
                    value={form.category_id}
                    onChange={(e) => {
                      updateField("category_id", e.target.value);
                      updateField("subject_id", "");
                    }}
                    className="input"
                    disabled={categoriesLoading}
                    required
                  >
                    <option value="">
                      {categoriesLoading
                        ? "Loading categories..."
                        : "Select Category"}
                    </option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <Field label="Subject" required>
                    <select
                      value={form.subject_id}
                      onChange={(e) =>
                        updateField("subject_id", e.target.value)
                      }
                      className="input"
                      disabled={subjectsLoading || !form.category_id}
                      required
                    >
                      <option value="">
                        {!form.category_id
                          ? "Select Category First"
                          : subjectsLoading
                            ? "Loading subjects..."
                            : "Select Subject"}
                      </option>

                      {subjects
                        .filter(
                          (subject) => subject.category_id === form.category_id,
                        )
                        .map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                    </select>

                    <p className="mt-1 text-xs text-gray-400">
                      Select the subject for this assessment.
                    </p>
                  </Field>

                  <p className="mt-1 text-xs text-gray-400">
                    Select a category for this assessment.
                  </p>
                </Field>

                <div className="md:col-span-2">
                  <Field label="Banner URL">
                    <input
                      value={form.banner_image}
                      onChange={(e) =>
                        updateField("banner_image", e.target.value)
                      }
                      placeholder="https://..."
                      className="input"
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="Instructions">
                    <textarea
                      value={form.instructions}
                      onChange={(e) =>
                        updateField("instructions", e.target.value)
                      }
                      placeholder="Enter instructions students should read before starting..."
                      rows={4}
                      className="input resize-none"
                    />
                  </Field>
                </div>
              </div>
            </section>

            {/* Schedule */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-[#00629B]" />
                <h3 className="font-semibold text-gray-900">
                  Schedule & Duration
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Starts At" required>
                  <input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => updateField("start_time", e.target.value)}
                    className="input"
                    required
                  />
                </Field>

                <Field label="Ends At" required>
                  <input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => updateField("end_time", e.target.value)}
                    className="input"
                    required
                  />
                </Field>

                <Field label="Duration (minutes)" required>
                  <div className="relative">
                    <Clock
                      size={17}
                      className="absolute left-3 top-3 text-gray-400"
                    />
                    <input
                      type="number"
                      min={1}
                      value={form.duration_minutes}
                      onChange={(e) =>
                        updateField("duration_minutes", Number(e.target.value))
                      }
                      className="input pl-10"
                      required
                    />
                  </div>

                  <p className="mt-1 text-xs text-gray-400">
                    Enter the duration in minutes. Example: 30 = 30 minutes.
                  </p>
                </Field>

                <Field label="Total Questions" required>
                  <input
                    type="number"
                    min={1}
                    value={form.total_questions}
                    onChange={(e) =>
                      updateField("total_questions", Number(e.target.value))
                    }
                    className="input"
                    required
                  />
                </Field>

                <Field label="Passing Marks">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.passing_score}
                    onChange={(e) =>
                      updateField("passing_score", Number(e.target.value))
                    }
                    className="input"
                  />
                </Field>

                <Field label="Marks Per Question" required>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.marks_per_question}
                    onChange={(e) =>
                      updateField("marks_per_question", Number(e.target.value))
                    }
                    className="input"
                    required
                  />
                </Field>

                <Field label="Negative Marks">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.negative_marks}
                    onChange={(e) =>
                      updateField("negative_marks", Number(e.target.value))
                    }
                    className="input"
                  />
                </Field>

                <Field label="Pass Percentage">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={form.pass_percentage}
                    onChange={(e) =>
                      updateField("pass_percentage", Number(e.target.value))
                    }
                    className="input"
                  />
                </Field>
              </div>
            </section>

            {/* Rules */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Shuffle size={18} className="text-[#00629B]" />
                <h3 className="font-semibold text-gray-900">
                  Assessment Rules
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Toggle
                  label="Shuffle Questions"
                  description="Give students questions in a randomized order."
                  checked={form.shuffle_questions}
                  onChange={(value) => updateField("shuffle_questions", value)}
                />

                <Toggle
                  label="Shuffle Options"
                  description="Randomize answer option order."
                  checked={form.shuffle_options}
                  onChange={(value) => updateField("shuffle_options", value)}
                />

                <Toggle
                  label="Allow Resume"
                  description="Allow students to resume an interrupted attempt."
                  checked={form.allow_resume}
                  onChange={(value) => updateField("allow_resume", value)}
                />

                <Toggle
                  label="Leaderboard"
                  description="Enable leaderboard functionality for this assessment."
                  checked={form.show_leaderboard}
                  onChange={(value) => updateField("show_leaderboard", value)}
                />

                <Toggle
                  label="Random Questions"
                  description="Select a random set of questions for each attempt."
                  checked={form.random_questions}
                  onChange={(value) => updateField("random_questions", value)}
                />
              </div>
            </section>

            {/* Initial status */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <div className="flex items-start gap-3">
                <Trophy size={18} className="mt-0.5 text-[#00629B]" />

                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    New assessment will be created as Draft
                  </p>

                  <p className="mt-1 text-xs leading-5 text-blue-700">
                    You can add question banks, configure students, and publish
                    the assessment later.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#00629B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#004f7c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Create Assessment
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.75rem;
          padding: 0.7rem 0.9rem;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
          background: white;
        }

        .input:focus {
          border-color: #00629B;
          box-shadow: 0 0 0 3px rgba(0, 98, 155, 0.1);
        }

        .input::placeholder {
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, required, children }: FieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}

interface ToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 p-4 text-left transition hover:border-gray-300 hover:bg-gray-50"
    >
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      </div>

      <div
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-[#00629B]" : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </div>
    </button>
  );
}
