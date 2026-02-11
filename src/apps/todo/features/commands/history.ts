import { todoSlice } from "@apps/todo/app";
import type { AppState } from "@apps/todo/model/appState";
import { produce } from "immer";

/**
 * Undo Command - Restores state from the last history.past entry
 */
export const UndoCommand = todoSlice.group.defineCommand(
  "UNDO",
  [],
  (ctx: { state: AppState }) =>
    () => ({
      state: produce(ctx.state, (draft) => {
        if (!draft.history?.past?.length) return;

        const entry = draft.history.past.pop()!;

        const { history: _h, ...currentWithoutHistory } = ctx.state;
        draft.history.future.push({
          command: { type: "UNDO_SNAPSHOT" },
          timestamp: Date.now(),
          snapshot: currentWithoutHistory,
        });

        if (entry.snapshot) {
          const snapshot = entry.snapshot;
          if (snapshot.data) draft.data = snapshot.data;
          if (snapshot.ui) draft.ui = snapshot.ui;
          if (snapshot.effects) draft.effects = snapshot.effects;
          else draft.effects = [];
        }

        if (entry.focusedItemId) {
          if (!draft.effects) draft.effects = [];
          draft.effects.push({ type: "FOCUS_ID", id: entry.focusedItemId });
        }
      }),
    }),
);

/**
 * Redo Command - Restores state from the last history.future entry
 */
export const RedoCommand = todoSlice.group.defineCommand(
  "REDO",
  [],
  (ctx: { state: AppState }) =>
    () => ({
      state: produce(ctx.state, (draft) => {
        if (!draft.history?.future?.length) return;

        const entry = draft.history.future.pop()!;

        const { history: _h, ...currentWithoutHistory } = ctx.state;
        draft.history.past.push({
          command: { type: "REDO_SNAPSHOT" },
          timestamp: Date.now(),
          snapshot: currentWithoutHistory,
        });

        if (entry.snapshot) {
          const snapshot = entry.snapshot;
          if (snapshot.data) draft.data = snapshot.data;
          if (snapshot.ui) draft.ui = snapshot.ui;
          if (snapshot.effects) draft.effects = snapshot.effects;
          else draft.effects = [];
        }

        if (entry.focusedItemId) {
          if (!draft.effects) draft.effects = [];
          draft.effects.push({ type: "FOCUS_ID", id: entry.focusedItemId });
        }
      }),
    }),
);
