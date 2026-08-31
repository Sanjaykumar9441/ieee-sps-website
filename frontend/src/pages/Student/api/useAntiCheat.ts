import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export type InfractionType =
  | "FULLSCREEN_EXIT"
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "COPY_ATTEMPT"
  | "PASTE_ATTEMPT"
  | "CUT_ATTEMPT"
  | "CONTEXT_MENU"
  | "KEYBOARD_SHORTCUT";

interface UseAntiCheatProps {
  attemptId: string | null;
  enabled?: boolean;
  observeBrowserEvents?: boolean;
  onAutoSubmit?: (
    reason: string,
  ) => void;
}

interface InfractionResponse {
  success: boolean;
  count?: number;
  totalInfractions?: number;
  maxInfractions?: number;
  autoSubmitted?: boolean;
  status?: string;
  message?: string;
}

const MAX_INFRACTIONS = 5;

const getToken = () =>
  localStorage.getItem("studentToken") ||
  localStorage.getItem("token") ||
  "";

const getSessionHeaders = (
  attemptId: string,
) => ({
  Authorization: `Bearer ${getToken()}`,
  "x-assessment-session":
    sessionStorage.getItem(
      `quiz_session_${attemptId}`,
    ) ||
    localStorage.getItem(
      `quiz_session_${attemptId}`,
    ) ||
    "",
});

export default function useAntiCheat({
  attemptId,
  enabled = true,
  observeBrowserEvents = true,
  onAutoSubmit,
}: UseAntiCheatProps) {
  const [
    infractionCount,
    setInfractionCount,
  ] = useState(0);

  const [
    warning,
    setWarning,
  ] = useState<string | null>(null);

  const autoSubmitRef =
    useRef(false);

  const lastReportedRef =
    useRef<Record<string, number>>({});

  const loadInfractions =
    useCallback(async () => {
      if (!attemptId || !enabled) {
        return;
      }

      try {
        const { data } =
          await axios.get(
            `${API}/api/student-assessments/${attemptId}/infractions`,
            {
              headers:
                getSessionHeaders(
                  attemptId,
                ),
            },
          );

        const count = Number(
          data?.count ??
            data?.totalInfractions ??
            data?.infractions
              ?.length ??
            0,
        );

        setInfractionCount(
          Math.max(0, count),
        );
      } catch (error) {
        console.error(
          "[ANTI-CHEAT] Failed to load infractions",
          error,
        );
      }
    }, [attemptId, enabled]);

  const reportInfraction =
    useCallback(
      async (
        type: InfractionType,
      ) => {
        if (
          !attemptId ||
          !enabled ||
          autoSubmitRef.current
        ) {
          return;
        }

        const now = Date.now();

        const lastReported =
          lastReportedRef.current[
            type
          ] || 0;

        /*
         * Prevent duplicate blur/visibility/fullscreen
         * events from being counted multiple times.
         */
        if (
          now - lastReported <
          2000
        ) {
          return;
        }

        lastReportedRef.current[
          type
        ] = now;

        try {
          const { data } =
            await axios.post<InfractionResponse>(
              `${API}/api/student-assessments/${attemptId}/infractions`,
              {
                type,
                metadata: {
                  timestamp:
                    new Date().toISOString(),
                  page:
                    window.location.pathname,
                },
              },
              {
                headers:
                  getSessionHeaders(
                    attemptId,
                  ),
              },
            );

          const serverCount =
            data?.totalInfractions ??
            data?.count;

          const count = Number(
            serverCount ??
              infractionCount + 1,
          );

          setInfractionCount(
            Math.max(0, count),
          );

          if (
            data?.autoSubmitted ||
            data?.status === "SUBMITTED"
          ) {
            autoSubmitRef.current =
              true;

            setWarning(null);

            onAutoSubmit?.(type);

            return;
          }

          if (
            count >=
            MAX_INFRACTIONS
          ) {
            /*
             * Defensive fallback. The backend should already
             * have auto-submitted at this point.
             */
            autoSubmitRef.current =
              true;

            setWarning(null);

            onAutoSubmit?.(type);

            return;
          }

          if (
            count ===
            MAX_INFRACTIONS - 1
          ) {
            setWarning(
              `Final warning: violation ${count} of ${MAX_INFRACTIONS}. One more violation will automatically submit your assessment.`,
            );
          } else {
            setWarning(
              `Warning: suspicious activity detected. Violation ${count} of ${MAX_INFRACTIONS}.`,
            );
          }
        } catch (error: any) {
          console.error(
            `[ANTI-CHEAT] Failed to report ${type}`,
            error,
          );

          /*
           * If the server says the attempt was already submitted,
           * stop generating more anti-cheat requests.
           */
          if (
            error?.response?.status ===
              400 &&
            /already submitted/i.test(
              String(
                error?.response?.data
                  ?.message || "",
              ),
            )
          ) {
            autoSubmitRef.current =
              true;

            setWarning(null);

            onAutoSubmit?.(
              "ALREADY_SUBMITTED",
            );
          }
        }
      },
      [
        attemptId,
        enabled,
        infractionCount,
        onAutoSubmit,
      ],
    );

  useEffect(() => {
    void loadInfractions();
  }, [loadInfractions]);

  useEffect(() => {
    if (
      !attemptId ||
      !enabled ||
      !observeBrowserEvents
    ) {
      return;
    }

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "hidden"
        ) {
          void reportInfraction(
            "TAB_SWITCH",
          );
        }
      };

    const handleBlur = () => {
      void reportInfraction(
        "WINDOW_BLUR",
      );
    };

    const handleFullscreenChange =
      () => {
        if (
          !document.fullscreenElement
        ) {
          void reportInfraction(
            "FULLSCREEN_EXIT",
          );
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    window.addEventListener(
      "blur",
      handleBlur,
    );

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange,
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      window.removeEventListener(
        "blur",
        handleBlur,
      );

      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );
    };
  }, [
    attemptId,
    enabled,
    observeBrowserEvents,
    reportInfraction,
  ]);

  const dismissWarning = () =>
    setWarning(null);

  return {
    infractionCount,
    maxInfractions:
      MAX_INFRACTIONS,
    warning,
    dismissWarning,
    reportInfraction,
    refreshInfractions:
      loadInfractions,
  };
}
