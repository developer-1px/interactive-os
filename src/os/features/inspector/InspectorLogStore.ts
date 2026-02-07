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
    inputSource?: "keyboard" | "mouse";
    source?: string;
}

interface InspectorLogState {
    logs: LogEntry[];
    nextId: number;
    inputCount: number;
    commandCount: number;
    stateCount: number;
    pageNumber: number;

    /** ID of the last INPUT log */
    lastInputId: number | null;
    /** True when we're in a command transaction (first COMMAND logged, waiting for STATE) */
    inTransaction: boolean;
    /** ID of the INPUT that started the current transaction (first COMMAND's Input) */
    transactionStartInputId: number | null;
    /** ID of the INPUT log to scroll to (set when STATE is logged) */
    scrollTargetId: number | null;
    /** Increments when STATE is logged — EventStream watches this to scroll */
    scrollTrigger: number;

    // Actions
    addLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
    clear: () => void;
}

const MAX_LOGS = 100;

export const useInspectorLogStore = create<InspectorLogState>((set) => ({
    logs: [],
    nextId: 1,
    inputCount: 0,
    commandCount: 0,
    stateCount: 0,
    pageNumber: 1,
    lastInputId: null,
    inTransaction: false,
    transactionStartInputId: null,
    scrollTargetId: null,
    scrollTrigger: 0,

    addLog: (entry) =>
        set((state) => {
            const newEntry: LogEntry = {
                ...entry,
                id: state.nextId,
                timestamp: Date.now(),
            };

            let newInputCount = state.inputCount;
            let newCommandCount = state.commandCount;
            let newStateCount = state.stateCount;
            let newPageNumber = state.pageNumber;
            let newLogs = [newEntry, ...state.logs];
            let newLastInputId = state.lastInputId;
            let newInTransaction = state.inTransaction;
            let newTransactionStartInputId = state.transactionStartInputId;
            let newScrollTargetId = state.scrollTargetId;
            let newScrollTrigger = state.scrollTrigger;

            if (entry.type === "INPUT") {
                newInputCount++;
                // Remember this INPUT's ID
                newLastInputId = newEntry.id;
                if (newInputCount > 100) {
                    // Reset logs for new page
                    newLogs = [newEntry];
                    newInputCount = 1;
                    newPageNumber++;
                }
            } else if (entry.type === "COMMAND") {
                newCommandCount++;
                // If this is the FIRST command in a transaction, mark the start
                if (!newInTransaction) {
                    newInTransaction = true;
                    newTransactionStartInputId = newLastInputId;
                }
                // Subsequent commands are ignored (flag already set)
            } else if (entry.type === "STATE") {
                newStateCount++;
                // Trigger scroll to the INPUT that started this transaction
                newScrollTargetId = newTransactionStartInputId;
                newScrollTrigger++;
                // Reset transaction for next cycle
                newInTransaction = false;
                newTransactionStartInputId = null;
            } else {
                // Limit non-input triggered logs if we exceed MAX_LOGS in total backup
                if (newLogs.length > MAX_LOGS * 5) { // generous buffer
                    newLogs.pop();
                }
            }

            return {
                logs: newLogs,
                nextId: state.nextId + 1,
                inputCount: newInputCount,
                commandCount: newCommandCount,
                stateCount: newStateCount,
                pageNumber: newPageNumber,
                lastInputId: newLastInputId,
                inTransaction: newInTransaction,
                transactionStartInputId: newTransactionStartInputId,
                scrollTargetId: newScrollTargetId,
                scrollTrigger: newScrollTrigger,
            };
        }),

    clear: () => set({ logs: [], nextId: 1, inputCount: 0, commandCount: 0, stateCount: 0, pageNumber: 1, lastInputId: null, inTransaction: false, transactionStartInputId: null, scrollTargetId: null, scrollTrigger: 0 }),
}));

// Static Accessor for non-React contexts
export const InspectorLog = {
    log: (entry: Omit<LogEntry, "id" | "timestamp">) =>
        useInspectorLogStore.getState().addLog(entry),
    clear: () => useInspectorLogStore.getState().clear(),
};
