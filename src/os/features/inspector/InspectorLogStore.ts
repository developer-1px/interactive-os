/**
 * InspectorLogStore - Unified Event Stream for Inspector
 *
 * Records a chronological stream of:
 * - INPUT: Raw key events
 * - COMMAND: Dispatched commands
 * - STATE: State changes
 * - EFFECT: Side effects (optional)
 */

import { create } from "zustand";
import { type IconName } from "@/lib/Icon";

export type LogType = "INPUT" | "COMMAND" | "STATE" | "EFFECT";

export interface LogEntry {
    id: number;
    type: LogType;
    title: string;
    details?: any;
    timestamp: number;
    icon?: IconName;
    source?: string; // e.g., "app" | "os"
}

interface InspectorLogState {
    logs: LogEntry[];
    nextId: number;

    // Actions
    addLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
    clear: () => void;
}

const MAX_LOGS = 100;

export const useInspectorLogStore = create<InspectorLogState>((set) => ({
    logs: [],
    nextId: 1,

    addLog: (entry) =>
        set((state) => {
            const newEntry: LogEntry = {
                ...entry,
                id: state.nextId,
                timestamp: Date.now(),
            };

            const newLogs = [newEntry, ...state.logs];
            if (newLogs.length > MAX_LOGS) {
                newLogs.pop();
            }

            return {
                logs: newLogs,
                nextId: state.nextId + 1,
            };
        }),

    clear: () => set({ logs: [], nextId: 1 }),
}));

// Static Accessor for non-React contexts
export const InspectorLog = {
    log: (entry: Omit<LogEntry, "id" | "timestamp">) =>
        useInspectorLogStore.getState().addLog(entry),
    clear: () => useInspectorLogStore.getState().clear(),
};
