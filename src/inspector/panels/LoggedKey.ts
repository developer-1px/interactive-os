import { create } from "zustand";

export interface LoggedKey {
  key: string;
  code: string;
  zoneId: string;
  target: string;
  elementId?: string;
  timestamp: number;
  handled: boolean;
}

interface InputTelemetryState {
  logs: LoggedKey[];
  logKey: (
    e: React.KeyboardEvent | KeyboardEvent,
    zoneId: string,
    handled: boolean,
  ) => void;
}

export const useInputTelemetry = create<InputTelemetryState>((set) => ({
  logs: [],
  logKey: (e, zoneId, handled) => {
    const el = e.target as HTMLElement;
    const elementId =
      el.getAttribute("data-id") ||
      el.getAttribute("data-zone-id") ||
      el.id ||
      undefined;
    set((state) => ({
      logs: [
        {
          key: e.key,
          code: e.code,
          zoneId,
          target: el.tagName || "UNKNOWN",
          ...(elementId != null ? { elementId } : {}),
          timestamp: Date.now(),
          handled,
        },
        ...state.logs,
      ].slice(0, 20), // Keep last 20
    }));
  },
}));
