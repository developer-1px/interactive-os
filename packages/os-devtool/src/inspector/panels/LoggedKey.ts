import { useSyncExternalStore } from "react";

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
}

// ─── Vanilla Store ───

let state: InputTelemetryState = { logs: [] };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot() {
  return state;
}

function logKey(
  e: React.KeyboardEvent | KeyboardEvent,
  zoneId: string,
  handled: boolean,
) {
  const el = e.target as HTMLElement;
  const elementId =
    el.getAttribute("data-id") ||
    el.getAttribute("data-zone-id") ||
    el.id ||
    undefined;
  state = {
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
  };
  emit();
}

// ─── React Hook ───

export function useInputTelemetry<T>(
  selector: (s: InputTelemetryState) => T,
): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getSnapshot()),
  );
}

// ─── Static API ───

useInputTelemetry.logKey = logKey;
