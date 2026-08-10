import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Search } from "lucide-react";

import { socket } from "../../../../../../lib/socket";

import QuestionBankCard from "./QuestionBankCard";
import QuestionBankDetails from "./QuestionBankDetails";
import CreateQuestionBankModal from "./CreateQuestionBankModal";
import { Assessment } from "../../../Assessment/AssessmentCard";
import {
  getQuestionBanks,
  deleteQuestionBank,
  duplicateQuestionBank,
} from "../../../Assessment/assessmentApi";

export interface QuestionBank {
  id: string;
  subject_id: string | null;
  name: string;
  description: string | null;
  difficulty: string | null;
  estimated_minutes: number | null;
  total_questions: number;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  questions_to_pick?: number;
}

interface Props {
  assessment: Assessment;
}

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

  const handleEdit = (bank: QuestionBank) => {
    setEditingBank(bank);
    setOpenCreate(true);
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateQuestionBank(id);

      toast.success("Question Bank duplicated");

      fetchBanks();
    } catch (err) {
      console.error(err);

      toast.error("Duplicate failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQuestionBank(id);

      toast.success("Question Bank deleted");

      fetchBanks();
    } catch (err) {
      console.error(err);

      toast.error("Delete failed");
    }
  };

  useEffect(() => {
    fetchBanks();

    socket.on("questionBankCreated", fetchBanks);
    socket.on("questionBankUpdated", fetchBanks);
    socket.on("questionBankDeleted", fetchBanks);

    return () => {
      socket.off("questionBankCreated", fetchBanks);
      socket.off("questionBankUpdated", fetchBanks);
      socket.off("questionBankDeleted", fetchBanks);
    };
  }, [assessment.id]);

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return <div className="py-20 text-center">Loading Question Banks...</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Question Banks</h2>

          <p className="mt-1 text-gray-500">Manage reusable question banks.</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingBank(null);
              setOpenCreate(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-[#00629B] px-5 py-3 text-white"
          >
            <Plus size={18} />
            Create Bank
          </button>
        </div>
      </div>

      <div className="relative mt-6">
        <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Question Bank..."
          className="w-full rounded-xl border py-3 pl-11 pr-4"
        />
      </div>

      {filteredBanks.length === 0 ? (
        <div className="mt-8 rounded-2xl border bg-white p-10 text-center">
          <h3 className="text-lg font-semibold text-gray-800">
            No Question Banks Found
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            {search
              ? "Try a different search term."
              : "Create your first Question Bank for this assessment."}
          </p>

          {!search && (
            <button
              type="button"
              onClick={() => {
                setEditingBank(null);
                setOpenCreate(true);
              }}
              className="mt-5 rounded-xl bg-[#00629B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#005080]"
            >
              Create Question Bank
            </button>
          )}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredBanks.map((bank) => (
            <QuestionBankCard
              key={bank.id}
              bank={bank}
              onOpen={setSelectedBank}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {selectedBank && (
        <QuestionBankDetails
          bank={selectedBank}
          onBack={() => setSelectedBank(null)}
        />
      )}
      <CreateQuestionBankModal
        open={openCreate}
        assessmentId={assessment.id}
        bank={editingBank}
        onClose={() => {
          setOpenCreate(false);
          setEditingBank(null);
        }}
        onSaved={fetchBanks}
      />
    </>
  );
}
