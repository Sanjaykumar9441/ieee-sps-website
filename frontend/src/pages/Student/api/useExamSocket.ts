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

export default function useExamSocket({
  attemptId,
  assessmentId,
  enabled = true,
  onResync,
  onConnectionLost,
  onReconnected,
}: UseExamSocketProps) {
  const [connected, setConnected] = useState(socket.connected);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);

  const syncAttempt = async () => {
    if (!attemptId) return;

    try {
      console.log("[EXAM SOCKET] Synchronizing attempt...");

      const data = await getAssessmentStatus(attemptId);

      console.log(
        "[EXAM SOCKET] Attempt synchronized:",
        data,
      );

      if (!data?.success) {
        console.warn(
          "[EXAM SOCKET] Status synchronization failed:",
          data?.message,
        );

        return;
      }

      onResync?.(data);
    } catch (error) {
      console.error(
        "[EXAM SOCKET] Failed to synchronize attempt:",
        error,
      );
    }
  };

  useEffect(() => {
    if (!enabled || !attemptId || !assessmentId) {
      return;
    }

    const handleConnect = async () => {
      console.log(
        "[EXAM SOCKET] Connected:",
        socket.id,
      );

      const wasReconnecting = reconnecting;

      setConnected(true);
      setReconnecting(false);

      /*
       * IMPORTANT:
       * Always synchronize after connecting.
       *
       * This covers:
       * - initial connection
       * - reconnect
       * - page/component mounting
       */
      await syncAttempt();

      if (wasReconnecting) {
        setReconnectCount(
          (value) => value + 1,
        );

        onReconnected?.();
      }
    };

    const handleDisconnect = (reason: string) => {
      console.warn(
        "[EXAM SOCKET] Disconnected:",
        reason,
      );

      setConnected(false);
      setReconnecting(true);

      onConnectionLost?.();
    };

    const handleReconnectAttempt = (
      attempt: number,
    ) => {
      console.log(
        "[EXAM SOCKET] Reconnect attempt:",
        attempt,
      );

      setReconnecting(true);
    };

    const handleReconnect = async (
      attempt: number,
    ) => {
      console.log(
        "[EXAM SOCKET] Reconnected after:",
        attempt,
        "attempt(s)",
      );

      setConnected(true);
      setReconnecting(false);

      setReconnectCount(
        (value) => value + 1,
      );

      /*
       * Critical:
       * Get authoritative server state.
       */
      await syncAttempt();

      onReconnected?.();
    };

    const handleReconnectError = (
      error: Error,
    ) => {
      console.warn(
        "[EXAM SOCKET] Reconnect error:",
        error.message,
      );
    };

    const handleReconnectFailed = () => {
      console.error(
        "[EXAM SOCKET] Reconnection failed.",
      );

      setReconnecting(false);
    };

    socket.on(
      "connect",
      handleConnect,
    );

    socket.on(
      "disconnect",
      handleDisconnect,
    );

    socket.io.on(
      "reconnect_attempt",
      handleReconnectAttempt,
    );

    socket.io.on(
      "reconnect",
      handleReconnect,
    );

    socket.io.on(
      "reconnect_error",
      handleReconnectError,
    );

    socket.io.on(
      "reconnect_failed",
      handleReconnectFailed,
    );

    /*
     * Shared socket may already be connected.
     */
    if (socket.connected) {
      void handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off(
        "connect",
        handleConnect,
      );

      socket.off(
        "disconnect",
        handleDisconnect,
      );

      socket.io.off(
        "reconnect_attempt",
        handleReconnectAttempt,
      );

      socket.io.off(
        "reconnect",
        handleReconnect,
      );

      socket.io.off(
        "reconnect_error",
        handleReconnectError,
      );

      socket.io.off(
        "reconnect_failed",
        handleReconnectFailed,
      );

      /*
       * DO NOT call socket.disconnect().
       *
       * socket.ts owns the shared connection.
       */
    };
  }, [
    attemptId,
    assessmentId,
    enabled,
  ]);

  return {
    connected,
    reconnecting,
    reconnectCount,
    syncAttempt,
  };
}