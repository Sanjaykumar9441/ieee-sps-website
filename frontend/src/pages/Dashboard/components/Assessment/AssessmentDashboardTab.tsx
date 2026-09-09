import { useEffect, useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import toast from "react-hot-toast";

import { socket } from "../../../../lib/socket";

import AssessmentCard, { Assessment } from "./AssessmentCard";
import AssessmentWorkspace from "./AssessmentWorkspace";
import CreateAssessmentModal from "./CreateAssessmentModal";
import "./assessment-premium.css";

import {
  getAssessments,
  deleteAssessment,
  duplicateAssessment,
  publishAssessment,
  unpublishAssessment,
} from "./assessmentApi";

export default function AssessmentDashboardTab() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] =
    useState<Assessment | null>(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(
    null,
  );

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const data = await getAssessments();
      setAssessments(data);
      setSelectedAssessment((current) => {
        if (!current) return current;
        return (
          data.find((item: Assessment) => item.id === current.id) || current
        );
      });
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
    document.body.classList.add("assessment-premium-active");

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("assessmentCreated", fetchAssessments);
    socket.on("assessmentUpdated", fetchAssessments);
    socket.on("assessmentDeleted", fetchAssessments);
    socket.on("assessmentPublished", fetchAssessments);
    const refreshFromWorkspace = () => void fetchAssessments();
    window.addEventListener("assessment-data-changed", refreshFromWorkspace);

    return () => {
      socket.off("assessmentCreated", fetchAssessments);
      socket.off("assessmentUpdated", fetchAssessments);
      socket.off("assessmentDeleted", fetchAssessments);
      socket.off("assessmentPublished", fetchAssessments);
      window.removeEventListener(
        "assessment-data-changed",
        refreshFromWorkspace,
      );
      document.body.classList.remove("assessment-premium-active");
    };
  }, []);

  const filteredAssessments = assessments.filter((assessment) =>
    assessment.title.toLowerCase().includes(search.toLowerCase()),
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

  const handleUnpublish = async (assessmentId: string) => {
    try {
      await unpublishAssessment(assessmentId);
      toast.success("Assessment unpublished");
      await fetchAssessments();
    } catch (error) {
      console.error("Unpublish assessment error:", error);
      toast.error("Failed to unpublish assessment");
    }
  };

  return (
    <div className="assessment-dashboard-premium space-y-8">
      <div className="assessment-premium-header">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-400">
              Assessment Control Center
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Assessment Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
              Create, manage and monitor assessments from one focused
              professional workspace.
            </p>
          </div>

          <button
            onClick={() => setOpenCreateModal(true)}
            className="relative z-10 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[14px] bg-white px-5 py-3 text-sm font-bold text-zinc-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-zinc-100"
          >
            <Plus size={18} />
            Create Assessment
          </button>
        </div>

        <div className="relative z-10 mt-7 grid grid-cols-3 gap-3 md:max-w-xl">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              Total
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {assessments.length}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              Active
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {assessments.filter((item) => item.is_active).length}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              Published
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {assessments.filter((item) => item.is_published).length}
            </p>
          </div>
        </div>
      </div>

      <div className="assessment-premium-toolbar flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            size={19}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assessment by title..."
            className="w-full rounded-[14px] border border-zinc-200 bg-white py-3 pl-12 pr-4 text-[15px] outline-none"
          />
        </div>
        <button
          onClick={fetchAssessments}
          disabled={loading}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[14px] border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-800"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-72 animate-pulse rounded-2xl border border-zinc-200 bg-white"
            />
          ))}
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-20 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 text-white">
            <Search size={22} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-zinc-950">
            No assessments found
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
            {search
              ? "Try another search term."
              : "Create your first assessment to get started."}
          </p>
          {!search && (
            <button
              type="button"
              onClick={() => setOpenCreateModal(true)}
              className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-[14px] bg-zinc-950 px-5 py-3 text-sm font-bold text-white hover:bg-zinc-800"
            >
              <Plus size={18} />
              Create Assessment
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredAssessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              onDashboard={setSelectedAssessment}
              onEdit={(assessment) => {
                setEditingAssessment(assessment);
                setOpenEditModal(true);
              }}
              onDuplicate={handleDuplicate}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {selectedAssessment && (
        <AssessmentWorkspace
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
        />
      )}

      <CreateAssessmentModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onCreated={fetchAssessments}
      />

      <CreateAssessmentModal
        open={openEditModal}
        assessment={editingAssessment}
        onClose={() => {
          setOpenEditModal(false);
          setEditingAssessment(null);
        }}
        onCreated={fetchAssessments}
      />
    </div>
  );
}
