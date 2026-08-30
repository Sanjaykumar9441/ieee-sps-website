import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Search, Database } from "lucide-react";
import { socket } from "../../../../../../lib/socket";
import QuestionBankCard from "./QuestionBankCard";
import QuestionBankDetails from "./QuestionBankDetails";
import CreateQuestionBankModal from "./CreateQuestionBankModal";
import { Assessment } from "../../../Assessment/AssessmentCard";
import { getQuestionBanks, deleteQuestionBank, duplicateQuestionBank } from "../../../Assessment/assessmentApi";

export interface QuestionBank {
  id: string;
  subject_id: string | null;
  name: string;
  total_questions: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  questions_to_pick?: number;
}

interface Props { assessment: Assessment; }

export default function QuestionBanks({ assessment }: Props) {
  const [loading, setLoading] = useState(true);
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const questionBanks = await getQuestionBanks(assessment.id);
      setBanks(questionBanks || []);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load Question Banks");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this Question Bank? Its questions will also be deleted permanently.")) return;
    try {
      await deleteQuestionBank(id);
      toast.success("Question Bank deleted");
      window.dispatchEvent(new CustomEvent("assessment-data-changed"));
      await fetchBanks();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateQuestionBank(id);
      toast.success("Question Bank duplicated");
      window.dispatchEvent(new CustomEvent("assessment-data-changed"));
      await fetchBanks();
    } catch (err) {
      console.error(err);
      toast.error("Duplicate failed");
    }
  };

  useEffect(() => {
    void fetchBanks();
    const refresh = () => void fetchBanks();
    socket.on("questionBankCreated", refresh);
    socket.on("questionBankUpdated", refresh);
    socket.on("questionBankDeleted", refresh);
    return () => {
      socket.off("questionBankCreated", refresh);
      socket.off("questionBankUpdated", refresh);
      socket.off("questionBankDeleted", refresh);
    };
  }, [assessment.id]);

  const filteredBanks = banks.filter((bank) => bank.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="rounded-2xl border bg-white py-24 text-center text-slate-500">Loading Question Banks...</div>;

  if (selectedBank) {
    return <QuestionBankDetails bank={selectedBank} onBack={() => { setSelectedBank(null); void fetchBanks(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#00629B]">Question library</p><h2 className="mt-1 text-3xl font-bold text-slate-900">Question Banks</h2><p className="mt-1 text-slate-500">Build reusable four-option MCQ and multiple-correct banks.</p></div>
        <button type="button" onClick={() => { setEditingBank(null); setOpenCreate(true); }} className="flex items-center justify-center gap-2 rounded-xl bg-[#00629B] px-5 py-3 font-semibold text-white shadow-sm hover:bg-[#00527f]"><Plus size={18}/> Create Bank</button>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm"><div className="relative flex-1"><Search className="absolute left-4 top-3.5 text-slate-400" size={18}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Question Bank..." className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-[#00629B]"/></div><div className="hidden rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500 sm:block"><Database size={16} className="mr-2 inline"/>{filteredBanks.length} bank{filteredBanks.length === 1 ? "" : "s"}</div></div>
      {filteredBanks.length === 0 ? (
        <div className="rounded-2xl border bg-white p-14 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Database size={26}/></div><h3 className="mt-5 text-xl font-semibold text-slate-900">{search ? "No Question Banks Found" : "No Question Banks Yet"}</h3><p className="mt-2 text-sm text-slate-500">{search ? "Try a different search term." : "Create your first bank and add questions manually or by CSV."}</p>{!search && <button type="button" onClick={() => { setEditingBank(null); setOpenCreate(true); }} className="mt-6 rounded-xl bg-[#00629B] px-5 py-3 font-semibold text-white">Create Question Bank</button>}</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{filteredBanks.map((bank) => <QuestionBankCard key={bank.id} bank={bank} onOpen={setSelectedBank} onEdit={(value) => { setEditingBank(value); setOpenCreate(true); }} onDuplicate={handleDuplicate} onDelete={handleDelete}/>)}</div>
      )}
      <CreateQuestionBankModal open={openCreate} assessmentId={assessment.id} bank={editingBank} onClose={() => { setOpenCreate(false); setEditingBank(null); }} onSaved={fetchBanks}/>
    </div>
  );
}
