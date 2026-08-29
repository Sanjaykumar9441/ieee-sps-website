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
  question_type: "MCQ";
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
          .slice(0, 1)
      : rawCorrect == null
        ? []
        : [Number(rawCorrect)];

    setQuestion({
      id: initialQuestion.id,
      bank_id: initialQuestion.bank_id,
      question_text: initialQuestion.question_text || "",
      question_type: "MCQ",
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

    if (question.correct_answers.length !== 1) {
      errors.push("Select exactly one correct answer.");
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
        question_type: "MCQ" as const,
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
    setQuestion((current) => ({
      ...current,
      correct_answers: [index],
    }));
  };

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between border-b pb-5">
        <div>
          <button type="button" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft size={18} /> Back
          </button>
          <h1 className="mt-3 text-3xl font-bold">MCQ Question Editor</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a multiple-choice question with four options and one correct answer.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => document.getElementById("student-preview")?.scrollIntoView({ behavior: "smooth" })}
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
        <p className="mt-1 text-sm text-gray-500">Select exactly one correct option.</p>

        <div className="mt-5 space-y-4">
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="radio"
                name="correct-answer"
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
    </div>
  );
}
