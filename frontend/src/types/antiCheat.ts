export type InfractionType =
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "FULLSCREEN_EXIT"
  | "COPY"
  | "PASTE"
  | "RIGHT_CLICK"
  | "DEVTOOLS"
  | "REFRESH"
  | "NETWORK_DISCONNECT";

export interface AntiCheatPayload {
  type: InfractionType;
  metadata?: Record<string, any>;
}