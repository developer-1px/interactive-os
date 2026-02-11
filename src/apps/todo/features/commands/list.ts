import { todoSlice } from "@apps/todo/app";
import type { AppState } from "@apps/todo/model/appState";
import { produce } from "immer";

export const AddTodo = todoSlice.group.defineCommand(
  "ADD_TODO",
  [],
  (ctx: { state: AppState }) =>
    (payload: { text?: string }) => ({
      state: produce(ctx.state, (draft) => {
        const text = payload?.text ?? draft.ui.draft;
        if (text?.trim()) {
          const newId = Date.now();
          draft.data.todos[newId] = {
            id: newId,
            text: text.trim(),
            completed: false,
            categoryId: draft.ui.selectedCategoryId,
          };
          draft.data.todoOrder.push(newId);
          draft.ui.draft = "";
          draft.ui.editDraft = "";
        }
      }),
    }),
);

export const SyncDraft = todoSlice.group.defineCommand(
  "SYNC_DRAFT",
  [],
  (ctx: { state: AppState }) =>
    (payload: { text: string }) => ({
      state: { ...ctx.state, ui: { ...ctx.state.ui, draft: payload.text } },
    }),
);

export const ToggleTodo = todoSlice.group.defineCommand(
  "TOGGLE_TODO",
  [],
  (ctx: { state: AppState }) =>
    (payload: { id: number | string }) => ({
      state: produce(ctx.state, (draft) => {
        const targetId =
          typeof payload.id === "string"
            ? parseInt(payload.id, 10)
            : payload.id;
        if (!targetId || Number.isNaN(targetId)) return;
        const todo = draft.data.todos[targetId];
        if (todo) todo.completed = !todo.completed;
      }),
    }),
);

export const DeleteTodo = todoSlice.group.defineCommand(
  "DELETE_TODO",
  [],
  (ctx: { state: AppState }) =>
    (payload: { id: number | string }) => ({
      state: produce(ctx.state, (draft) => {
        const targetId = Number(payload.id);
        if (!targetId || Number.isNaN(targetId)) return;
        delete draft.data.todos[targetId];
        const index = draft.data.todoOrder.indexOf(targetId);
        if (index !== -1) draft.data.todoOrder.splice(index, 1);
      }),
    }),
);

export const MoveItemUp = todoSlice.group.defineCommand(
  "MOVE_ITEM_UP",
  [],
  (ctx: { state: AppState }) =>
    (payload: { focusId: number | string }) => ({
      state: produce(ctx.state, (draft) => {
        const focusId = Number(payload.focusId);
        if (!focusId || Number.isNaN(focusId)) return;
        const visibleIds = ctx.state.data.todoOrder.filter(
          (id) =>
            ctx.state.data.todos[id]?.categoryId ===
            ctx.state.ui.selectedCategoryId,
        );
        const visualIdx = visibleIds.indexOf(focusId);
        if (visualIdx <= 0) return;
        const swapId = visibleIds[visualIdx - 1]!;
        const globalTargetIdx = draft.data.todoOrder.indexOf(focusId);
        const globalSwapIdx = draft.data.todoOrder.indexOf(swapId);
        [
          draft.data.todoOrder[globalTargetIdx],
          draft.data.todoOrder[globalSwapIdx],
        ] = [
            draft.data.todoOrder[globalSwapIdx]!,
            draft.data.todoOrder[globalTargetIdx]!,
          ];
      }),
    }),
);

export const MoveItemDown = todoSlice.group.defineCommand(
  "MOVE_ITEM_DOWN",
  [],
  (ctx: { state: AppState }) =>
    (payload: { focusId: number | string }) => ({
      state: produce(ctx.state, (draft) => {
        const focusId = Number(payload.focusId);
        if (!focusId || Number.isNaN(focusId)) return;
        const visibleIds = ctx.state.data.todoOrder.filter(
          (id) =>
            ctx.state.data.todos[id]?.categoryId ===
            ctx.state.ui.selectedCategoryId,
        );
        const visualIdx = visibleIds.indexOf(focusId);
        if (visualIdx === -1 || visualIdx >= visibleIds.length - 1) return;
        const swapId = visibleIds[visualIdx + 1]!;
        const globalTargetIdx = draft.data.todoOrder.indexOf(focusId);
        const globalSwapIdx = draft.data.todoOrder.indexOf(swapId);
        [
          draft.data.todoOrder[globalTargetIdx],
          draft.data.todoOrder[globalSwapIdx],
        ] = [
            draft.data.todoOrder[globalSwapIdx]!,
            draft.data.todoOrder[globalTargetIdx]!,
          ];
      }),
    }),
);

export const StartEdit = todoSlice.group.defineCommand(
  "START_EDIT",
  [],
  (ctx: { state: AppState }) =>
    (payload: { id: number | string }) => ({
      state: produce(ctx.state, (draft) => {
        const targetId = Number(payload.id);
        if (!targetId || Number.isNaN(targetId)) return;
        draft.ui.editingId = targetId;
        draft.ui.editDraft = draft.data.todos[targetId]?.text || "";
      }),
    }),
);

export const SyncEditDraft = todoSlice.group.defineCommand(
  "SYNC_EDIT_DRAFT",
  [],
  (ctx: { state: AppState }) =>
    (payload: { text: string }) => ({
      state: {
        ...ctx.state,
        ui: { ...ctx.state.ui, editDraft: payload.text },
      },
    }),
);

export const CancelEdit = todoSlice.group.defineCommand(
  "CANCEL_EDIT",
  [],
  (ctx: { state: AppState }) =>
    () => ({
      state: produce(ctx.state, (draft) => {
        if (ctx.state.ui.editingId) {
          draft.effects.push({
            type: "FOCUS_ID",
            id: ctx.state.ui.editingId as number,
          });
        }
        draft.ui.editingId = null;
        draft.ui.editDraft = "";
      }),
    }),
);

export const UpdateTodoText = todoSlice.group.defineCommand(
  "UPDATE_TODO_TEXT",
  [],
  (ctx: { state: AppState }) =>
    (_payload: { text: string }) => ({
      state: produce(ctx.state, (draft) => {
        if (!ctx.state.ui.editingId) return;
        const id = ctx.state.ui.editingId as number;
        if (draft.data.todos[id]) {
          draft.data.todos[id].text = ctx.state.ui.editDraft;
        }
        draft.effects.push({ type: "FOCUS_ID", id });
        draft.ui.editingId = null;
        draft.ui.editDraft = "";
      }),
    }),
);

export const ClearCompleted = todoSlice.group.defineCommand(
  "CLEAR_COMPLETED",
  [],
  (ctx: { state: AppState }) =>
    () => ({
      state: produce(ctx.state, (draft) => {
        const completedIds = Object.values(draft.data.todos)
          .filter((t) => t.completed)
          .map((t) => t.id);
        completedIds.forEach((id) => {
          delete draft.data.todos[id];
          const idx = draft.data.todoOrder.indexOf(id);
          if (idx !== -1) draft.data.todoOrder.splice(idx, 1);
        });
      }),
    }),
);
