import { produce } from "immer";
import type { AppState, TodoCommand, HistoryEntry } from "@apps/todo/model/types";
import { OS_COMMANDS } from "@os/core/command/osCommands";

const HISTORY_LIMIT = 50;

export const historyMiddleware = (
    nextState: AppState,
    action: TodoCommand,
    prevState: AppState
): AppState => {
    // Skip history for internal or housekeeping actions if needed
    // For now, we log everything except specialized "silent" commands if specific ones existed.
    // We definitely want to skip UNDO/REDO from being pushed to past stack recursively?
    // Actually, standard undo/redo implementation usually manages the stacks explicitly.
    // If this middleware is solely for *logging* to show in Inspector, we might want to just append to a 'log'.
    // But AppState.history usually implies functional Undo/Redo history.

    // If the App typically uses `history` for Undo/Redo, we need a robust implementation.
    // If it's just for the Inspector's "Event Stream", we still need to populate `history.past`.

    // Let's implement a standard Undo/Redo history recorder.

    if (action.type === OS_COMMANDS.UNDO || action.type === OS_COMMANDS.REDO) {
        // Undo/Redo commands modify history themselves (or should).
        // If the reducer handles UNDO/REDO, we shouldn't RECORD 'UNDO' into the past stack as a state?
        // Usually:
        // UNDO -> pops past, pushes current to future, sets state to past.pop().
        // So 'nextState' is already the result of Undo.
        // We shouldn't add "Undo" action to the history stack.
        return nextState;
    }

    // For normal commands:
    return produce(nextState, (draft) => {
        // Ensure history object exists
        if (!draft.history) {
            draft.history = { past: [], future: [] };
        }

        // Create Entry
        const entry: HistoryEntry = {
            command: action,
            timestamp: Date.now(),
            // We might want to store a diff or snapshot. 
            // Simple generic undo usually stores the *previous state*.
            // But here we are just logging the *action* for the Inspector?
            // Inspector `EventStream` renders `entry.command`.
            // snapshot: prevState // WARNING: Recursive Explosion if prevState contains history!
            // FIXED: Omit history from the snapshot
            snapshot: (({ history, ...rest }) => rest)(prevState)
        };

        // Push to Past
        draft.history.past.push(entry);

        // Cap limit
        if (draft.history.past.length > HISTORY_LIMIT) {
            draft.history.past.shift();
        }

        // Clear Future on new action branch
        draft.history.future = [];
    });
};
