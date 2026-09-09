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
    void fetchAssessments();
  }, []);

  useEffect(() => {
    document.body.classList.add("assessment-premium-active");
    if (!socket.connected) socket.connect();

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
      void fetchAssessments();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateAssessment(id);
      toast.success("Assessment duplicated");
      void fetchAssessments();
    } catch {
      toast.error("Duplicate failed");
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishAssessment(id);
      toast.success("Assessment published");
      void fetchAssessments();
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
    <div className="assessment-premium">
      <div className="assessment-premium-page">
        <section className="assessment-premium-hero">
          <div className="assessment-premium-hero-orbit assessment-premium-hero-orbit-one" />
          <div className="assessment-premium-hero-orbit assessment-premium-hero-orbit-two" />

          <div className="assessment-premium-hero-content">
            <div>
              <div className="assessment-premium-eyebrow">
                Assessment Control Center
              </div>
              <h1>Assessment Dashboard</h1>
              <p>
                Create, manage and monitor assessments from one focused
                workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpenCreateModal(true)}
              className="assessment-premium-primary-action"
            >
              <Plus size={18} />
              Create Assessment
            </button>
          </div>

          <div className="assessment-premium-hero-stats">
            <div>
              <span>Total</span>
              <strong>{assessments.length}</strong>
            </div>
            <div>
              <span>Active</span>
              <strong>{assessments.filter((x) => x.is_active).length}</strong>
            </div>
            <div>
              <span>Published</span>
              <strong>
                {assessments.filter((x) => x.is_published).length}
              </strong>
            </div>
          </div>
        </section>

        <section className="assessment-premium-toolbar">
          <div className="assessment-premium-search">
            <Search size={19} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assessment by title..."
              aria-label="Search assessment by title"
            />
            {search && (
              <button
                type="button"
                className="assessment-premium-clear-search"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => void fetchAssessments()}
            disabled={loading}
            className="assessment-premium-secondary-action"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </section>

        {loading ? (
          <div className="assessment-premium-card-grid">
            {[1, 2, 3].map((item) => (
              <div className="assessment-premium-skeleton" key={item}>
                <div />
                <div />
                <div />
                <div />
              </div>
            ))}
          </div>
        ) : filteredAssessments.length === 0 ? (
          <section className="assessment-premium-empty">
            <div className="assessment-premium-empty-icon">
              <Search size={22} />
            </div>
            <h2>No assessments found</h2>
            <p>
              {search
                ? "Try another search term."
                : "Create your first assessment to get started."}
            </p>
            {!search && (
              <button
                type="button"
                onClick={() => setOpenCreateModal(true)}
                className="assessment-premium-primary-action assessment-premium-empty-action"
              >
                <Plus size={18} /> Create Assessment
              </button>
            )}
          </section>
        ) : (
          <>
            <div className="assessment-premium-result-line">
              <span>
                {filteredAssessments.length}{" "}
                {filteredAssessments.length === 1
                  ? "assessment"
                  : "assessments"}
              </span>
              {search && <span>Filtered results</span>}
            </div>

            <div className="assessment-premium-card-grid">
              {filteredAssessments.map((assessment) => (
                <AssessmentCard
                  key={assessment.id}
                  assessment={assessment}
                  onDashboard={setSelectedAssessment}
                  onEdit={(item) => {
                    setEditingAssessment(item);
                    setOpenEditModal(true);
                  }}
                  onDuplicate={handleDuplicate}
                  onPublish={handlePublish}
                  onUnpublish={handleUnpublish}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {selectedAssessment && (
              <AssessmentWorkspace
                assessment={selectedAssessment}
                onClose={() => setSelectedAssessment(null)}
              />
            )}
          </>
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
    </div>
  );
}
