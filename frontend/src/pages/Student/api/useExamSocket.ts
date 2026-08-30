import { useEffect, useState } from "react";
import { socket } from "../../../lib/socket";
import { getAssessmentStatus } from "../api/studenExamApi";

interface UseExamSocketProps {
  attemptId: string;
  assessmentId: string;
  enabled?: boolean;
  onResync?: (data: any) => void;
  onConnectionLost?: () => void;
  onReconnected?: () => void;
}

export default function useExamSocket({ attemptId, assessmentId, enabled = true, onResync, onConnectionLost, onReconnected }: UseExamSocketProps) {
  const [connected, setConnected] = useState(socket.connected);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);

  const syncAttempt = async () => {
    if (!attemptId) return;
    try {
      const data = await getAssessmentStatus(attemptId);
      if (data?.success) onResync?.(data);
    } catch (error) { console.error("[EXAM SOCKET] Failed to synchronize attempt:", error); }
  };

  useEffect(() => {
    if (!enabled || !attemptId || !assessmentId) return;

    const joinRooms = () => {
      // The backend broadcasts force-submit/status events to the assessment room.
      // Join both rooms so the student's exam receives admin actions immediately.
      socket.emit("joinAssessmentRoom", assessmentId);
      socket.emit("joinAttemptRoom", attemptId);
    };

    const handleConnect = async () => {
      setConnected(true);
      setReconnecting(false);
      joinRooms();
      await syncAttempt();
    };

    const handleDisconnect = (reason: string) => {
      console.warn("[EXAM SOCKET] Disconnected:", reason);
      setConnected(false);
      setReconnecting(true);
      onConnectionLost?.();
    };

    const handleReconnectAttempt = () => setReconnecting(true);

    const handleReconnect = async () => {
      setConnected(true);
      setReconnecting(false);
      setReconnectCount(v => v + 1);
      joinRooms();
      await syncAttempt();
      onReconnected?.();
    };

    const handleReconnectError = (error: Error) => console.warn("[EXAM SOCKET] Reconnect error:", error.message);
    const handleReconnectFailed = () => setReconnecting(false);

    // Admin force-submit emits this event to assessment-<assessmentId>.
    // The student's socket is now actually in that room, so the server state
    // is synchronized immediately and StudentExam can unmount its timer.
    const handleForceSubmitted = (data: any) => {
      const id = data?.id || data?.attemptId || data?.attempt_id;
      if (id && String(id) !== String(attemptId)) return;

      if (["SUBMITTED", "DISQUALIFIED", "EXPIRED"].includes(data?.status)) {
        onResync?.({
          success: true,
          ...data,
          status: data.status,
        });
        return;
      }

      void syncAttempt();
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("forceSubmitted", handleForceSubmitted);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    socket.io.on("reconnect", handleReconnect);
    socket.io.on("reconnect_error", handleReconnectError);
    socket.io.on("reconnect_failed", handleReconnectFailed);

    if (socket.connected) {
      void handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("forceSubmitted", handleForceSubmitted);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.io.off("reconnect", handleReconnect);
      socket.io.off("reconnect_error", handleReconnectError);
      socket.io.off("reconnect_failed", handleReconnectFailed);
    };
  }, [attemptId, assessmentId, enabled]);

  return { connected, reconnecting, reconnectCount, syncAttempt };
}
