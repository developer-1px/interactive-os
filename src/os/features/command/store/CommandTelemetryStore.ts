/**
 * CommandTelemetryStore - Global Zustand Store for Command Telemetry
 *
 * Provides OS-level visibility into ALL dispatched commands (App + OS).
 * Used by the Inspector's EventStream for high-fidelity debugging.
 */

import { create } from "zustand";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface TelemetryEntry {
  id: number;
  command: string;
  payload: any;
  source: "app" | "os";
  timestamp: number;
}

interface CommandTelemetryState {
  entries: TelemetryEntry[];
  counter: number;

  // Actions
  logCommand: (command: string, payload: any, source: "app" | "os") => void;
  clear: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════

const MAX_ENTRIES = 50;

// ═══════════════════════════════════════════════════════════════════
// Store Instance
// ═══════════════════════════════════════════════════════════════════

export const useCommandTelemetryStore = create<CommandTelemetryState>(
  (set, get) => ({
    entries: [],
    counter: 0,

    logCommand: (command, payload, source) => {
      const { entries, counter } = get();
      const newEntry: TelemetryEntry = {
        id: counter + 1,
        command,
        payload,
        source,
        timestamp: Date.now(),
      };

      const newEntries = [...entries, newEntry];
      if (newEntries.length > MAX_ENTRIES) {
        newEntries.shift();
      }

      set({ entries: newEntries, counter: counter + 1 });
    },

    clear: () => set({ entries: [], counter: 0 }),
  }),
);

// ═══════════════════════════════════════════════════════════════════
// Static Accessors
// ═══════════════════════════════════════════════════════════════════

export const CommandTelemetryStore = {
  get: () => useCommandTelemetryStore.getState(),
  log: (command: string, payload: any, source: "app" | "os") => {
    useCommandTelemetryStore.getState().logCommand(command, payload, source);
  },
};
