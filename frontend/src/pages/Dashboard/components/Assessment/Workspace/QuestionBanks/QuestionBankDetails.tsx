import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowLeft, Plus, Search } from "lucide-react";

import { socket } from "../../../../../../lib/socket";
import { QuestionBank } from "./QuestionBanks";
import QuestionEditor from "./QuestionEditor";

const API = import.meta.env.VITE_API_URL;

interface Props {
  bank: QuestionBank;
  onBack: () => void;
}

interface Question {
  id: string;

  question_text: string;

  question_type: "MCQ" | "MULTIPLE_CORRECT" | "TRUE_FALSE" | "SUBJECTIVE";

  difficulty: "Easy" | "Medium" | "Hard";

  marks: number;

  negative_marks: number;

  explanation: string;

  image_url: string;

  tags: string[];

  options: string[];

  correct_answer: number[];

  answer_key: string;

  minimum_words: number;

  maximum_words: number;
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
      const token = localStorage.getItem("token");

      const { data } = await axios.get(
        `${API}/api/question-banks/${bank.id}/questions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setQuestions(data.questions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this question?")) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(`${API}/api/questions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Question deleted");

      fetchQuestions();
    } catch (err) {
      console.error(err);
      toast.error("Unable to delete question");
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

  const filteredQuestions = questions.filter((question) => {
    const matchesSearch = question.question_text
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesDifficulty =
      difficulty === "all" || question.difficulty === difficulty;

    return matchesSearch && matchesDifficulty;
  });

  if (loading) {
    return <div className="py-20 text-center">Loading Questions...</div>;
  }

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

          <p className="text-gray-500 mt-2">{bank.total_questions} Questions</p>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-xl p-5">
          <p>Total</p>
          <h2 className="text-3xl font-bold">{bank.total_questions}</h2>
        </div>

        <div className="border rounded-xl p-5">
          <p>Easy</p>
          <h2 className="text-3xl font-bold text-green-600">
            {bank.easy_questions}
          </h2>
        </div>

        <div className="border rounded-xl p-5">
          <p>Medium</p>
          <h2 className="text-3xl font-bold text-yellow-600">
            {bank.medium_questions}
          </h2>
        </div>

        <div className="border rounded-xl p-5">
          <p>Hard</p>
          <h2 className="text-3xl font-bold text-red-600">
            {bank.hard_questions}
          </h2>
        </div>
      </div>

      {/* Empty State */}

      {filteredQuestions.length === 0 ? (
        <div className="border rounded-2xl py-24 text-center">
          <h2 className="text-2xl font-bold">No Questions Yet</h2>

          <p className="text-gray-500 mt-3">Create your first question.</p>

          <button
            onClick={() => {
              setEditingQuestion(null);
              setShowEditor(true);
            }}
            className="mt-6 bg-[#00629B] text-white px-6 py-3 rounded-xl"
          >
            + Add Question
          </button>
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
