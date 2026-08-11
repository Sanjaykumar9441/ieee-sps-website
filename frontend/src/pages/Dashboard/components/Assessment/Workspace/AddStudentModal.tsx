import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

import { addAllowedStudent } from "../../Assessment/assessmentApi";

interface Props {
  open: boolean;
  assessmentId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddStudentModal({
  open,
  assessmentId,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [email, setEmail] = useState("");
  const [branch, setBranch] = useState("");

  useEffect(() => {
    if (!open) return;

    setName("");
    setRollNo("");
    setEmail("");
    setBranch("");
    setLoading(false);
  }, [open]);

  const handleSubmit = async () => {
    const cleanName = name.trim();
    const cleanRollNo = rollNo.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanBranch = branch.trim();

    if (!cleanName) {
      toast.error("Student name is required.");
      return;
    }

    if (!cleanRollNo) {
      toast.error("Roll number is required.");
      return;
    }

    if (!cleanEmail) {
      toast.error("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const data = await addAllowedStudent({
        assessmentId,
        name: cleanName,
        rollNo: cleanRollNo,
        email: cleanEmail,
        branch: cleanBranch || null,
      });

      toast.success(data.message || "Student added successfully.");

      await onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Add student error:", err);

      const message = err?.response?.data?.message || "Unable to add student.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}

        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-bold">Add Student</h2>

            <p className="mt-1 text-sm text-gray-500">
              Allow a student to take this assessment.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 transition hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}

        <div className="space-y-5 p-6">
          {/* Name */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Student Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              maxLength={150}
              className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-[#00629B]"
            />
          </div>

          {/* Roll Number */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Roll Number
            </label>

            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="Enter roll number"
              maxLength={50}
              className="w-full rounded-xl border px-4 py-3 uppercase outline-none transition focus:border-[#00629B]"
            />
          </div>

          {/* Email */}

          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              maxLength={200}
              className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-[#00629B]"
            />
          </div>

          {/* Branch */}

          <div>
            <label className="mb-2 block text-sm font-medium">Branch</label>

            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="e.g. ECE"
              maxLength={100}
              className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-[#00629B]"
            />
          </div>
        </div>

        {/* Footer */}

        <div className="flex justify-end gap-3 border-t px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border px-5 py-3 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-[#00629B] px-5 py-3 text-white transition hover:bg-[#005080] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Student"}
          </button>
        </div>
      </div>
    </div>
  );
}
