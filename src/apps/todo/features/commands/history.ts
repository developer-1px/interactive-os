import { todoSlice } from "@apps/todo/app";
import type { AppState } from "@apps/todo/model/appState";
import { FOCUS } from "@/os-new/3-commands/focus/focus";
import { produce } from "immer";

/**
 * Undo Command - Restores state from the last history.past entry
 */
export const UndoCommand = todoSlice.group.defineCommand(
  "UNDO",
  [],
  (ctx: { state: AppState }) =>
    () => {
      if (!ctx.state.history?.past?.length) return { state: ctx.state };

      const entry = ctx.state.history.past[ctx.state.history.past.length - 1]!;
      const focusTarget = entry.focusedItemId
        ? String(entry.focusedItemId)
        : undefined;

      return {
        state: produce(ctx.state, (draft) => {
          const popped = draft.history.past.pop()!;

          const { history: _h, ...currentWithoutHistory } = ctx.state;
          draft.history.future.push({
            command: { type: "UNDO_SNAPSHOT" },
            timestamp: Date.now(),
            snapshot: currentWithoutHistory,
          });

          if (popped.snapshot) {
            const snapshot = popped.snapshot;
            if (snapshot.data) draft.data = snapshot.data;
            if (snapshot.ui) draft.ui = snapshot.ui;
            if (snapshot.effects) draft.effects = snapshot.effects;
            else draft.effects = [];
          }
        }),
        dispatch: focusTarget
          ? FOCUS({ zoneId: "listView", itemId: focusTarget })
          : undefined,
      };
    },
);

/**
 * Redo Command - Restores state from the last history.future entry
 */
export const RedoCommand = todoSlice.group.defineCommand(
  "REDO",
  [],
  (ctx: { state: AppState }) =>
    () => {
      if (!ctx.state.history?.future?.length) return { state: ctx.state };

      const entry =
        ctx.state.history.future[ctx.state.history.future.length - 1]!;
      const focusTarget = entry.focusedItemId
        ? String(entry.focusedItemId)
        : undefined;

      return {
        state: produce(ctx.state, (draft) => {
          const popped = draft.history.future.pop()!;

          const { history: _h, ...currentWithoutHistory } = ctx.state;
          draft.history.past.push({
            command: { type: "REDO_SNAPSHOT" },
            timestamp: Date.now(),
            snapshot: currentWithoutHistory,
          });

          if (popped.snapshot) {
            const snapshot = popped.snapshot;
            if (snapshot.data) draft.data = snapshot.data;
            if (snapshot.ui) draft.ui = snapshot.ui;
            if (snapshot.effects) draft.effects = snapshot.effects;
            else draft.effects = [];
          }
        }),
        dispatch: focusTarget
          ? FOCUS({ zoneId: "listView", itemId: focusTarget })
          : undefined,
      };
    },
);

