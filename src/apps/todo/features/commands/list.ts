import { defineListCommand } from "@apps/todo/features/commands/defineGlobalCommand";
import type { OS } from "@os/AntigravityOS";
import { produce } from "immer";

export const AddTodo = defineListCommand({
  id: "ADD_TODO",
  run: (state, payload?: { text?: string }) =>
    produce(state, (draft) => {
      // Use payload.text (from Field) or fallback to state.ui.draft (from keymap)
      const text = payload?.text ?? draft.ui.draft;
      if (text?.trim()) {
        const newId = Date.now();
        const newTodo = {
          id: newId,
          text: text.trim(),
          completed: false,
          categoryId: draft.ui.selectedCategoryId,
        };

        // Add to Entity Map
        draft.data.todos[newId] = newTodo;
        // Add to Order Array
        draft.data.todoOrder.push(newId);

        // Reset UI
        draft.ui.draft = "";
        draft.ui.editDraft = "";
      }
    }),
});

export const SyncDraft = defineListCommand({
  id: "SYNC_DRAFT",
  log: false,
  run: (state, payload: { text: string }) => ({
    ...state,
    ui: { ...state.ui, draft: payload.text },
  }),
});

// React + zustand + immer
export const ToggleTodo = defineListCommand({
  id: "TOGGLE_TODO",
  run: (state, payload: { id: number | string | typeof OS.FOCUS }) => {
    return produce(state, (draft) => {
      const rawId = payload.id;
      const targetId =
        typeof rawId === "string" ? parseInt(rawId, 10) : (rawId as number);

      // Validate ID (must be valid number)
      if (!targetId || Number.isNaN(targetId)) {
        return;
      }

      const todo = draft.data.todos[targetId];
      if (todo) {
        todo.completed = !todo.completed;
      }
    });
  },
});

export const DeleteTodo = defineListCommand({
  id: "DELETE_TODO",
  run: (state, payload: { id: number | typeof OS.FOCUS }) =>
    produce(state, (draft) => {
      const targetId = payload.id as number;

      if (!targetId || Number.isNaN(targetId)) return;

      const numericTargetId = Number(targetId);

      // Delete from Map
      delete draft.data.todos[numericTargetId];
      // Remove from Order
      const index = draft.data.todoOrder.indexOf(numericTargetId);
      if (index !== -1) {
        draft.data.todoOrder.splice(index, 1);
      }
    }),
});

export const MoveItemUp = defineListCommand({
  id: "MOVE_ITEM_UP",
  run: (state, payload: { focusId: number | typeof OS.FOCUS }) =>
    produce(state, (draft) => {
      const focusId = Number(payload.focusId);

      if (!focusId || Number.isNaN(focusId)) return;

      const visibleIds = state.data.todoOrder.filter(
        (id) =>
          state.data.todos[id]?.categoryId === state.ui.selectedCategoryId,
      );
      const visualIdx = visibleIds.indexOf(focusId);

      if (visualIdx <= 0) return;

      const targetId = focusId;
      const swapId = visibleIds[visualIdx - 1]!;

      const globalTargetIdx = draft.data.todoOrder.indexOf(targetId);
      const globalSwapIdx = draft.data.todoOrder.indexOf(swapId);

      [
        draft.data.todoOrder[globalTargetIdx],
        draft.data.todoOrder[globalSwapIdx],
      ] = [
        draft.data.todoOrder[globalSwapIdx]!,
        draft.data.todoOrder[globalTargetIdx]!,
      ];
    }),
});

export const MoveItemDown = defineListCommand({
  id: "MOVE_ITEM_DOWN",
  run: (state, payload: { focusId: number | typeof OS.FOCUS }) =>
    produce(state, (draft) => {
      const focusId = Number(payload.focusId);
      if (!focusId || Number.isNaN(focusId)) return;

      const visibleIds = state.data.todoOrder.filter(
        (id) =>
          state.data.todos[id]?.categoryId === state.ui.selectedCategoryId,
      );
      const visualIdx = visibleIds.indexOf(focusId);

      if (visualIdx === -1 || visualIdx >= visibleIds.length - 1) return;

      const targetId = focusId;
      const swapId = visibleIds[visualIdx + 1]!;

      const globalTargetIdx = draft.data.todoOrder.indexOf(targetId);
      const globalSwapIdx = draft.data.todoOrder.indexOf(swapId);

      [
        draft.data.todoOrder[globalTargetIdx],
        draft.data.todoOrder[globalSwapIdx],
      ] = [
        draft.data.todoOrder[globalSwapIdx]!,
        draft.data.todoOrder[globalTargetIdx]!,
      ];
    }),
});

export const StartEdit = defineListCommand({
  id: "START_EDIT",
  run: (state, payload: { id: number | typeof OS.FOCUS }) =>
    produce(state, (draft) => {
      const targetId = payload.id as number;
      if (!targetId || Number.isNaN(targetId)) return;

      const todo = draft.data.todos[targetId];
      draft.ui.editingId = targetId;
      draft.ui.editDraft = todo?.text || "";
    }),
});

export const SyncEditDraft = defineListCommand({
  id: "SYNC_EDIT_DRAFT",
  log: false,
  run: (state, payload: { text: string }) => ({
    ...state,
    ui: { ...state.ui, editDraft: payload.text },
  }),
});

export const CancelEdit = defineListCommand({
  id: "CANCEL_EDIT",

  run: (state) =>
    produce(state, (draft) => {
      if (state.ui.editingId) {
        // Keep focus on the item after exiting edit mode
        draft.effects.push({
          type: "FOCUS_ID",
          id: state.ui.editingId as number,
        });
      }
      draft.ui.editingId = null;
      draft.ui.editDraft = "";
    }),
});

export const UpdateTodoText = defineListCommand({
  id: "UPDATE_TODO_TEXT",
  run: (state) =>
    produce(state, (draft) => {
      if (!state.ui.editingId) return;
      const id = state.ui.editingId as number;
      if (draft.data.todos[id]) {
        draft.data.todos[id].text = state.ui.editDraft;
      }
      // Keep focus on the item after exiting edit mode
      draft.effects.push({ type: "FOCUS_ID", id });
      draft.ui.editingId = null;
      draft.ui.editDraft = "";
    }),
});
