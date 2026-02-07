import { create } from "zustand";

export interface LoggedKey {
  key: string;
  code: string;
  zoneId: string;
  target: string;
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
  logKey: (e, zoneId, handled) =>
    set((state) => ({
      logs: [
        {
          key: e.key,
          code: e.code,
          zoneId,
          target: (e.target as HTMLElement).tagName || "UNKNOWN",
          timestamp: Date.now(),
          handled,
        },
        ...state.logs,
      ].slice(0, 20), // Keep last 20
    })),
}));
