import { defineGlobalCommand } from "@apps/todo/features/commands/defineGlobalCommand";
import { produce } from "immer";

/**
 * Undo Command - Restores state from the last history.past entry
 *
 * Flow:
 * 1. Pop the last entry from `past`
 * 2. Push current state (sans history) to `future`
 * 3. Restore the snapshot from the popped entry
 */
export const UndoCommand = defineGlobalCommand({
    id: "UNDO",
    run: (state) =>
        produce(state, (draft) => {
            if (!draft.history?.past?.length) return;

            const entry = draft.history.past.pop()!;

            // Save current state (sans history) to future for redo
            const { history: _h, ...currentWithoutHistory } = state;
            draft.history.future.push({
                command: { type: "UNDO_SNAPSHOT" },
                timestamp: Date.now(),
                snapshot: currentWithoutHistory,
            });

            // Restore snapshot (everything except history)
            if (entry.snapshot) {
                const snapshot = entry.snapshot;
                if (snapshot.data) draft.data = snapshot.data;
                if (snapshot.ui) draft.ui = snapshot.ui;
                if (snapshot.effects) draft.effects = snapshot.effects;
                else draft.effects = [];
            }

            // Restore focus position via FOCUS_ID effect
            if (entry.focusedItemId) {
                if (!draft.effects) draft.effects = [];
                draft.effects.push({ type: "FOCUS_ID", id: entry.focusedItemId });
            }
        }),
});

/**
 * Redo Command - Restores state from the last history.future entry
 *
 * Flow:
 * 1. Pop the last entry from `future`
 * 2. Push current state (sans history) to `past`
 * 3. Restore the snapshot from the popped entry
 */
export const RedoCommand = defineGlobalCommand({
    id: "REDO",
    run: (state) =>
        produce(state, (draft) => {
            if (!draft.history?.future?.length) return;

            const entry = draft.history.future.pop()!;

            // Save current state (sans history) to past for re-undo
            const { history: _h, ...currentWithoutHistory } = state;
            draft.history.past.push({
                command: { type: "REDO_SNAPSHOT" },
                timestamp: Date.now(),
                snapshot: currentWithoutHistory,
            });

            // Restore snapshot (everything except history)
            if (entry.snapshot) {
                const snapshot = entry.snapshot;
                if (snapshot.data) draft.data = snapshot.data;
                if (snapshot.ui) draft.ui = snapshot.ui;
                if (snapshot.effects) draft.effects = snapshot.effects;
                else draft.effects = [];
            }

            // Restore focus position via FOCUS_ID effect
            if (entry.focusedItemId) {
                if (!draft.effects) draft.effects = [];
                draft.effects.push({ type: "FOCUS_ID", id: entry.focusedItemId });
            }
        }),
});
