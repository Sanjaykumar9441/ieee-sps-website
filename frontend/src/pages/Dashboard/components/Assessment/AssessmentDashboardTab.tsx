import { useEffect, useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import toast from "react-hot-toast";

import { socket } from "../../../../lib/socket";

import AssessmentCard, { Assessment } from "./AssessmentCard";
import AssessmentWorkspace from "./AssessmentWorkspace";

import {
  getAssessments,
  deleteAssessment,
  duplicateAssessment,
  publishAssessment,
  archiveAssessment,
} from "./assessmentApi";

export default function AssessmentDashboardTab() {
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [assessments, setAssessments] = useState<Assessment[]>([]);

  const [selectedAssessment, setSelectedAssessment] =
    useState<Assessment | null>(null);

  const [openCreateModal, setOpenCreateModal] = useState(false);

  const fetchAssessments = async () => {
    try {
      setLoading(true);

      const data = await getAssessments();

      setAssessments(data);
    } catch (err) {
      console.error(err);

      toast.error("Unable to load assessments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  useEffect(() => {
    socket.connect();

    socket.on("assessmentCreated", fetchAssessments);

    socket.on("assessmentUpdated", fetchAssessments);

    socket.on("assessmentDeleted", fetchAssessments);

    socket.on("assessmentPublished", fetchAssessments);

    return () => {
      socket.off("assessmentCreated", fetchAssessments);

      socket.off("assessmentUpdated", fetchAssessments);

      socket.off("assessmentDeleted", fetchAssessments);

      socket.off("assessmentPublished", fetchAssessments);

      socket.disconnect();
    };
  }, []);

  const filteredAssessments = assessments.filter((assessment) =>
    assessment.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteAssessment(id);

      toast.success("Assessment deleted");

      fetchAssessments();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateAssessment(id);

      toast.success("Assessment duplicated");

      fetchAssessments();
    } catch {
      toast.error("Duplicate failed");
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishAssessment(id);

      toast.success("Assessment published");

      fetchAssessments();
    } catch {
      toast.error("Publish failed");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveAssessment(id);

      toast.success("Assessment archived");

      fetchAssessments();
    } catch {
      toast.error("Archive failed");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold">
            Assessment Dashboard
          </h1>

          <p className="text-gray-500 mt-1">
            Create, manage and monitor assessments.
          </p>
        </div>

        <button
          onClick={() => setOpenCreateModal(true)}
          className="bg-[#00629B] text-white rounded-xl px-5 py-3 flex items-center gap-2"
        >
          <Plus size={18} />

          Create Assessment
        </button>
      </div>

      {/* Toolbar */}

      <div className="bg-white rounded-2xl border p-5 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-3.5 text-gray-400"
            size={18}
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Assessment..."
            className="w-full border rounded-xl py-3 pl-11 pr-4"
          />
        </div>

        <button
          onClick={fetchAssessments}
          className="border rounded-xl px-5 flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} />

          Refresh
        </button>
      </div>

      {/* Loading */}

      {loading ? (
        <div className="text-center py-20">
          Loading Assessments...
        </div>
      ) : (
        <>
          {/* Cards */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAssessments.map((assessment) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                onDashboard={setSelectedAssessment}
                onEdit={() => {}}
                onDuplicate={handleDuplicate}
                onPublish={handlePublish}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Workspace */}

          {selectedAssessment && (
            <AssessmentWorkspace
              assessment={selectedAssessment}
              onClose={() => setSelectedAssessment(null)}
            />
          )}
        </>
      )}

      {/* Create Modal */}

      {openCreateModal && (
        <div>
          {/* We'll build CreateAssessmentModal in Phase 2 */}
        </div>
      )}
    </div>
  );
}