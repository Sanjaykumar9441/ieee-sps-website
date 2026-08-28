import { useEffect, useState } from "react";
import { ArrowLeft, Eye, CheckCircle, Save, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { createQuestion, updateQuestion } from "../../../Assessment/assessmentApi";

interface Props { bankId: string; initialQuestion?: Question; onBack: () => void; onSaved: () => void; }
interface Question {
  id?: string; bank_id?: string; question_text: string; question_type: "MCQ";
  difficulty: "Easy" | "Medium" | "Hard"; marks: number; negative_marks: number;
  explanation: string; question_image_id: string | null; options: string[]; correct_answers: number[];
  estimated_seconds: number; tags: string[]; language: string; version: number; is_active: boolean;
}

const blankQuestion: Question = { question_text: "", question_type: "MCQ", difficulty: "Easy", marks: 1, negative_marks: 0, explanation: "", question_image_id: null, options: ["", "", "", ""], correct_answers: [], estimated_seconds: 60, tags: [], language: "en", version: 1, is_active: true };

export default function QuestionEditor({ bankId, initialQuestion, onBack, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<string[]>([]);
  const [question, setQuestion] = useState<Question>(blankQuestion);

  useEffect(() => {
    if (!initialQuestion) {
      setQuestion(blankQuestion);
      return;
    }

    const sourceOptions: any = initialQuestion.options;
    const options = Array.isArray(sourceOptions)
      ? sourceOptions
      : ["A", "B", "C", "D", "E"].map((key) => sourceOptions?.[key] ?? "").filter(Boolean);

    const correct = Array.isArray(initialQuestion.correct_answers)
      ? initialQuestion.correct_answers.map((answer: any) =>
          typeof answer === "string" && /^[A-E]$/i.test(answer)
            ? "ABCDE".indexOf(answer.toUpperCase())
            : Number(answer),
        )
      : initialQuestion.correct_answers == null
        ? []
        : [Number(initialQuestion.correct_answers)];

    setQuestion({ ...blankQuestion, ...initialQuestion, options, correct_answers: correct, question_type: "MCQ" });
  }, [initialQuestion]);

  const handleValidate = () => {
    const errors: string[] = [];
    const options = question.options.map((o) => o.trim()).filter(Boolean);
    if (!question.question_text.trim()) errors.push("Question text is required.");
    if (question.marks <= 0) errors.push("Marks must be greater than 0.");
    if (question.negative_marks < 0) errors.push("Negative marks cannot be negative.");
    if (options.length < 2) errors.push("At least two options are required.");
    if (question.correct_answers.length !== 1) errors.push("Select exactly one correct answer.");
    if (question.correct_answers.some((i) => i < 0 || i >= question.options.length || !question.options[i]?.trim())) errors.push("A selected correct answer is invalid.");
    setValidation(errors);
    if (!errors.length) toast.success("No validation errors.");
    return errors;
  };

  const handleSave = async () => {
    if (handleValidate().length) return;
    try {
      setLoading(true);
      const cleanedOptions = question.options.map((o) => o.trim()).filter(Boolean);
      const oldToNew = new Map<number, number>();
      question.options.forEach((o, i) => { if (o.trim()) oldToNew.set(i, cleanedOptions.indexOf(o.trim())); });
      const correct = question.correct_answers.map((i) => oldToNew.get(i)).filter((i): i is number => i !== undefined);
      const payload = { ...question, question_type: "MCQ" as const, options: cleanedOptions, correct_answers: correct };
      if (question.id) await updateQuestion(question.id, payload); else await createQuestion({ ...payload, bank_id: bankId });
      toast.success("Question saved"); onSaved();
    } catch (err: any) { console.error(err); toast.error(err?.response?.data?.message || "Unable to save question"); }
    finally { setLoading(false); }
  };

  const setOption = (index: number, value: string) => setQuestion((q) => { const options = [...q.options]; options[index] = value; return { ...q, options }; });

  return <>
    <div className="flex items-center justify-between border-b pb-5"><div><button type="button" onClick={onBack} className="flex items-center gap-2"><ArrowLeft size={18} />Back</button><h1 className="mt-3 text-3xl font-bold">MCQ Question Editor</h1></div><div className="flex gap-3"><button type="button" onClick={() => document.getElementById("student-preview")?.scrollIntoView({ behavior: "smooth" })} className="flex items-center gap-2 rounded-xl border px-5 py-3"><Eye size={18} />Preview</button><button type="button" onClick={handleValidate} className="flex items-center gap-2 rounded-xl border px-5 py-3"><CheckCircle size={18} />Validate</button><button type="button" onClick={handleSave} disabled={loading} className="flex items-center gap-2 rounded-xl bg-[#00629B] px-5 py-3 text-white disabled:opacity-50"><Save size={18} />{loading ? "Saving..." : "Save"}</button></div></div>

    <div className="mt-8 rounded-2xl border bg-white p-6"><h2 className="mb-5 text-xl font-semibold">Question Settings</h2><div className="grid gap-5 md:grid-cols-3"><div><label className="mb-2 block text-sm font-medium">Question Type</label><input value="MCQ" readOnly className="w-full rounded-xl border bg-gray-50 p-3" /></div><div><label className="mb-2 block text-sm font-medium">Difficulty</label><select value={question.difficulty} onChange={(e) => setQuestion({ ...question, difficulty: e.target.value as Question["difficulty"] })} className="w-full rounded-xl border p-3"><option>Easy</option><option>Medium</option><option>Hard</option></select></div><div><label className="mb-2 block text-sm font-medium">Marks</label><input type="number" min={0.01} step="0.01" value={question.marks} onChange={(e) => setQuestion({ ...question, marks: Number(e.target.value) })} className="w-full rounded-xl border p-3" /></div><div><label className="mb-2 block text-sm font-medium">Negative Marks</label><input type="number" min={0} step="0.01" value={question.negative_marks} onChange={(e) => setQuestion({ ...question, negative_marks: Number(e.target.value) })} className="w-full rounded-xl border p-3" /></div></div></div>

    <div className="mt-8 rounded-2xl border bg-white p-6"><h2 className="text-xl font-semibold">Question</h2><textarea placeholder="Enter question here..." rows={6} value={question.question_text} onChange={(e) => setQuestion({ ...question, question_text: e.target.value })} className="mt-5 w-full rounded-xl border p-4" /><button type="button" className="mt-5 flex items-center gap-2 rounded-xl border px-5 py-3"><Upload size={18} />Upload Image</button></div>

    <div className="mt-8 rounded-2xl border bg-white p-6"><h2 className="text-xl font-semibold">Answer Options</h2><p className="mt-1 text-sm text-gray-500">Select exactly one correct option.</p><div className="mt-6 space-y-4">{question.options.map((option, index) => <div key={index} className="flex items-center gap-3"><input type="radio" name="correct-answer" checked={question.correct_answers[0] === index} onChange={() => setQuestion({ ...question, correct_answers: [index] })} /><span className="w-7 font-semibold">{String.fromCharCode(65 + index)}</span><input value={option} onChange={(e) => setOption(index, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + index)}`} className="flex-1 rounded-xl border p-3" /></div>)}</div><button type="button" onClick={() => setQuestion({ ...question, options: [...question.options, ""] })} className="mt-5 rounded-xl border px-5 py-2">Add Option</button></div>

    <div className="mt-8 rounded-2xl border bg-white p-6"><h2 className="text-xl font-semibold">Explanation</h2><p className="mt-1 text-gray-500">Optional explanation shown after the assessment.</p><textarea rows={5} value={question.explanation} onChange={(e) => setQuestion({ ...question, explanation: e.target.value })} className="mt-5 w-full rounded-xl border p-4" placeholder="Explain why this answer is correct..." /></div>
    <div className="mt-8 rounded-2xl border bg-white p-6"><h2 className="text-xl font-semibold">Tags</h2><input value={question.tags.join(", ")} onChange={(e) => setQuestion({ ...question, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} className="mt-5 w-full rounded-xl border p-3" placeholder="electronics, digital, unit-1" /></div>
    <div className="mt-8 rounded-2xl border bg-white p-6"><h2 className="text-xl font-semibold">Question Image</h2><input type="file" accept="image/*" className="mt-5 block w-full rounded-xl border p-3" /></div>
    <div className="mt-8 rounded-2xl border bg-white p-6"><h2 className="text-xl font-semibold">Validation</h2><div className="mt-5 space-y-2">{validation.length === 0 ? <p className="text-green-600">No validation errors.</p> : validation.map((item, i) => <div key={i} className="text-red-600">• {item}</div>)}</div></div>
    <div id="student-preview" className="mt-8 rounded-2xl border bg-white p-6"><h2 className="text-xl font-semibold">Student Preview</h2><h3 className="mt-6 font-semibold">{question.question_text || "Question Preview"}</h3><div className="mt-6 space-y-3">{question.options.map((option, i) => <label key={i} className="flex items-center gap-3"><input type="radio" disabled /><span>{option || `Option ${String.fromCharCode(65 + i)}`}</span></label>)}</div></div>
  </>;
}
