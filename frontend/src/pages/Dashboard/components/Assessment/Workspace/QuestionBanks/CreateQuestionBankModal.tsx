import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

import {
  createQuestionBank,
  updateQuestionBank,
} from "../../../Assessment/assessmentApi";

import type { QuestionBank } from "./QuestionBanks";

interface Props {
  open: boolean;
  assessmentId: string;
  bank?: QuestionBank | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CreateQuestionBankModal({
  open,
  assessmentId,
  bank,
  onClose,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [questionsToPick, setQuestionsToPick] = useState(10);

  const isEdit = Boolean(bank);

  useEffect(() => {
    if (!open) return;

    if (bank) {
      setName(bank.name || "");
      setDescription(bank.description || "");
      setDifficulty(bank.difficulty || "Medium");
      setEstimatedMinutes(bank.estimated_minutes ?? 30);
      setQuestionsToPick(bank.questions_to_pick ?? 10);
    } else {
      setName("");
      setDescription("");
      setDifficulty("Medium");
      setEstimatedMinutes(30);
      setQuestionsToPick(10);
    }
  }, [open, bank]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Question Bank name is required.");
      return;
    }

    if (estimatedMinutes < 1) {
      toast.error("Estimated time must be at least 1 minute.");
      return;
    }

    if (questionsToPick < 1) {
      toast.error("Questions to pick must be at least 1.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        assessment_id: assessmentId,
        name: name.trim(),
        description: description.trim() || null,
        difficulty,
        estimated_minutes: estimatedMinutes,
        questions_to_pick: questionsToPick,
      };

      if (isEdit && bank) {
        await updateQuestionBank(bank.id, payload);
        toast.success("Question Bank updated");
      } else {
        await createQuestionBank(payload);
        toast.success("Question Bank created");
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);

      toast.error(
        isEdit
          ? "Unable to update Question Bank"
          : "Unable to create Question Bank",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}

        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-bold">
              {isEdit ? "Edit Question Bank" : "Create Question Bank"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {isEdit
                ? "Update question bank details."
                : "Create a reusable question bank."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}

        <div className="space-y-5 p-6">
          {/* Name */}

          <div>
            <label className="mb-2 block text-sm font-medium">Bank Name</label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Digital Electronics - Unit 1"
              className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-[#00629B]"
              maxLength={150}
            />
          </div>

          {/* Description */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this question bank..."
              rows={4}
              className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-[#00629B]"
              maxLength={500}
            />
          </div>

          {/* Difficulty */}

          <div>
            <label className="mb-2 block text-sm font-medium">Difficulty</label>

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-[#00629B]"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Estimated Time */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Estimated Time
            </label>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-[#00629B]"
              />

              <span className="text-sm text-gray-500">minutes</span>
            </div>
          </div>
        </div>

        {/* Questions to Pick */}

        <div>
          <label className="mb-2 block text-sm font-medium">
            Questions to Pick
          </label>

          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={questionsToPick}
              onChange={(e) => setQuestionsToPick(Number(e.target.value))}
              className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-[#00629B]"
            />

            <span className="text-sm text-gray-500">questions</span>
          </div>

          <p className="mt-1 text-xs text-gray-400">
            Number of questions randomly selected from this bank for the
            assessment.
          </p>
        </div>

        {/* Footer */}

        <div className="flex justify-end gap-3 border-t px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border px-5 py-3 transition hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-[#00629B] px-5 py-3 text-white transition hover:bg-[#005080] disabled:opacity-50"
          >
            {loading
              ? isEdit
                ? "Updating..."
                : "Creating..."
              : isEdit
                ? "Update Bank"
                : "Create Bank"}
          </button>
        </div>
      </div>
    </div>
  );
}
