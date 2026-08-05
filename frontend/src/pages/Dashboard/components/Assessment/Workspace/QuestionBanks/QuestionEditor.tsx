import { useEffect, useState } from "react";
import { ArrowLeft, Eye, CheckCircle, Save, Upload } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL;

interface Props {
  bankId: string;
  initialQuestion?: Question;
  onBack: () => void;
  onSaved: () => void;
}

interface Question {
  id?: string;

  question_text: string;

  question_type: "MCQ" | "MULTIPLE_CORRECT" | "TRUE_FALSE" | "SUBJECTIVE";

  difficulty: "Easy" | "Medium" | "Hard";

  marks: number;

  negative_marks: number;

  explanation: string;

  image_url: string;

  tags: string[];

  /* MCQ */

  options: string[];

  correct_answer: number[];

  /* Subjective */

  answer_key: string;

  minimum_words: number;

  maximum_words: number;
}

export default function QuestionEditor({
  bankId,

  initialQuestion,

  onBack,

  onSaved,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [validation, setValidation] = useState<string[]>([]);

  const [question, setQuestion] = useState<Question>({
    question_text: "",
    question_type: "MCQ",
    difficulty: "Easy",
    marks: 1,
    negative_marks: 0,
    explanation: "",
    image_url: "",
    tags: [],

    options: ["", "", "", ""],
    correct_answer: [],

    answer_key: "",
    minimum_words: 0,
    maximum_words: 0,
  });

  useEffect(() => {
    if (initialQuestion) {
      setQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  const handleSave = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (question.id) {
        await axios.put(`${API}/api/questions/${question.id}`, question, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        await axios.post(
          `${API}/api/question-banks/${bankId}/questions`,
          question,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      }

      toast.success("Question Saved");

      onSaved();
    } catch (err) {
      console.error(err);
      toast.error("Unable to save question");
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = () => {
    const errors: string[] = [];

    // Question text
    if (!question.question_text.trim()) {
      errors.push("Question text is required.");
    }

    // MCQ / Multiple Correct
    if (
      (question.question_type === "MCQ" ||
        question.question_type === "MULTIPLE_CORRECT") &&
      question.correct_answer.length === 0
    ) {
      errors.push("Select at least one correct answer.");
    }

    // Subjective
    if (
      question.question_type === "SUBJECTIVE" &&
      !question.answer_key.trim()
    ) {
      errors.push("Answer key is required.");
    }

    setValidation(errors);

    if (errors.length === 0) {
      toast.success("No validation errors.");
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-5">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <h1 className="mt-3 text-3xl font-bold">Question Editor</h1>
        </div>

        <div className="flex gap-3">
          <button type="button">
            <Eye size={18} />
            Preview
          </button>

          <button
            type="button"
            onClick={handleValidate}
            className="flex items-center gap-2 rounded-xl border px-5 py-3"
          >
            <CheckCircle size={18} />
            Validate
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#00629B] px-5 py-3 text-white disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      {/* Basic Information */}
      <div className="mt-8 rounded-2xl border bg-white p-6">
        <h2 className="mb-5 text-xl font-semibold">Basic Information</h2>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={question.question_type}
            onChange={(e) =>
              setQuestion({
                ...question,
                question_type: e.target.value as Question["question_type"],
              })
            }
          >
            <option value="MCQ">MCQ</option>
            <option value="MULTIPLE_CORRECT">Multiple Correct</option>
            <option value="TRUE_FALSE">True False</option>
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
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <input
            type="number"
            value={question.marks}
            onChange={(e) =>
              setQuestion({
                ...question,
                marks: Number(e.target.value),
              })
            }
          />

          <input
            type="number"
            value={question.negative_marks}
            onChange={(e) =>
              setQuestion({
                ...question,
                negative_marks: Number(e.target.value),
              })
            }
          />
        </div>
      </div>
      {/* Question */}
      <div className="mt-8 rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Question</h2>

        <textarea
          placeholder="Enter question here..."
          rows={6}
          value={question.question_text}
          onChange={(e) =>
            setQuestion({
              ...question,
              question_text: e.target.value,
            })
          }
          className="mt-5 w-full rounded-xl border p-4"
        />

        <button
          type="button"
          className="mt-5 flex items-center gap-2 rounded-xl border px-5 py-3"
        >
          <Upload size={18} />
          Upload Image
        </button>
      </div>
      <div className="mt-8 rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Answer Configuration</h2>

        {/* MCQ */}

        {(question.question_type === "MCQ" ||
          question.question_type === "MULTIPLE_CORRECT") && (
          <div className="mt-6 space-y-5">
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type={question.question_type === "MCQ" ? "radio" : "checkbox"}
                  checked={
                    question.question_type === "MCQ"
                      ? question.correct_answer[0] === index
                      : question.correct_answer.includes(index)
                  }
                  onChange={() => {
                    if (question.question_type === "MCQ") {
                      setQuestion({
                        ...question,
                        correct_answer: [index],
                      });
                    } else {
                      let answers = [...question.correct_answer];

                      if (answers.includes(index)) {
                        answers = answers.filter((i) => i !== index);
                      } else {
                        answers.push(index);
                      }

                      setQuestion({
                        ...question,
                        correct_answer: answers,
                      });
                    }
                  }}
                />

                <input
                  value={option}
                  onChange={(e) => {
                    const options = [...question.options];
                    options[index] = e.target.value;

                    setQuestion({
                      ...question,
                      options,
                    });
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
              Add Option
            </button>
          </div>
        )}

        {/* TRUE FALSE */}

        {question.question_type === "TRUE_FALSE" && (
          <div className="mt-6 space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="radio"
                checked={question.correct_answer[0] === 0}
                onChange={() =>
                  setQuestion({
                    ...question,
                    correct_answer: [0],
                  })
                }
              />
              True
            </label>

            <label className="flex items-center gap-3">
              <input
                type="radio"
                checked={question.correct_answer[0] === 1}
                onChange={() =>
                  setQuestion({
                    ...question,
                    correct_answer: [1],
                  })
                }
              />
              False
            </label>
          </div>
        )}

        {/* SUBJECTIVE */}

        {question.question_type === "SUBJECTIVE" && (
          <div className="mt-6 grid gap-5">
            <textarea
              rows={5}
              value={question.answer_key}
              onChange={(e) =>
                setQuestion({
                  ...question,
                  answer_key: e.target.value,
                })
              }
              placeholder="Answer Key"
              className="rounded-xl border p-4"
            />

            <div className="grid grid-cols-2 gap-5">
              <input
                type="number"
                placeholder="Minimum Words"
                value={question.minimum_words}
                onChange={(e) =>
                  setQuestion({
                    ...question,
                    minimum_words: Number(e.target.value),
                  })
                }
                className="rounded-xl border p-3"
              />

              <input
                type="number"
                placeholder="Maximum Words"
                value={question.maximum_words}
                onChange={(e) =>
                  setQuestion({
                    ...question,
                    maximum_words: Number(e.target.value),
                  })
                }
                className="rounded-xl border p-3"
              />
            </div>
          </div>
        )}
      </div>
      Step 1 — Explanation Section Place this below Answer Configuration.
      <div className="bg-white rounded-2xl border p-6 mt-8">
        <h2 className="text-xl font-semibold">Explanation</h2>

        <p className="text-gray-500 mt-1">
          This explanation will be shown after the assessment (optional).
        </p>

        <textarea
          rows={6}
          value={question.explanation}
          onChange={(e) =>
            setQuestion({
              ...question,
              explanation: e.target.value,
            })
          }
          placeholder="Explain why this answer is correct..."
          className="w-full border rounded-xl mt-5 p-4"
        />
      </div>
      {/* Tags */}
      <div className="mt-8 rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Tags</h2>

        <p className="mt-1 text-gray-500">
          Separate multiple tags using commas.
        </p>

        <input
          type="text"
          value={question.tags.join(", ")}
          onChange={(e) =>
            setQuestion({
              ...question,
              tags: e.target.value
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            })
          }
          placeholder="Arrays, Loops, Signals"
          className="mt-5 w-full rounded-xl border p-3"
        />
      </div>
      {/* Question Image */}
      <div className="mt-8 rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Question Image</h2>

        <p className="mt-1 text-gray-500">
          Upload an optional image for this question.
        </p>

        <div className="mt-5">
          <input
            type="file"
            accept="image/*"
            className="block w-full rounded-xl border p-3 file:mr-4 file:rounded-lg file:border-0 file:bg-[#00629B] file:px-4 file:py-2 file:text-white hover:file:bg-[#005080]"
          />
        </div>

        {question.image_url && (
          <img
            src={question.image_url}
            alt="Question"
            className="mt-5 max-h-72 rounded-xl border object-contain"
          />
        )}
      </div>
      <div className="bg-white rounded-2xl border p-6 mt-8">
        <h2 className="text-xl font-semibold">Validation</h2>

        <div className="mt-5 space-y-2">
          {validation.length === 0 ? (
            <p className="text-green-600">No validation errors.</p>
          ) : (
            validation.map((item, index) => (
              <div key={index} className="text-red-600">
                • {item}
              </div>
            ))
          )}
        </div>
      </div>
      <div className="bg-white rounded-2xl border p-6 mt-8">
        <h2 className="text-xl font-semibold">Student Preview</h2>

        <div className="mt-6">
          <h3 className="font-semibold">
            {question.question_text || "Question Preview"}
          </h3>

          <div className="space-y-3 mt-6">
            {question.options.map((option, index) => (
              <label key={index} className="flex gap-3">
                <input type="radio" disabled />

                {option || `Option ${String.fromCharCode(65 + index)}`}
              </label>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
