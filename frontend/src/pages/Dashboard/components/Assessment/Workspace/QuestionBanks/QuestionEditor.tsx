import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, Save } from "lucide-react";
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
  question_type: "MCQ" | "MULTIPLE_CORRECT" | "TRUE_FALSE" | "SUBJECTIVE";
  difficulty: "Easy" | "Medium" | "Hard";
  marks: number;
  negative_marks: number;
  explanation: string;
  options: string[];
  correct_answers?: number[];
  correct_answer?: number[];
  tags: string[];
  language?: string;
  estimated_seconds?: number;
}

const emptyQuestion: Question = {
  question_text: "",
  question_type: "MCQ",
  difficulty: "Easy",
  marks: 1,
  negative_marks: 0,
  explanation: "",
  options: ["", "", "", ""],
  correct_answers: [],
  tags: [],
  language: "en",
  estimated_seconds: 60,
};

export default function QuestionEditor({
  bankId,
  initialQuestion,
  onBack,
  onSaved,
}: Props) {
  const [question, setQuestion] = useState<Question>(emptyQuestion);
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<string[]>([]);

  useEffect(() => {
    if (!initialQuestion) {
      setQuestion(emptyQuestion);
      return;
    }

    const answers =
      initialQuestion.correct_answers ??
      initialQuestion.correct_answer ??
      [];

    setQuestion({
      ...emptyQuestion,
      ...initialQuestion,
      correct_answers: answers,
      options: Array.isArray(initialQuestion.options)
        ? initialQuestion.options
        : ["", "", "", ""],
    });
  }, [initialQuestion]);

  const answers = question.correct_answers ?? [];

  const setType = (type: Question["question_type"]) => {
    setQuestion((current) => ({
      ...current,
      question_type: type,
      correct_answers:
        type === "MCQ" || type === "TRUE_FALSE"
          ? current.correct_answers?.slice(0, 1) ?? []
          : current.correct_answers ?? [],
      options:
        type === "TRUE_FALSE" || type === "SUBJECTIVE"
          ? []
          : current.options.length
            ? current.options
            : ["", "", "", ""],
    }));
    setValidation([]);
  };

  const validate = () => {
    const errors: string[] = [];
    const options = question.options.filter((x) => x.trim());

    if (!question.question_text.trim()) errors.push("Question text is required.");
    if (question.marks <= 0) errors.push("Marks must be greater than 0.");
    if (question.negative_marks < 0) errors.push("Negative marks cannot be negative.");

    if (question.question_type === "MCQ") {
      if (options.length < 2) errors.push("MCQ needs at least two options.");
      if (answers.length !== 1) errors.push("MCQ needs exactly one correct answer.");
    }

    if (question.question_type === "MULTIPLE_CORRECT") {
      if (options.length < 2) errors.push("Multiple Correct needs at least two options.");
      if (answers.length < 2) {
        errors.push("Multiple Correct needs at least two correct answers.");
      }
    }

    if (question.question_type === "TRUE_FALSE" && answers.length !== 1) {
      errors.push("Select True or False.");
    }

    setValidation(errors);
    if (!errors.length) toast.success("Question is valid.");
    return !errors.length;
  };

  const save = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const payload = {
        bank_id: bankId,
        question_text: question.question_text.trim(),
        question_type: question.question_type,
        difficulty: question.difficulty,
        marks: Number(question.marks),
        negative_marks: Number(question.negative_marks),
        explanation: question.explanation?.trim() || null,
        options:
          question.question_type === "SUBJECTIVE"
            ? []
            : question.options.map((x) => x.trim()).filter(Boolean),
        correct_answers:
          question.question_type === "SUBJECTIVE" ? [] : answers,
        tags: question.tags,
        language: question.language || "en",
        estimated_seconds: Number(question.estimated_seconds || 60),
      };

      if (question.id) {
        await updateQuestion(question.id, payload);
      } else {
        await createQuestion(payload);
      }

      toast.success("Question saved successfully.");
      onSaved();
    } catch (error: any) {
      console.error("Question save error:", error);
      toast.error(
        error?.response?.data?.message ||
          "Unable to save question.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-[#00629B]"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <h1 className="mt-3 text-3xl font-bold">Question Editor</h1>
          <p className="mt-1 text-gray-500">
            Create an MCQ, Multiple Correct, True/False or Subjective question.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={validate}
            className="flex items-center gap-2 rounded-xl border px-5 py-3"
          >
            <CheckCircle size={18} />
            Validate
          </button>
          <button
            type="button"
            onClick={save}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#00629B] px-5 py-3 text-white disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Basic Information</h2>

        <div className="mt-5 grid gap-5 md:grid-cols-4">
          <select
            value={question.question_type}
            onChange={(e) =>
              setType(e.target.value as Question["question_type"])
            }
            className="rounded-xl border p-3"
          >
            <option value="MCQ">MCQ — One Correct Answer</option>
            <option value="MULTIPLE_CORRECT">Multiple Correct</option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="SUBJECTIVE">Subjective</option>
          </select>

          <select
            value={question.difficulty}
            onChange={(e) =>
              setQuestion({
                ...question,
                difficulty: e.target.value as Question["difficulty"],
              })
            }
            className="rounded-xl border p-3"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <input
            type="number"
            min="1"
            value={question.marks}
            onChange={(e) =>
              setQuestion({ ...question, marks: Number(e.target.value) })
            }
            className="rounded-xl border p-3"
            placeholder="Marks"
          />

          <input
            type="number"
            min="0"
            value={question.negative_marks}
            onChange={(e) =>
              setQuestion({
                ...question,
                negative_marks: Number(e.target.value),
              })
            }
            className="rounded-xl border p-3"
            placeholder="Negative Marks"
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Question</h2>

        <textarea
          rows={6}
          value={question.question_text}
          onChange={(e) =>
            setQuestion({
              ...question,
              question_text: e.target.value,
            })
          }
          placeholder="Enter question here..."
          className="mt-5 w-full rounded-xl border p-4"
        />
      </section>

      {(question.question_type === "MCQ" ||
        question.question_type === "MULTIPLE_CORRECT") && (
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">
            Answer Options
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {question.question_type === "MCQ"
              ? "Select exactly one correct answer."
              : "Select two or more correct answers."}
          </p>

          <div className="mt-6 space-y-4">
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type={question.question_type === "MCQ" ? "radio" : "checkbox"}
                  checked={answers.includes(index)}
                  onChange={() => {
                    if (question.question_type === "MCQ") {
                      setQuestion({
                        ...question,
                        correct_answers: [index],
                      });
                    } else {
                      const next = answers.includes(index)
                        ? answers.filter((x) => x !== index)
                        : [...answers, index];

                      setQuestion({
                        ...question,
                        correct_answers: next,
                      });
                    }
                    setValidation([]);
                  }}
                />

                <span className="w-7 font-semibold">
                  {String.fromCharCode(65 + index)}.
                </span>

                <input
                  value={option}
                  onChange={(e) => {
                    const next = [...question.options];
                    next[index] = e.target.value;
                    setQuestion({ ...question, options: next });
                  }}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  className="flex-1 rounded-xl border p-3"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setQuestion({
                  ...question,
                  options: [...question.options, ""],
                })
              }
              className="rounded-xl border px-5 py-2"
            >
              + Add Option
            </button>
          </div>
        </section>
      )}

      {question.question_type === "TRUE_FALSE" && (
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Correct Answer</h2>

          <div className="mt-5 flex gap-8">
            {[["True", 0], ["False", 1]].map(([label, value]) => (
              <label key={String(label)} className="flex items-center gap-3">
                <input
                  type="radio"
                  checked={answers[0] === value}
                  onChange={() =>
                    setQuestion({
                      ...question,
                      correct_answers: [Number(value)],
                    })
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </section>
      )}

      {question.question_type === "SUBJECTIVE" && (
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Subjective Question</h2>
          <p className="mt-1 text-sm text-gray-500">
            Students will type their answer during the exam.
          </p>
        </section>
      )}

      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Explanation</h2>
        <textarea
          rows={5}
          value={question.explanation}
          onChange={(e) =>
            setQuestion({
              ...question,
              explanation: e.target.value,
            })
          }
          placeholder="Optional explanation shown after the assessment."
          className="mt-5 w-full rounded-xl border p-4"
        />
      </section>

      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Tags</h2>
        <input
          value={question.tags.join(", ")}
          onChange={(e) =>
            setQuestion({
              ...question,
              tags: e.target.value
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
            })
          }
          placeholder="Arrays, Loops, Digital Electronics"
          className="mt-5 w-full rounded-xl border p-3"
        />
      </section>

      {validation.length > 0 && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-700">Validation Errors</h2>
          <div className="mt-3 space-y-1 text-sm text-red-600">
            {validation.map((error, index) => (
              <p key={index}>• {error}</p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
