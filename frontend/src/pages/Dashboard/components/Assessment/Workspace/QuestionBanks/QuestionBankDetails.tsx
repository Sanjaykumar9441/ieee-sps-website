import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, Plus, Search } from "lucide-react";

import { socket } from "../../../../../../lib/socket";
import { QuestionBank } from "./QuestionBanks";
import QuestionEditor from "./QuestionEditor";
import {
  getQuestions,
  deleteQuestion,
  searchQuestions,
  duplicateQuestion,
} from "../../../Assessment/assessmentApi";

interface Props {
  bank: QuestionBank;
  onBack: () => void;
}

interface Question {
  id: string;
  bank_id: string;

  question_text: string;

  question_type: "MCQ" | "MULTIPLE_CORRECT" | "TRUE_FALSE" | "SUBJECTIVE";

  difficulty: "Easy" | "Medium" | "Hard";

  marks: number;

  negative_marks: number;

  explanation: string;

  question_image_id: string | null;

  options: string[];

  correct_answers: number[];

  estimated_seconds: number;

  tags: string[];

  language: string;

  version: number;

  is_active: boolean;
}

export default function QuestionBankDetails({ bank, onBack }: Props) {
  const [showEditor, setShowEditor] = useState(false);

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [difficulty, setDifficulty] = useState("all");

  const fetchQuestions = async () => {
    try {
      setLoading(true);

      const data = await getQuestions(bank.id);

      setQuestions(data || []);
    } catch (err) {
      console.error(err);

      toast.error("Unable to load questions");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this question?")) {
      return;
    }

    try {
      await deleteQuestion(id);

      toast.success("Question deleted");

      fetchQuestions();
    } catch (err) {
      console.error(err);

      toast.error("Unable to delete question");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateQuestion(id);

      toast.success("Question duplicated");

      fetchQuestions();
    } catch (err) {
      console.error(err);

      toast.error("Unable to duplicate question");
    }
  };

  useEffect(() => {
    fetchQuestions();

    socket.on("questionCreated", fetchQuestions);
    socket.on("questionUpdated", fetchQuestions);
    socket.on("questionDeleted", fetchQuestions);

    return () => {
      socket.off("questionCreated", fetchQuestions);
      socket.off("questionUpdated", fetchQuestions);
      socket.off("questionDeleted", fetchQuestions);
    };
  }, [bank.id]);
  useEffect(() => {
    if (!search.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchQuestions(bank.id, search);

        setQuestions(results || []);
      } catch (err) {
        console.error(err);

        toast.error("Search failed");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, bank.id]);

  if (loading) {
    return <div className="py-20 text-center">Loading Questions...</div>;
  }

  const filteredQuestions = questions.filter(
    (question) => difficulty === "all" || question.difficulty === difficulty,
  );

  if (showEditor) {
    return (
      <QuestionEditor
        bankId={bank.id}
        initialQuestion={editingQuestion ?? undefined}
        onBack={() => {
          setShowEditor(false);
          setEditingQuestion(null);
        }}
        onSaved={() => {
          setShowEditor(false);
          setEditingQuestion(null);
          fetchQuestions();
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Back */}

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#00629B]"
      >
        <ArrowLeft size={18} />
        Back to Question Banks
      </button>

      {/* Toolbar */}

      <div className="flex flex-col gap-5 lg:flex-row lg:justify-between lg:items-center">
        <div>
          <h1 className="text-3xl font-bold">{bank.name}</h1>

          <p className="text-gray-500 mt-2">{questions.length} Questions</p>
        </div>

        <button
          onClick={() => {
            setEditingQuestion(null);
            setShowEditor(true);
          }}
          className="bg-[#00629B] text-white px-6 py-3 rounded-xl flex items-center gap-2"
        >
          <Plus size={18} />
          Add Question
        </button>
      </div>

      {/* Filters */}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Question..."
            className="w-full border rounded-xl pl-10 pr-4 py-3"
          />
        </div>

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="border rounded-xl px-4"
        >
          <option value="all">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      {/* Summary */}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-gray-500">Total Questions</p>

          <h2 className="text-3xl font-bold">{questions.length}</h2>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-gray-500">Questions to Pick</p>

          <h2 className="mt-1 text-2xl font-bold text-[#00629B]">
            {bank.questions_to_pick ?? 0}
          </h2>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-gray-500">Difficulty</p>

          <h2 className="mt-1 text-xl font-bold">{bank.difficulty || "-"}</h2>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-gray-500">Estimated Time</p>

          <h2 className="mt-1 text-2xl font-bold">
            {bank.estimated_minutes ?? 0}m
          </h2>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-gray-500">Version</p>

          <h2 className="mt-1 text-2xl font-bold">{bank.version}</h2>
        </div>
      </div>

      {/* Empty State */}

      {filteredQuestions.length === 0 ? (
        <div className="rounded-2xl border py-24 text-center">
          <h2 className="text-2xl font-bold">
            {search.trim() || difficulty !== "all"
              ? "No Matching Questions"
              : "No Questions Yet"}
          </h2>

          <p className="mt-3 text-gray-500">
            {search.trim() || difficulty !== "all"
              ? "Try changing your search or difficulty filter."
              : "Create your first question."}
          </p>

          {!search.trim() && difficulty === "all" && (
            <button
              onClick={() => {
                setEditingQuestion(null);
                setShowEditor(true);
              }}
              className="mt-6 rounded-xl bg-[#00629B] px-6 py-3 text-white"
            >
              + Add Question
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {filteredQuestions.map((question, index) => (
            <div key={question.id} className="border rounded-2xl p-6">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold text-lg">Question #{index + 1}</h3>

                  <p className="mt-2">{question.question_text}</p>

                  <div className="flex gap-3 mt-4 text-sm">
                    <span>{question.difficulty}</span>

                    <span>{question.marks} Marks</span>

                    <span>{question.question_type}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEditingQuestion(question);
                      setShowEditor(true);
                    }}
                    className="border rounded-xl px-4 py-2"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDuplicate(question.id)}
                    className="border rounded-xl px-4 py-2"
                  >
                    Duplicate
                  </button>

                  <button
                    onClick={() => handleDelete(question.id)}
                    className="border border-red-300 text-red-600 rounded-xl px-4 py-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
