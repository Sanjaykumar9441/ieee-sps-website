import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X } from "lucide-react";

import { LeaderboardStudent } from "./Leaderboard";
import { socket } from "../../../../../lib/socket";

const API = import.meta.env.VITE_API_URL;

interface Props {
  open: boolean;

  student: LeaderboardStudent | null;

  assessmentId: string;

  onClose: () => void;
}

interface LeaderboardDetails {
  student: LeaderboardStudent;
}

export default function LeaderboardStudentDrawer({
  open,
  student,
  assessmentId,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [details, setDetails] = useState<LeaderboardDetails | null>(null);

  const fetchDetails = async () => {
    if (!student) return;

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const { data } = await axios.get(
        `${API}/api/leaderboard/details/${student.studentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            assessmentId,
          },
        },
      );

      setDetails(data);
    } catch (err) {
      console.error(err);

      setDetails((prev) => {
        if (!prev) {
          toast.error("Unable to load student details.");
        }
        return prev;
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !student) {
      setDetails(null);
      return;
    }

    void fetchDetails();

    socket.emit("joinAssessmentRoom", assessmentId);

    const refresh = () => {
      void fetchDetails();
    };

    socket.on("leaderboardUpdated", refresh);

    return () => {
      socket.off("leaderboardUpdated", refresh);
    };
  }, [open, assessmentId, student]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !student) return null;

  const rank = details?.student.rank ?? 0;

  const medal =
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🏅";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}

        <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold">Leaderboard Details</h2>

            <p className="mt-1 text-sm text-gray-500">
              Student Performance Summary
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-gray-100"
          >
            <X size={22} />
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center">Loading...</div>
        ) : (
          <div className="space-y-8 p-6">
            {/* Rank */}

            <div className="rounded-2xl border bg-gradient-to-r from-[#00629B] to-[#007FC7] p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Current Rank</p>

                  <h2 className="mt-2 text-4xl font-bold">
                    {medal} Rank #{details?.student.rank}
                  </h2>
                </div>

                <div className="text-6xl">🏆</div>
              </div>
            </div>

            {/* Student */}

            <div className="rounded-2xl border p-6">
              <h3 className="mb-5 text-lg font-bold">Student Information</h3>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Name</p>

                  <p className="font-semibold">{details?.student.name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Roll Number</p>

                  <p className="font-semibold">{details?.student.rollNo}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Department</p>

                  <p className="font-semibold">{details?.student.department}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Score</p>

                  <p className="font-semibold text-[#00629B]">
                    {details?.student.score ?? "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Performance */}

            <div className="rounded-2xl border p-6">
              <h3 className="mb-5 text-lg font-bold">Performance</h3>

              <div className="grid grid-cols-2 gap-5">
                <div className="rounded-xl bg-green-50 p-4">
                  <p className="text-sm text-gray-500">Percentage</p>

                  <h2 className="mt-2 text-2xl font-bold text-green-600">
                    {details?.student.percentage ?? 0}%
                  </h2>
                </div>

                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-sm text-gray-500">Correct</p>

                  <h2 className="mt-2 text-2xl font-bold text-blue-600">
                    {details?.student.correct ?? "-"}
                  </h2>
                </div>

                <div className="rounded-xl bg-red-50 p-4">
                  <p className="text-sm text-gray-500">Wrong</p>

                  <h2 className="mt-2 text-2xl font-bold text-red-600">
                    {details?.student.wrong ?? "-"}
                  </h2>
                </div>

                <div className="rounded-xl bg-yellow-50 p-4">
                  <p className="text-sm text-gray-500">Unanswered</p>

                  <h2 className="mt-2 text-2xl font-bold text-yellow-600">
                    {details?.student.unanswered ?? "-"}
                  </h2>
                </div>
              </div>
            </div>
            {/* Assessment Summary */}

            <div className="rounded-2xl border p-6">
              <h3 className="mb-5 text-lg font-bold">Assessment Summary</h3>

              <div className="grid grid-cols-2 gap-5">
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-sm text-gray-500">Score</p>

                  <h2 className="mt-2 text-2xl font-bold text-blue-600">
                    {details?.student.score ?? "-"}
                  </h2>
                </div>

                <div className="rounded-xl bg-green-50 p-4">
                  <p className="text-sm text-gray-500">Accuracy</p>

                  <h2 className="mt-2 text-2xl font-bold text-green-600">
                    {details?.student.percentage ?? 0}%
                  </h2>
                </div>

                <div className="rounded-xl bg-purple-50 p-4">
                  <p className="text-sm text-gray-500">Time Taken</p>

                  <h2 className="mt-2 text-xl font-bold">
                    {Math.floor((details?.student.timeTaken || 0) / 60)}m{" "}
                    {(details?.student.timeTaken || 0) % 60}s
                  </h2>
                </div>

                <div className="rounded-xl bg-orange-50 p-4">
                  <p className="text-sm text-gray-500">Submitted</p>

                  <h2 className="mt-2 text-sm font-semibold">
                    {details?.student.submittedAt
                      ? new Date(details?.student.submittedAt).toLocaleString()
                      : "-"}
                  </h2>
                </div>
              </div>
            </div>
            {/* Footer */}

            <div className="sticky bottom-0 flex justify-end border-t bg-white pt-6">
              <button
                onClick={onClose}
                className="rounded-xl bg-[#00629B] px-6 py-3 text-white transition hover:bg-[#004d78]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
