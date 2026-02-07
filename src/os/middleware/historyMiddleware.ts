/**
 * OS History Middleware (Built-in)
 *
 * Automatically records undo/redo snapshots for any app state
 * that has a `history` field conforming to HistoryState.
 *
 * Features:
 * - Captures focusedItemId for focus restoration on undo
 * - Auto-filters OS passthrough commands (no-op in app state)
 * - Detects `log: false` commands via action._def
 * - data-change detection: only records when state.data changed
 */

import { OS_COMMANDS } from "@os/features/command/definitions/commandsShell";
import { FocusData } from "@os/features/focus/lib/focusData";
import { produce } from "immer";
import type { HistoryEntry, HistoryState } from "./types";

const HISTORY_LIMIT = 50;

interface WithHistory {
    history?: HistoryState;
    data?: any;
}

// OS commands that are no-op passthrough — never record
const OS_PASSTHROUGH: Set<string> = new Set([
    OS_COMMANDS.NAVIGATE,
    OS_COMMANDS.FOCUS,
    OS_COMMANDS.SELECT,
    OS_COMMANDS.SELECT_ALL,
    OS_COMMANDS.DESELECT_ALL,
    OS_COMMANDS.TAB,
    OS_COMMANDS.TAB_PREV,
    OS_COMMANDS.ACTIVATE,
    OS_COMMANDS.EXIT,
    OS_COMMANDS.RECOVER,
    OS_COMMANDS.DISMISS,
    OS_COMMANDS.TOGGLE_INSPECTOR,
    OS_COMMANDS.COPY,
    OS_COMMANDS.CUT,
    OS_COMMANDS.PASTE,
    OS_COMMANDS.TOGGLE,
    OS_COMMANDS.DELETE,
    OS_COMMANDS.UNDO,
    OS_COMMANDS.REDO,
]);

// App-level commands that manage history themselves
const HISTORY_SELF_MANAGED = new Set(["UNDO", "REDO"]);

export const historyMiddleware = <S extends WithHistory>(
    nextState: S,
    action: { type: string; payload?: any; _def?: { log?: boolean } },
    prevState: S,
): S => {
    // No history field = app doesn't use undo/redo
    if (!nextState.history && !prevState.history) return nextState;

    // Skip OS passthrough commands
    if (OS_PASSTHROUGH.has(action.type)) return nextState;

    // Skip self-managed history commands
    if (HISTORY_SELF_MANAGED.has(action.type)) return nextState;

    // Skip commands with log: false (SYNC_DRAFT, SYNC_EDIT_DRAFT, etc.)
    if (action._def?.log === false) return nextState;

    // Skip if data hasn't changed (pure UI state changes don't warrant undo)
    if (prevState.data !== undefined && prevState.data === nextState.data) {
        return nextState;
    }

    // Capture current focus for restoration on undo
    const activeZone = FocusData.getActiveZone();
    const focusedItemId =
        activeZone?.store?.getState().focusedItemId ?? null;

    return produce(nextState, (draft: any) => {
        if (!draft.history) {
            draft.history = { past: [], future: [] };
        }

        const entry: HistoryEntry = {
            command: { type: action.type, payload: action.payload },
            timestamp: Date.now(),
            snapshot: (({ history, ...rest }: any) => rest)(prevState),
            focusedItemId,
        };

        draft.history.past.push(entry);

        if (draft.history.past.length > HISTORY_LIMIT) {
            draft.history.past.shift();
        }

        // New action branch → clear redo future
        draft.history.future = [];
    }) as S;
};
