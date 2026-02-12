import { todoSlice } from "@apps/todo/app";
import type { AppState, Todo } from "@apps/todo/model/appState";
import { produce } from "immer";
import { FOCUS } from "@/os/3-commands/focus/focus";

/**
 * Clipboard Commands for Todo App
 */

let clipboardData: { todo: Todo; isCut: boolean } | null = null;

export const CopyTodo = todoSlice.group.defineCommand(
  "COPY_TODO",
  [],
  (ctx: { state: AppState }) => (payload: { id: number | string }) => {
    const targetId = Number(payload.id);
    if (!targetId || Number.isNaN(targetId)) return { state: ctx.state };

    const todo = ctx.state.data.todos[targetId];
    if (!todo) return { state: ctx.state };

    clipboardData = { todo: { ...todo }, isCut: false };

    try {
      const jsonData = JSON.stringify(todo);
      navigator.clipboard
        .write([
          new ClipboardItem({
            "text/plain": new Blob([todo.text], { type: "text/plain" }),
            "application/json": new Blob([jsonData], {
              type: "application/json",
            }),
          }),
        ])
        .catch(() => {
          navigator.clipboard.writeText(todo.text).catch(() => {});
        });
    } catch {
      navigator.clipboard?.writeText(todo.text)?.catch?.(() => {});
    }

    return { state: ctx.state };
  },
);

export const CutTodo = todoSlice.group.defineCommand(
  "CUT_TODO",
  [],
  (ctx: { state: AppState }) => (payload: { id: number | string }) => {
    const targetId = Number(payload.id);
    if (!targetId || Number.isNaN(targetId)) return { state: ctx.state };

    const todo = ctx.state.data.todos[targetId];
    if (!todo) return { state: ctx.state };

    clipboardData = { todo: { ...todo }, isCut: true };

    try {
      const jsonData = JSON.stringify(todo);
      navigator.clipboard
        .write([
          new ClipboardItem({
            "text/plain": new Blob([todo.text], { type: "text/plain" }),
            "application/json": new Blob([jsonData], {
              type: "application/json",
            }),
          }),
        ])
        .catch(() => {
          navigator.clipboard.writeText(todo.text).catch(() => {});
        });
    } catch {
      navigator.clipboard?.writeText(todo.text)?.catch?.(() => {});
    }

    return {
      state: produce(ctx.state, (draft) => {
        delete draft.data.todos[targetId];
        const index = draft.data.todoOrder.indexOf(targetId);
        if (index !== -1) draft.data.todoOrder.splice(index, 1);
      }),
    };
  },
);

export const PasteTodo = todoSlice.group.defineCommand(
  "PASTE_TODO",
  [],
  (ctx: { state: AppState }) => (payload: { id?: number | string }) => {
    if (!clipboardData) return { state: ctx.state };

    const sourceTodo = clipboardData.todo;
    const newId = Date.now();

    return {
      state: produce(ctx.state, (draft) => {
        draft.data.todos[newId] = {
          id: newId,
          text: sourceTodo.text,
          completed: sourceTodo.completed,
          categoryId: draft.ui.selectedCategoryId,
        };

        const numericFocusId = payload.id ? Number(payload.id) : undefined;
        if (numericFocusId && !Number.isNaN(numericFocusId)) {
          const focusIndex = draft.data.todoOrder.indexOf(numericFocusId);
          if (focusIndex !== -1) {
            draft.data.todoOrder.splice(focusIndex + 1, 0, newId);
          } else {
            draft.data.todoOrder.push(newId);
          }
        } else {
          draft.data.todoOrder.push(newId);
        }
      }),
      dispatch: FOCUS({ zoneId: "listView", itemId: String(newId) }),
    };
  },
);

export const DuplicateTodo = todoSlice.group.defineCommand(
  "DUPLICATE_TODO",
  [],
  (ctx: { state: AppState }) => (payload: { id: number | string }) => {
    const targetId = Number(payload.id);
    if (!targetId || Number.isNaN(targetId)) return { state: ctx.state };

    const todo = ctx.state.data.todos[targetId];
    if (!todo) return { state: ctx.state };

    const newId = Date.now();

    return {
      state: produce(ctx.state, (draft) => {
        draft.data.todos[newId] = {
          id: newId,
          text: todo.text,
          completed: todo.completed,
          categoryId: todo.categoryId,
        };

        const originalIndex = draft.data.todoOrder.indexOf(targetId);
        if (originalIndex !== -1) {
          draft.data.todoOrder.splice(originalIndex + 1, 0, newId);
        } else {
          draft.data.todoOrder.push(newId);
        }
      }),
      dispatch: FOCUS({ zoneId: "listView", itemId: String(newId) }),
    };
  },
);
