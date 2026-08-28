import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { createQuestionBank, updateQuestionBank } from "../../../Assessment/assessmentApi";
import type { QuestionBank } from "./QuestionBanks";

interface Props { open: boolean; assessmentId: string; bank?: QuestionBank | null; onClose: () => void; onSaved: () => void; }

export default function CreateQuestionBankModal({ open, assessmentId, bank, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [questionsToPick, setQuestionsToPick] = useState(10);
  const isEdit = Boolean(bank);

  useEffect(() => {
    if (!open) return;
    setName(bank?.name || "");
    setQuestionsToPick(Number(bank?.questions_to_pick ?? 10));
  }, [open, bank]);

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Question Bank name is required.");
    if (questionsToPick < 1) return toast.error("Questions to pick must be at least 1.");
    try {
      setLoading(true);
      const payload = { assessment_id: assessmentId, name: name.trim(), questions_to_pick: questionsToPick };
      if (isEdit && bank) { await updateQuestionBank(bank.id, payload); toast.success("Question Bank updated"); }
      else { await createQuestionBank(payload); toast.success("Question Bank created"); }
      onSaved(); onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || (isEdit ? "Unable to update Question Bank" : "Unable to create Question Bank"));
    } finally { setLoading(false); }
  };

  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
    <div className="flex items-center justify-between border-b px-6 py-5"><div><h2 className="text-xl font-bold">{isEdit ? "Edit Question Bank" : "Create Question Bank"}</h2><p className="mt-1 text-sm text-gray-500">MCQ question bank for this assessment.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100"><X size={20} /></button></div>
    <div className="space-y-5 p-6"><div><label className="mb-2 block text-sm font-medium">Bank Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Digital Electronics - Unit 1" className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#00629B]" maxLength={150} /></div><div><label className="mb-2 block text-sm font-medium">Questions to Pick</label><div className="flex items-center gap-3"><input type="number" min={1} value={questionsToPick} onChange={(e) => setQuestionsToPick(Number(e.target.value))} className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#00629B]" /><span className="text-sm text-gray-500">questions</span></div><p className="mt-1 text-xs text-gray-400">Number of MCQ questions selected from this bank for the assessment.</p></div></div>
    <div className="flex justify-end gap-3 border-t px-6 py-5"><button type="button" onClick={onClose} disabled={loading} className="rounded-xl border px-5 py-3">Cancel</button><button type="button" onClick={handleSubmit} disabled={loading} className="rounded-xl bg-[#00629B] px-5 py-3 text-white disabled:opacity-50">{loading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Bank" : "Create Bank")}</button></div>
  </div></div>;
}
