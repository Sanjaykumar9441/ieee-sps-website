import { useEffect, useState } from "react";
import { ArrowLeft, Eye, CheckCircle, Save } from "lucide-react";
import toast from "react-hot-toast";
import { createQuestion, updateQuestion } from "../../../Assessment/assessmentApi";

interface Props {
  bankId: string;
  initialQuestion?: Question;
  onBack: () => void;
  onSaved: () => void;
}

interface Question {
  id?: string;
  bank_id?: string;
  question_text: string;
  question_type: "MCQ" | "MULTIPLE_CORRECT";
  options: string[];
  correct_answers: number[];
}

const blankQuestion: Question = {
  question_text: "",
  question_type: "MCQ",
  options: ["", "", "", ""],
  correct_answers: [],
};

export default function QuestionEditor({
  bankId,
  initialQuestion,
  onBack,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<string[]>([]);
  const [question, setQuestion] = useState<Question>(blankQuestion);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!initialQuestion) {
      setQuestion(blankQuestion);
      return;
    }

    const sourceOptions: any = (initialQuestion as any).options;
    const options = Array.isArray(sourceOptions)
      ? sourceOptions.slice(0, 4)
      : ["A", "B", "C", "D"].map((key) => sourceOptions?.[key] ?? "");

    while (options.length < 4) options.push("");

    const rawCorrect = (initialQuestion as any).correct_answers;
    const correct = Array.isArray(rawCorrect)
      ? rawCorrect
          .map((answer: any) =>
            typeof answer === "string" && /^[A-D]$/i.test(answer)
              ? "ABCD".indexOf(answer.toUpperCase())
              : Number(answer),
          )
          .filter((index: number) => Number.isInteger(index) && index >= 0 && index < 4)
          .filter((value: number, index: number, arr: number[]) => arr.indexOf(value) === index)
      : rawCorrect == null
        ? []
        : [Number(rawCorrect)];

    setQuestion({
      id: initialQuestion.id,
      bank_id: initialQuestion.bank_id,
      question_text: initialQuestion.question_text || "",
      question_type: ((initialQuestion as any).question_type === "MULTIPLE_CORRECT" ? "MULTIPLE_CORRECT" : "MCQ") as Question["question_type"],
      options,
      correct_answers: correct,
    });
  }, [initialQuestion]);

  const handleValidate = () => {
    const errors: string[] = [];
    const options = question.options.map((o) => o.trim());

    if (!question.question_text.trim()) {
      errors.push("Question text is required.");
    }

    if (options.filter(Boolean).length !== 4) {
      errors.push("All four answer options are required.");
    }

    if (new Set(options.filter(Boolean)).size !== options.filter(Boolean).length) {
      errors.push("Answer options must be different.");
    }

    if (question.correct_answers.length < 1) {
      errors.push("Select at least one correct answer.");
    }
    if (question.question_type === "MCQ" && question.correct_answers.length !== 1) {
      errors.push("MCQ requires exactly one correct answer.");
    }

    const correctIndex = question.correct_answers[0];
    if (
      correctIndex !== undefined &&
      (correctIndex < 0 || correctIndex >= 4 || !options[correctIndex])
    ) {
      errors.push("The selected correct answer is invalid.");
    }

    setValidation(errors);
    if (!errors.length) toast.success("Question is valid.");
    return errors;
  };

  const handleSave = async () => {
    if (handleValidate().length) return;

    try {
      setLoading(true);

      const payload = {
        question_text: question.question_text.trim(),
        question_type: question.question_type,
        options: question.options.map((option) => option.trim()),
        correct_answers: question.correct_answers,
      };

      if (question.id) {
        await updateQuestion(question.id, payload);
      } else {
        await createQuestion({ ...payload, bank_id: bankId });
      }

      toast.success("Question saved successfully.");
      onSaved();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Unable to save question.",
      );
    } finally {
      setLoading(false);
    }
  };

  const setOption = (index: number, value: string) => {
    setQuestion((current) => {
      const options = [...current.options];
      options[index] = value;
      return { ...current, options };
    });
  };

  const setCorrectAnswer = (index: number) => {
    setQuestion((current) => {
      if (current.question_type === "MCQ") return { ...current, correct_answers: [index] };
      const exists = current.correct_answers.includes(index);
      return { ...current, correct_answers: exists ? current.correct_answers.filter((i) => i !== index) : [...current.correct_answers, index] };
    });
  };

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between border-b pb-5">
        <div>
          <button type="button" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft size={18} /> Back
          </button>
          <h1 className="mt-3 text-3xl font-bold">Question Editor</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create an MCQ or multiple-correct question with four options.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-2 rounded-xl border px-5 py-3"
          >
            <Eye size={18} /> Preview
          </button>
          <button
            type="button"
            onClick={handleValidate}
            className="flex items-center gap-2 rounded-xl border px-5 py-3"
          >
            <CheckCircle size={18} /> Validate
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#00629B] px-5 py-3 text-white disabled:opacity-50"
          >
            <Save size={18} /> {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {validation.length > 0 && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Please fix the following:</p>
          <ul className="mt-2 list-disc pl-5">
            {validation.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      <section className="mt-8 rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Question</h2>
        <div className="mt-5 max-w-sm">
          <label className="mb-2 block text-sm font-medium">Question Type</label>
          <select value={question.question_type} onChange={(e) => setQuestion((q) => ({ ...q, question_type: e.target.value as Question["question_type"], correct_answers: e.target.value === "MCQ" ? q.correct_answers.slice(0, 1) : q.correct_answers }))} className="w-full rounded-xl border p-3">
            <option value="MCQ">MCQ — One Correct Answer</option>
            <option value="MULTIPLE_CORRECT">Multiple Choice — Multiple Correct Answers</option>
          </select>
        </div>
        <textarea
          rows={6}
          value={question.question_text}
          onChange={(e) => setQuestion({ ...question, question_text: e.target.value })}
          placeholder="Enter question here..."
          className="mt-5 w-full rounded-xl border p-4"
        />
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-6" id="student-preview">
        <h2 className="text-xl font-semibold">Answer Options</h2>
        <p className="mt-1 text-sm text-gray-500">{question.question_type === "MCQ" ? "Select exactly one correct option." : "Select all correct options."}</p>

        <div className="mt-5 space-y-4">
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type={question.question_type === "MCQ" ? "radio" : "checkbox"}
                name={question.question_type === "MCQ" ? "correct-answer" : undefined}
                checked={question.correct_answers.includes(index)}
                onChange={() => setCorrectAnswer(index)}
                aria-label={`Mark option ${String.fromCharCode(65 + index)} correct`}
              />
              <span className="w-6 font-semibold">{String.fromCharCode(65 + index)}</span>
              <input
                value={option}
                onChange={(e) => setOption(index, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                className="w-full rounded-xl border p-3"
              />
            </div>
          ))}
        </div>
      </section>

      {previewOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setPreviewOpen(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div><h2 className="text-xl font-bold">Student Preview</h2><p className="text-sm text-gray-500">This is how the question will appear to students.</p></div>
              <button type="button" onClick={() => setPreviewOpen(false)} className="rounded-lg border px-3 py-2">Close</button>
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#00629B]">Question 1</p>
              <p className="mt-4 text-lg font-medium text-slate-900">{question.question_text || "Question text will appear here."}</p>
              <div className="mt-6 space-y-3">
                {question.options.map((option, index) => <div key={index} className="flex items-start gap-3 rounded-xl border p-4"><span className="font-bold">{String.fromCharCode(65+index)}</span><span>{option || "Option not filled"}</span></div>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
