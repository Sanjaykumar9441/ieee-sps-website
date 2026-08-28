import {
  BookOpen,
  Eye,
  Edit,
  Copy,
  Trash2,
} from "lucide-react";

import { QuestionBank } from "./QuestionBanks";

interface Props {

    bank: QuestionBank;

    onOpen: (bank: QuestionBank) => void;

    onEdit: (bank: QuestionBank) => void;

    onDuplicate: (id: string) => void;

    onDelete: (id: string) => void;

}

export default function QuestionBankCard({

    bank,

    onOpen,

    onEdit,

    onDuplicate,

    onDelete,

}: Props) {
  return (
    <div className="bg-white border rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{bank.name}</h2>
          </div>

          <BookOpen size={28} className="text-[#00629B]" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
  <div>
    <p className="text-sm text-gray-500">Total Questions</p>

    <h3 className="text-2xl font-bold">
      {bank.total_questions}
    </h3>
  </div>

  <div>
    <p className="text-sm text-gray-500">Questions to Pick</p>

    <h3 className="text-2xl font-bold text-[#00629B]">
      {bank.questions_to_pick ?? 0}
    </h3>
  </div>
</div>
        <div className="grid grid-cols-2 gap-3 mt-8">
          <button
            onClick={() => onOpen(bank)}
            className="bg-[#00629B] text-white rounded-xl py-2 flex items-center justify-center gap-2"
          >
            <Eye size={18} />
            View
          </button>

          <button
            onClick={() => onEdit(bank)}
            className="border rounded-xl py-2 flex items-center justify-center gap-2"
          >
            <Edit size={18} />
            Edit
          </button>

          <button
            onClick={() => onDuplicate(bank.id)}
            className="border rounded-xl py-2 flex items-center justify-center gap-2"
          >
            <Copy size={18} />
            Duplicate
          </button>

          <button
            onClick={() => onDelete(bank.id)}
            className="border border-red-300 text-red-600 rounded-xl py-2 flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
