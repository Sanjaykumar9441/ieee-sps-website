import { useEffect, useRef, useState } from "react";

import { reportInfraction, getAntiCheatConfig } from "../services/antiCheatApi";

import { InfractionType } from "../types/antiCheat";

interface UseAntiCheatOptions {
  attemptId: string;
  enabled?: boolean;
}

export default function useAntiCheat({
  attemptId,
  enabled = true,
}: UseAntiCheatOptions) {
  /*
  ============================================================
  STATE
  ============================================================
  */

  const [maxInfractions, setMaxInfractions] = useState(5);

  const [connected, setConnected] = useState(navigator.onLine);

  const lastReported = useRef<Record<string, number>>({});

  /*
  ============================================================
  LOAD CONFIG
  ============================================================
  */

  useEffect(() => {
    if (!enabled) return;

    async function loadConfig() {
      try {
        const config = await getAntiCheatConfig();

        setMaxInfractions(config.MAX_INFRACTIONS);
      } catch (err) {
        console.error("Failed to load anti-cheat config", err);
      }
    }

    loadConfig();
  }, [enabled]);

  /*
  ============================================================
  REPORT
  ============================================================
  */

  async function send(
    type: InfractionType,
    metadata: Record<string, any> = {},
  ) {
    if (!enabled) return;

    const now = Date.now();

    /*
    Prevent duplicate reports within 2 seconds
    */

    if (lastReported.current[type] && now - lastReported.current[type] < 2000) {
      return;
    }

    lastReported.current[type] = now;

    try {
      await reportInfraction(attemptId, {
        type,

        metadata,
      });
    } catch (err) {
      console.error(err);
    }
  }
  /*
  ============================================================
  TAB SWITCH
  ============================================================
  */

  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (document.hidden) {
        send("TAB_SWITCH", {
          timestamp: new Date().toISOString(),
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled]);

  /*
  ============================================================
  WINDOW BLUR
  ============================================================
  */

  useEffect(() => {
    if (!enabled) return;

    const handleBlur = () => {
      send("WINDOW_BLUR", {
        timestamp: new Date().toISOString(),
      });
    };

    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, [enabled]);

  /*
  ============================================================
  FULLSCREEN EXIT
  ============================================================
  */

  useEffect(() => {
    if (!enabled) return;

    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        send("FULLSCREEN_EXIT", {
          timestamp: new Date().toISOString(),
        });
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreen);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, [enabled]);

  /*
============================================================
COPY DETECTION
============================================================
*/

  useEffect(() => {
    if (!enabled) return;

    const handleCopy = (event: ClipboardEvent) => {
      event.preventDefault();

      send("COPY", {
        timestamp: new Date().toISOString(),
      });
    };

    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("copy", handleCopy);
    };
  }, [enabled]);

  /*
============================================================
PASTE DETECTION
============================================================
*/

  useEffect(() => {
    if (!enabled) return;

    const handlePaste = (event: ClipboardEvent) => {
      event.preventDefault();

      send("PASTE", {
        timestamp: new Date().toISOString(),
      });
    };

    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [enabled]);

  /*
============================================================
RIGHT CLICK
============================================================
*/

  useEffect(() => {
    if (!enabled) return;

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();

      send("RIGHT_CLICK", {
        x: event.clientX,
        y: event.clientY,
        timestamp: new Date().toISOString(),
      });
    };

    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [enabled]);

  /*
============================================================
REFRESH / CLOSE TAB
============================================================
*/

  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      send("REFRESH", {
        timestamp: new Date().toISOString(),
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled]);

  /*
============================================================
NETWORK STATUS
============================================================
*/

  useEffect(() => {
    if (!enabled) return;

    const handleOffline = () => {
      setConnected(false);

      send("NETWORK_DISCONNECT", {
        timestamp: new Date().toISOString(),
      });
    };

    const handleOnline = () => {
      setConnected(true);
    };

    window.addEventListener("offline", handleOffline);

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);

      window.removeEventListener("online", handleOnline);
    };
  }, [enabled]);

  /*
============================================================
KEYBOARD SHORTCUTS
============================================================
*/

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      /*
      F12
    */

      if (event.key === "F12") {
        event.preventDefault();

        send("DEVTOOLS", {
          shortcut: "F12",
        });

        return;
      }

      /*
      Ctrl+Shift+I
    */

      if (event.ctrlKey && event.shiftKey && key === "i") {
        event.preventDefault();

        send("DEVTOOLS", {
          shortcut: "CTRL_SHIFT_I",
        });

        return;
      }

      /*
      Ctrl+Shift+J
    */

      if (event.ctrlKey && event.shiftKey && key === "j") {
        event.preventDefault();

        send("DEVTOOLS", {
          shortcut: "CTRL_SHIFT_J",
        });

        return;
      }

      /*
      Ctrl+Shift+C
    */

      if (event.ctrlKey && event.shiftKey && key === "c") {
        event.preventDefault();

        send("DEVTOOLS", {
          shortcut: "CTRL_SHIFT_C",
        });

        return;
      }

      /*
      Ctrl+U
    */

      if (event.ctrlKey && key === "u") {
        event.preventDefault();

        send("DEVTOOLS", {
          shortcut: "CTRL_U",
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled]);

  /*
============================================================
BEST-EFFORT DEVTOOLS DETECTION
============================================================
*/

  useEffect(() => {
    if (!enabled) return;

    let reported = false;

    const interval = window.setInterval(() => {
      const widthDiff = window.outerWidth - window.innerWidth;

      const heightDiff = window.outerHeight - window.innerHeight;

      const opened = widthDiff > 160 || heightDiff > 160;

      if (opened && !reported) {
        reported = true;

        send("DEVTOOLS", {
          method: "window-size",
        });
      }

      if (!opened) {
        reported = false;
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [enabled]);

  /*
============================================================
MANUAL REPORT
============================================================
*/

  const report = async (
    type: InfractionType,
    metadata: Record<string, any> = {},
  ) => {
    await send(type, metadata);
  };

  /*
============================================================
RESET THROTTLE
============================================================
*/

  const resetThrottle = () => {
    lastReported.current = {};
  };

  /*
============================================================
PUBLIC API
============================================================
*/

  return {
    connected,

    maxInfractions,

    report,

    resetThrottle,
  };
}
