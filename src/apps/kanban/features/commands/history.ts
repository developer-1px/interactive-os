import { produce } from "immer";
import { defineKanbanCommand } from "@apps/kanban/features/commands/factory";

export const Undo = defineKanbanCommand({
    id: "KANBAN_UNDO",
    run: (state) => {
        if (!state.history || state.history.past.length === 0) return state;

        return produce(state, (draft) => {
            const lastEntry = draft.history.past.pop();
            if (!lastEntry || !lastEntry.snapshot) return;

            // Push current state (minus history) to future
            const currentSnapshot = {
                data: state.data,
                ui: state.ui,
                effects: [],
            };
            draft.history.future.push({
                command: { type: "KANBAN_UNDO" },
                timestamp: Date.now(),
                snapshot: currentSnapshot,
            });

            // Restore snapshot
            draft.data = lastEntry.snapshot.data;
            draft.ui = lastEntry.snapshot.ui;
            draft.effects = lastEntry.snapshot.effects || [];
        });
    },
});

export const Redo = defineKanbanCommand({
    id: "KANBAN_REDO",
    run: (state) => {
        if (!state.history || state.history.future.length === 0) return state;

        return produce(state, (draft) => {
            const futureEntry = draft.history.future.pop();
            if (!futureEntry || !futureEntry.snapshot) return;

            // Push current state to past
            const currentSnapshot = {
                data: state.data,
                ui: state.ui,
                effects: [],
            };
            draft.history.past.push({
                command: { type: "KANBAN_REDO" },
                timestamp: Date.now(),
                snapshot: currentSnapshot,
            });

            // Restore future snapshot
            draft.data = futureEntry.snapshot.data;
            draft.ui = futureEntry.snapshot.ui;
            draft.effects = futureEntry.snapshot.effects || [];
        });
    },
});
