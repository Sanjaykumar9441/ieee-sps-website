import { useEffect, useState } from "react";
import { X, Database } from "lucide-react";
import toast from "react-hot-toast";
import { createQuestionBank, updateQuestionBank } from "../../../Assessment/assessmentApi";
import type { QuestionBank } from "./QuestionBanks";

interface Props { open: boolean; assessmentId: string; totalQuestions?: number; bank?: QuestionBank | null; onClose: () => void; onSaved: () => void; }

export default function CreateQuestionBankModal({ open, assessmentId, totalQuestions = 20, bank, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [questionsToPick, setQuestionsToPick] = useState(Math.max(1, Number(assessmentId ? 20 : 10)));
  const isEdit = Boolean(bank);

  useEffect(() => {
    if (!open) return;
    setName(bank?.name || "");
    setQuestionsToPick(Math.max(1, Number(bank?.questions_to_pick ?? totalQuestions)));
  }, [open, bank, totalQuestions]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return toast.error("Question Bank name is required.");
    if (!Number.isInteger(questionsToPick) || questionsToPick < 1) return toast.error("Questions to pick must be at least 1.");

    try {
      setLoading(true);
      const payload = { assessment_id: assessmentId, name: trimmedName, questions_to_pick: questionsToPick };
      if (isEdit && bank) {
        await updateQuestionBank(bank.id, payload);
        toast.success("Question Bank updated");
      } else {
        await createQuestionBank(payload);
        toast.success("Question Bank created");
      }
      window.dispatchEvent(new CustomEvent("assessment-data-changed"));
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Question bank save error:", err);
      const message = err?.response?.data?.message || err?.response?.data?.details || err?.message || "Unable to save Question Bank";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && !loading && onClose()}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00629B]/10 text-[#00629B]"><Database size={19}/></div>
            <div><h2 className="text-xl font-bold text-slate-900">{isEdit ? "Edit Question Bank" : "Create Question Bank"}</h2><p className="mt-1 text-sm text-slate-500">Four-option MCQ / Multiple Choice bank.</p></div>
          </div>
          <button type="button" onClick={onClose} disabled={loading} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20}/></button>
        </div>
        <div className="space-y-6 p-6">
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Bank Name</label><input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Digital Electronics - Unit 1" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#00629B] focus:ring-4 focus:ring-[#00629B]/10" maxLength={150}/></div>
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Questions to Pick</label><div className="flex items-center gap-3"><input type="number" min={1} step={1} value={questionsToPick} onChange={(e) => setQuestionsToPick(Number(e.target.value))} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#00629B] focus:ring-4 focus:ring-[#00629B]/10"/><span className="shrink-0 text-sm text-slate-500">questions</span></div><p className="mt-2 text-xs leading-5 text-slate-500">This controls how many questions from this bank are included in each assessment attempt. The assessment total updates automatically.</p></div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">Difficulty is fixed to <strong>Medium</strong> internally for this simplified assessment format.</div>
        </div>
        <div className="flex justify-end gap-3 border-t bg-slate-50 px-6 py-5"><button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700">Cancel</button><button type="button" onClick={() => void handleSubmit()} disabled={loading} className="rounded-xl bg-[#00629B] px-5 py-3 font-semibold text-white disabled:opacity-50">{loading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Save Changes" : "Create Bank")}</button></div>
      </div>
    </div>
  );
}
