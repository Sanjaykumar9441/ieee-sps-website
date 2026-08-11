import {
  Clock,
  FileText,
  Users,
  Activity,
  Edit,
  Copy,
  Trash2,
  Archive,
  LayoutDashboard,
  Rocket,
} from "lucide-react";

export interface Assessment {
  id: string;

  title: string;

  category?: string;

  total_questions: number;

  duration_minutes: number;

  is_active: boolean;

  is_published: boolean;

  created_at: string;

  passPercentage?: number;
}

interface Props {
  assessment: Assessment;

  onDashboard: (assessment: Assessment) => void;

  onEdit: (assessment: Assessment) => void;

  onDuplicate: (id: string) => void;

  onPublish: (id: string) => void;

  onUnpublish: (id: string) => void;

  onArchive: (id: string) => void;

  onDelete: (id: string) => void;
}

export default function AssessmentCard({
  assessment,

  onDashboard,

  onEdit,

  onDuplicate,

  onPublish,

  onUnpublish,

  onArchive,

  onDelete,
}: Props) {
  const durationMinutes = assessment.duration_minutes;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="p-6">
        {/* Header */}

        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{assessment.title}</h2>

            <p className="text-sm text-gray-500 mt-1">
              {assessment.category || "General"}
            </p>
          </div>

          <div className="flex gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                assessment.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {assessment.is_active ? "Active" : "Inactive"}
            </span>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                assessment.is_published
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {assessment.is_published ? "Published" : "Draft"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="flex items-center gap-3">
            <FileText size={18} />

            <div>
              <p className="text-xs text-gray-500">Questions</p>

              <p className="font-semibold">{assessment.total_questions}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock size={18} />

            <div>
              <p className="text-xs text-gray-500">Duration</p>

              <p className="font-semibold">{durationMinutes} mins</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Activity size={18} />

            <div>
              <p className="text-xs text-gray-500">Status</p>

              <p className="font-semibold">
                {assessment.is_active ? "Running" : "Stopped"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Users size={18} />

            <div>
              <p className="text-xs text-gray-500">Created</p>

              <p className="font-semibold text-sm">
                {new Date(assessment.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-8">
          <button
            onClick={() => onDashboard(assessment)}
            className="rounded-xl bg-[#00629B] text-white py-2 flex items-center justify-center gap-2"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button
            onClick={() => onEdit(assessment)}
            className="rounded-xl border py-2 flex items-center justify-center gap-2"
          >
            <Edit size={18} />
            Edit
          </button>

          <button
            onClick={() => onDuplicate(assessment.id)}
            className="rounded-xl border py-2 flex items-center justify-center gap-2"
          >
            <Copy size={18} />
            Duplicate
          </button>

          {assessment.is_published ? (
            <button
              onClick={() => onUnpublish(assessment.id)}
              className="rounded-xl border border-orange-300 text-orange-600 py-2 flex items-center justify-center gap-2 hover:bg-orange-50"
            >
              <Rocket size={18} />
              Unpublish
            </button>
          ) : (
            <button
              onClick={() => onPublish(assessment.id)}
              className="rounded-xl border py-2 flex items-center justify-center gap-2 hover:bg-gray-50"
            >
              <Rocket size={18} />
              Publish
            </button>
          )}

          <button
            onClick={() => onArchive(assessment.id)}
            className="rounded-xl border py-2 flex items-center justify-center gap-2"
          >
            <Archive size={18} />
            Archive
          </button>

          <button
            onClick={() => onDelete(assessment.id)}
            className="rounded-xl border border-red-300 text-red-600 py-2 flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
