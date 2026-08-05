import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Search, Upload } from "lucide-react";

import { socket } from "../../../../../../lib/socket";

import QuestionBankCard from "./QuestionBankCard";
import QuestionBankDetails from "./QuestionBankDetails";
import ImportQuestionsModal from "./ImportQuestionsModal";
import { Assessment } from "../../../Assessment/AssessmentCard";

const API = import.meta.env.VITE_API_URL;

export interface QuestionBank {
  id: string;
  name: string;
  description: string;
  total_questions: number;
  easy_questions: number;
  medium_questions: number;
  hard_questions: number;
  created_at: string;
}

interface Props {
    assessment: Assessment;
}

export default function QuestionBanks({
    assessment,
}: Props) {
  const [loading, setLoading] = useState(true);

  const [banks, setBanks] = useState<QuestionBank[]>([]);

  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);

  const [search, setSearch] = useState("");

  //const [openCreate, setOpenCreate] = useState(false);

  const [openImport, setOpenImport] = useState(false);

  const fetchBanks = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const { data } = await axios.get(`${API}/api/question-banks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBanks(data.questionBanks || []);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load Question Banks");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bank: QuestionBank) => {
    console.log("Edit", bank);
    // Open Edit Modal here later
  };

  const handleDuplicate = async (id: string) => {
    console.log("Duplicate", id);
    // Call duplicate API later
  };

  const handleDelete = async (id: string) => {
    console.log("Delete", id);
    // Call delete API later
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
  }, []);

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
            onClick={() => setOpenImport(true)}
            className="flex items-center gap-2 rounded-xl border px-5 py-3"
          >
            <Upload size={18} />
            Import CSV
          </button>

          <button
            //onClick={() => setOpenCreate(true)}
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

      {selectedBank && (

<QuestionBankDetails

    bank={selectedBank}

    onBack={() => setSelectedBank(null)}

/>

)}

   <ImportQuestionsModal

    open={openImport}

    bankId={selectedBank?.id || ""}

    onClose={() => setOpenImport(false)}

    onSuccess={fetchBanks}

/>
    </>
  );
}