import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Plus,
  Search,
  Upload,
  Download,
  X,
  CheckCircle,
} from "lucide-react";

import { socket } from "../../../../../../lib/socket";
import {
  getQuestions,
  deleteQuestion,
  searchQuestions,
  duplicateQuestion,
  validateImportedQuestions,
  checkQuestionDuplicates,
  finalImportQuestions,
} from "../../../Assessment/assessmentApi";

import { QuestionBank } from "./QuestionBanks";
import QuestionEditor from "./QuestionEditor";

interface Props {
  bank: QuestionBank;
  onBack: () => void;
}

interface Question {
  id: string;
  bank_id: string;

  question_text: string;

  question_type: "MCQ";

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

interface ImportQuestion {
  question_text: string;
  question_type: "MCQ";

  difficulty: "Easy" | "Medium" | "Hard";

  marks: number;
  negative_marks: number;

  explanation: string;

  options: string[];

  correct_answers: number[];

  estimated_seconds: number;

  tags: string[];

  language: string;
}

export default function QuestionBankDetails({
  bank,
  onBack,
}: Props) {
  const [showEditor, setShowEditor] = useState(false);

  const [editingQuestion, setEditingQuestion] =
    useState<Question | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [difficulty, setDifficulty] = useState("all");

  const [showImport, setShowImport] = useState(false);

  const [importQuestions, setImportQuestions] = useState<
    ImportQuestion[]
  >([]);

  const [importErrors, setImportErrors] = useState<string[]>([]);

  const [duplicateCount, setDuplicateCount] = useState(0);

  const [importLoading, setImportLoading] = useState(false);

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
      fetchQuestions();
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchQuestions(
          bank.id,
          search,
        );

        setQuestions(results || []);
      } catch (err) {
        console.error(err);

        toast.error("Search failed");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, bank.id]);

  const parseCSVLine = (line: string) => {
    const result: string[] = [];

    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (
          insideQuotes &&
          line[i + 1] === '"'
        ) {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());

    return result;
  };

  const parseCorrectAnswers = (
    value: string,
    questionType: string,
  ) => {
    const clean = value.trim().toUpperCase();

    if (!clean) return [];

    return clean
      .split(/[|,]/)
      .map((answer) => answer.trim())
      .filter(Boolean)
      .map((answer) =>
        answer.charCodeAt(0) - 65,
      );
  };

  const handleCSVImport = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a CSV file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = String(reader.result || "");

        const lines = text
          .split(/\r?\n/)
          .filter((line) => line.trim());

        if (lines.length < 2) {
          toast.error(
            "CSV must contain a header and at least one question.",
          );
          return;
        }

        const headers = parseCSVLine(lines[0]).map(
          (header) =>
            header.trim().toLowerCase(),
        );

        const requiredHeaders = [
          "question_text",
          "difficulty",
          "marks",
          "negative_marks",
          "option_a",
          "option_b",
          "option_c",
          "option_d",
          "correct_answer",
          "estimated_seconds",
          "tags",
          "language",
        ];

        const missingHeaders =
          requiredHeaders.filter(
            (header) =>
              !headers.includes(header),
          );

        if (missingHeaders.length > 0) {
          toast.error(
            `Missing columns: ${missingHeaders.join(", ")}`,
          );
          return;
        }

        const parsed: ImportQuestion[] =
          lines.slice(1).map((line) => {
            const values = parseCSVLine(line);

            const row: Record<string, string> =
              {};

            headers.forEach(
              (header, index) => {
                row[header] =
                  values[index] || "";
              },
            );

            const questionType: ImportQuestion["question_type"] = "MCQ";

            const difficultyValue =
              row.difficulty
                .trim()
                .toLowerCase();

            const normalizedDifficulty =
              difficultyValue === "medium"
                ? "Medium"
                : difficultyValue === "hard"
                  ? "Hard"
                  : "Easy";

            const options = [
                    row.option_a,
                    row.option_b,
                    row.option_c,
                    row.option_d,
                  ]
                    .map((option) =>
                      option.trim(),
                    )
                    .filter(Boolean);

            return {
              question_text:
                row.question_text.trim(),

              question_type: questionType,

              difficulty:
                normalizedDifficulty,

              marks:
                Number(row.marks) || 0,

              negative_marks:
                Number(row.negative_marks) ||
                0,

              explanation:
                row.explanation?.trim() || "",

              options,

              correct_answers:
                parseCorrectAnswers(
                  row.correct_answer,
                  questionType,
                ),

              estimated_seconds:
                Number(
                  row.estimated_seconds,
                ) || 0,

              tags: row.tags
                ? row.tags
                    .split("|")
                    .map((tag) =>
                      tag.trim(),
                    )
                    .filter(Boolean)
                : [],

              language:
                row.language?.trim() || "en",
            };
          });

        setImportQuestions(parsed);
        setImportErrors([]);
        setDuplicateCount(0);

        toast.success(
          `${parsed.length} questions loaded.`,
        );
      } catch (err) {
        console.error(err);

        toast.error(
          "Unable to parse CSV file.",
        );
      }
    };

    reader.readAsText(file);

    event.target.value = "";
  };

  const handleValidateImport = async () => {
    if (importQuestions.length === 0) {
      toast.error("Import questions first.");
      return;
    }

    try {
      setImportLoading(true);

      const result =
        await validateImportedQuestions(
          bank.id,
          importQuestions,
        );

      if (!result.valid) {
        setImportErrors(
          result.errors || [],
        );

        toast.error(
          `${result.errors?.length || 0} validation errors found.`,
        );

        return;
      }

      setImportErrors([]);

      const duplicateResult =
        await checkQuestionDuplicates(
          bank.id,
          importQuestions,
        );

      setDuplicateCount(
        duplicateResult.duplicateCount || 0,
      );

      if (
        duplicateResult.duplicateCount > 0
      ) {
        toast.error(
          `${duplicateResult.duplicateCount} duplicate question(s) found.`,
        );
      } else {
        toast.success(
          "All questions validated successfully.",
        );
      }
    } catch (err) {
      console.error(err);

      toast.error(
        "Unable to validate questions.",
      );
    } finally {
      setImportLoading(false);
    }
  };

  const handleFinalImport = async () => {
    if (importQuestions.length === 0) {
      toast.error("No questions to import.");
      return;
    }

    if (importErrors.length > 0) {
      toast.error(
        "Fix validation errors before importing.",
      );
      return;
    }

    if (duplicateCount > 0) {
      toast.error(
        "Remove duplicate questions before importing.",
      );
      return;
    }

    try {
      setImportLoading(true);

      const result =
        await finalImportQuestions(
          bank.id,
          importQuestions,
        );

      toast.success(
        result.message ||
          "Questions imported successfully.",
      );

      setImportQuestions([]);
      setImportErrors([]);
      setDuplicateCount(0);
      setShowImport(false);

      await fetchQuestions();
    } catch (err) {
      console.error(err);

      toast.error(
        "Unable to import questions.",
      );
    } finally {
      setImportLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = [
      [
        "question_text",
        "difficulty",
        "marks",
        "negative_marks",
        "option_a",
        "option_b",
        "option_c",
        "option_d",
        "correct_answer",
        "estimated_seconds",
        "tags",
        "language",
      ].join(","),

      [
        `"What is a multiplexer?"`,
        "Easy",
        "1",
        "0",
        `"MUX"`,
        `"Encoder"`,
        `"Decoder"`,
        `"Register"`,
        "A",
        "60",
        `"Digital Electronics|MUX"`,
        "en",
      ].join(","),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "question-import-template.csv";

    link.click();

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        Loading Questions...
      </div>
    );
  }

  const filteredQuestions =
    questions.filter(
      (question) =>
        difficulty === "all" ||
        question.difficulty ===
          difficulty,
    );

  if (showEditor) {
    return (
      <QuestionEditor
        bankId={bank.id}
        initialQuestion={
          editingQuestion ?? undefined
        }
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
    <>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#00629B]"
      >
        <ArrowLeft size={18} />
        Back to Question Banks
      </button>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {bank.name}
          </h1>

          <p className="mt-2 text-gray-500">
            {questions.length} Questions
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setEditingQuestion(null);
              setShowEditor(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-[#00629B] px-6 py-3 text-white"
          >
            <Plus size={18} />
            Add Question
          </button>

          <button
            onClick={() => {
              setShowImport(true);
              setImportQuestions([]);
              setImportErrors([]);
              setDuplicateCount(0);
            }}
            className="flex items-center gap-2 rounded-xl border border-[#00629B] px-6 py-3 text-[#00629B]"
          >
            <Upload size={18} />
            Import Questions
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-3.5 text-gray-400"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search Question..."
            className="w-full rounded-xl border py-3 pl-10 pr-4"
          />
        </div>

        <select
          value={difficulty}
          onChange={(e) =>
            setDifficulty(e.target.value)
          }
          className="rounded-xl border px-4"
        >
          <option value="all">
            All Difficulties
          </option>
          <option value="Easy">Easy</option>
          <option value="Medium">
            Medium
          </option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-gray-500">
            Total Questions
          </p>

          <h2 className="text-3xl font-bold">
            {questions.length}
          </h2>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-gray-500">
            Questions to Pick
          </p>

          <h2 className="mt-1 text-2xl font-bold text-[#00629B]">
            {bank.questions_to_pick ??
              0}
          </h2>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-gray-500">
            Version
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            {bank.version}
          </h2>
        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="rounded-2xl border py-24 text-center">
          <h2 className="text-2xl font-bold">
            {search.trim() ||
            difficulty !== "all"
              ? "No Matching Questions"
              : "No Questions Yet"}
          </h2>

          <p className="mt-3 text-gray-500">
            {search.trim() ||
            difficulty !== "all"
              ? "Try changing your search or difficulty filter."
              : "Create or import your first question."}
          </p>

          {!search.trim() &&
            difficulty === "all" && (
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setEditingQuestion(
                      null,
                    );
                    setShowEditor(true);
                  }}
                  className="rounded-xl bg-[#00629B] px-6 py-3 text-white"
                >
                  + Add Question
                </button>

                <button
                  onClick={() =>
                    setShowImport(true)
                  }
                  className="rounded-xl border border-[#00629B] px-6 py-3 text-[#00629B]"
                >
                  Import Questions
                </button>
              </div>
            )}
        </div>
      ) : (
        <div className="space-y-5">
          {filteredQuestions.map(
            (question, index) => (
              <div
                key={question.id}
                className="rounded-2xl border p-6"
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-bold">
                      Question #{index + 1}
                    </h3>

                    <p className="mt-2">
                      {
                        question.question_text
                      }
                    </p>

                    <div className="mt-4 flex gap-3 text-sm">
                      <span>
                        {
                          question.difficulty
                        }
                      </span>

                      <span>
                        {question.marks} Marks
                      </span>

                      <span>
                        {
                          question.question_type
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setEditingQuestion(
                          question,
                        );
                        setShowEditor(true);
                      }}
                      className="rounded-xl border px-4 py-2"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDuplicate(
                          question.id,
                        )
                      }
                      className="rounded-xl border px-4 py-2"
                    >
                      Duplicate
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(
                          question.id,
                        )
                      }
                      className="rounded-xl border border-red-300 px-4 py-2 text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {/* ====================================================== */}
      {/* IMPORT MODAL */}
      {/* ====================================================== */}

      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold">
                  Import Questions
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Import questions into{" "}
                  <strong>
                    {bank.name}
                  </strong>
                </p>
              </div>

              <button
                onClick={() =>
                  setShowImport(false)
                }
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Upload */}

              <div className="rounded-2xl border-2 border-dashed p-8 text-center">
                <Upload
                  size={36}
                  className="mx-auto text-[#00629B]"
                />

                <h3 className="mt-3 text-lg font-semibold">
                  Upload CSV
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Use the provided template
                  format.
                </p>

                <div className="mt-5 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={
                      downloadTemplate
                    }
                    className="flex items-center gap-2 rounded-xl border px-5 py-3"
                  >
                    <Download
                      size={18}
                    />
                    Download Template
                  </button>

                  <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#00629B] px-5 py-3 text-white">
                    <Upload size={18} />

                    Choose CSV

                    <input
                      type="file"
                      accept=".csv"
                      onChange={
                        handleCSVImport
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Preview */}

              {importQuestions.length >
                0 && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Preview (
                      {
                        importQuestions.length
                      }{" "}
                      questions)
                    </h3>

                    <button
                      onClick={
                        handleValidateImport
                      }
                      disabled={
                        importLoading
                      }
                      className="flex items-center gap-2 rounded-xl bg-[#00629B] px-5 py-3 text-white disabled:opacity-50"
                    >
                      <CheckCircle
                        size={18}
                      />

                      {importLoading
                        ? "Checking..."
                        : "Validate"}
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-3 text-left">
                            #
                          </th>

                          <th className="p-3 text-left">
                            Question
                          </th>

                          <th className="p-3 text-left">
                            Type
                          </th>

                          <th className="p-3 text-left">
                            Difficulty
                          </th>

                          <th className="p-3 text-left">
                            Marks
                          </th>

                          <th className="p-3 text-left">
                            Correct
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {importQuestions.map(
                          (
                            question,
                            index,
                          ) => (
                            <tr
                              key={index}
                              className="border-t"
                            >
                              <td className="p-3">
                                {index +
                                  1}
                              </td>

                              <td className="max-w-md p-3">
                                {
                                  question.question_text
                                }
                              </td>

                              <td className="p-3">
                                {
                                  question.question_type
                                }
                              </td>

                              <td className="p-3">
                                {
                                  question.difficulty
                                }
                              </td>

                              <td className="p-3">
                                {
                                  question.marks
                                }
                              </td>

                              <td className="p-3">
                                {question.correct_answers
                                  .map(
                                    (
                                      answer,
                                    ) =>
                                      String.fromCharCode(
                                        65 +
                                          answer,
                                      ),
                                  )
                                  .join(
                                    ", ",
                                  )}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Errors */}

              {importErrors.length >
                0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                  <h3 className="font-semibold text-red-700">
                    Validation Errors
                  </h3>

                  <div className="mt-3 space-y-1 text-sm text-red-600">
                    {importErrors.map(
                      (
                        error,
                        index,
                      ) => (
                        <p key={index}>
                          • {error}
                        </p>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Duplicates */}

              {duplicateCount > 0 && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
                  <p className="text-sm text-yellow-800">
                    {duplicateCount} duplicate
                    question(s) found.
                    Remove them before
                    importing.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-5">
              <button
                onClick={() =>
                  setShowImport(false)
                }
                className="rounded-xl border px-5 py-3"
              >
                Cancel
              </button>

              <button
                onClick={
                  handleFinalImport
                }
                disabled={
                  importLoading ||
                  importQuestions.length ===
                    0 ||
                  importErrors.length > 0 ||
                  duplicateCount > 0
                }
                className="rounded-xl bg-[#00629B] px-6 py-3 text-white disabled:opacity-40"
              >
                {importLoading
                  ? "Importing..."
                  : `Import ${importQuestions.length} Questions`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}