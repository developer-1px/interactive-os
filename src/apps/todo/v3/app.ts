/**
 * Todo App v3 — defineApp + createWidget based.
 *
 * App owns state. Each widget declares its Zone + commands.
 * Widgets share state through the app.
 *
 * Structure:
 *   TodoApp (defineApp) — state + selectors + shared commands (undo/redo/view/clear)
 *   ├── TodoList (createWidget) — listbox Zone + CRUD + clipboard + ordering
 *   ├── TodoSidebar (createWidget) — sidebar Zone + category selection + ordering
 *   ├── TodoDraft (createWidget) — draft Field + addTodo
 *   └── TodoEdit (createWidget) — edit Field + edit commands
 */

import { INITIAL_STATE } from "@apps/todo/features/todo_details/persistence";
import type { AppState, Todo } from "@apps/todo/model/appState";
import {
  selectCategories,
  selectEditingTodo,
  selectStats,
  selectTodosByCategory,
  selectVisibleTodos,
} from "@apps/todo/selectors";
import { produce } from "immer";
import { FOCUS } from "@/os/3-commands/focus/focus";
import { defineApp } from "@/os/defineApp";

// ═══════════════════════════════════════════════════════════════════
// Clipboard state (module-local, shared across widgets)
// ═══════════════════════════════════════════════════════════════════

let clipboardData: { todo: Todo; isCut: boolean } | null = null;

// ═══════════════════════════════════════════════════════════════════
// App definition
// ═══════════════════════════════════════════════════════════════════

export const TodoApp = defineApp<AppState>("todo-v3", INITIAL_STATE, {
  history: true,
  selectors: {
    visibleTodos: selectVisibleTodos,
    categories: selectCategories,
    stats: selectStats,
    editingTodo: selectEditingTodo,
    todosByCategory: selectTodosByCategory,
  },
});

// ═══════════════════════════════════════════════════════════════════
// TodoList — listbox with CRUD, clipboard, ordering
// ═══════════════════════════════════════════════════════════════════

export const TodoList = TodoApp.createWidget("list", (define) => {
  const toggleTodo = define.command(
    "toggleTodo",
    [],
    (ctx: { state: AppState }) => (payload: { id: number | string }) => ({
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

  const deleteTodo = define.command(
    "deleteTodo",
    [],
    (ctx: { state: AppState }) => (payload: { id: number | string }) => ({
      state: produce(ctx.state, (draft) => {
        const targetId = Number(payload.id);
        if (!targetId || Number.isNaN(targetId)) return;
        delete draft.data.todos[targetId];
        const index = draft.data.todoOrder.indexOf(targetId);
        if (index !== -1) draft.data.todoOrder.splice(index, 1);
      }),
    }),
  );

  const startEdit = define.command(
    "startEdit",
    [],
    (ctx: { state: AppState }) => (payload: { id: number | string }) => ({
      state: produce(ctx.state, (draft) => {
        const targetId = Number(payload.id);
        if (!targetId || Number.isNaN(targetId)) return;
        draft.ui.editingId = targetId;
        draft.ui.editDraft = draft.data.todos[targetId]?.text || "";
      }),
    }),
  );

  const moveItemUp = define.command(
    "moveItemUp",
    [],
    (ctx: { state: AppState }) => (payload: { focusId: number | string }) => ({
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

  const moveItemDown = define.command(
    "moveItemDown",
    [],
    (ctx: { state: AppState }) => (payload: { focusId: number | string }) => ({
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

  const duplicateTodo = define.command(
    "duplicateTodo",
    [],
    (ctx: { state: AppState }) => (payload: { id: number | string }) => {
      const targetId = Number(payload.id);
      if (!targetId || Number.isNaN(targetId)) return { state: ctx.state };
      const todo = ctx.state.data.todos[targetId];
      if (!todo) return { state: ctx.state };
      return {
        state: produce(ctx.state, (draft) => {
          const newId = Date.now();
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
      };
    },
  );

  const copyTodo = define.command(
    "copyTodo",
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

  const cutTodo = define.command(
    "cutTodo",
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

  const pasteTodo = define.command(
    "pasteTodo",
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
        dispatch: FOCUS({ zoneId: "list", itemId: String(newId) }),
      };
    },
  );

  const undoCommand = define.command(
    "undo",
    [],
    (ctx: { state: AppState }) => () => {
      if (!ctx.state.history?.past?.length) return { state: ctx.state };
      const entry = ctx.state.history.past[ctx.state.history.past.length - 1]!;
      const focusTarget = entry.focusedItemId
        ? String(entry.focusedItemId)
        : undefined;
      return {
        state: produce(ctx.state, (draft) => {
          draft.history.past.pop();
          const { history: _h, ...currentWithoutHistory } = ctx.state;
          draft.history.future.push({
            command: { type: "UNDO_SNAPSHOT" },
            timestamp: Date.now(),
            snapshot: currentWithoutHistory,
          });
          const popped =
            ctx.state.history.past[ctx.state.history.past.length - 1]!;
          if (popped?.snapshot) {
            const snapshot = popped.snapshot;
            if (snapshot.data) draft.data = snapshot.data;
            if (snapshot.ui) draft.ui = snapshot.ui;
          }
        }),
        dispatch: focusTarget
          ? FOCUS({ zoneId: "list", itemId: focusTarget })
          : undefined,
      };
    },
  );

  const redoCommand = define.command(
    "redo",
    [],
    (ctx: { state: AppState }) => () => {
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
          }
        }),
        dispatch: focusTarget
          ? FOCUS({ zoneId: "list", itemId: focusTarget })
          : undefined,
      };
    },
  );

  return {
    commands: {
      toggleTodo,
      deleteTodo,
      startEdit,
      moveItemUp,
      moveItemDown,
      duplicateTodo,
      copyTodo,
      cutTodo,
      pasteTodo,
      undoCommand,
      redoCommand,
    },
    zone: {
      role: "listbox",
      onCheck: toggleTodo,
      onAction: startEdit,
      onDelete: deleteTodo,
      onCopy: copyTodo,
      onCut: cutTodo,
      onPaste: pasteTodo,
      onMoveUp: moveItemUp,
      onMoveDown: moveItemDown,
      onUndo: undoCommand,
      onRedo: redoCommand,
    },
  };
});

// ═══════════════════════════════════════════════════════════════════
// TodoSidebar — category selection + ordering
// ═══════════════════════════════════════════════════════════════════

export const TodoSidebar = TodoApp.createWidget("sidebar", (define) => {
  const selectCategory = define.command(
    "selectCategory",
    [],
    (ctx: { state: AppState }) => (payload: { id?: string }) => {
      const id = payload?.id;
      if (!id || typeof id !== "string") return { state: ctx.state };
      return {
        state: {
          ...ctx.state,
          ui: { ...ctx.state.ui, selectedCategoryId: id },
        },
      };
    },
  );

  const moveCategoryUp = define.command(
    "moveCategoryUp",
    [],
    (ctx: { state: AppState }) => () => ({
      state: produce(ctx.state, (draft) => {
        const id = ctx.state.ui.selectedCategoryId;
        const idx = draft.data.categoryOrder.indexOf(id);
        if (idx > 0) {
          const prev = draft.data.categoryOrder[idx - 1]!;
          draft.data.categoryOrder[idx - 1] = id;
          draft.data.categoryOrder[idx] = prev;
        }
      }),
    }),
  );

  const moveCategoryDown = define.command(
    "moveCategoryDown",
    [],
    (ctx: { state: AppState }) => () => ({
      state: produce(ctx.state, (draft) => {
        const id = ctx.state.ui.selectedCategoryId;
        const idx = draft.data.categoryOrder.indexOf(id);
        if (idx !== -1 && idx < draft.data.categoryOrder.length - 1) {
          const next = draft.data.categoryOrder[idx + 1]!;
          draft.data.categoryOrder[idx + 1] = id;
          draft.data.categoryOrder[idx] = next;
        }
      }),
    }),
  );

  return {
    commands: { selectCategory, moveCategoryUp, moveCategoryDown },
    zone: {
      role: "listbox",
      onAction: selectCategory,
    },
  };
});

// ═══════════════════════════════════════════════════════════════════
// TodoDraft — draft input field
// ═══════════════════════════════════════════════════════════════════

export const TodoDraft = TodoApp.createWidget("draft", (define) => {
  const syncDraft = define.command(
    "syncDraft",
    [],
    (ctx: { state: AppState }) => (payload: { text: string }) => ({
      state: { ...ctx.state, ui: { ...ctx.state.ui, draft: payload.text } },
    }),
  );

  const addTodo = define.command(
    "addTodo",
    [],
    (ctx: { state: AppState }) => (payload: { text?: string }) => ({
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

  return {
    commands: { syncDraft, addTodo },
    field: {
      onChange: syncDraft,
      onSubmit: addTodo,
    },
  };
});

// ═══════════════════════════════════════════════════════════════════
// TodoEdit — edit field
// ═══════════════════════════════════════════════════════════════════

export const TodoEdit = TodoApp.createWidget("edit", (define) => {
  const syncEditDraft = define.command(
    "syncEditDraft",
    [],
    (ctx: { state: AppState }) => (payload: { text: string }) => ({
      state: {
        ...ctx.state,
        ui: { ...ctx.state.ui, editDraft: payload.text },
      },
    }),
  );

  const updateTodoText = define.command(
    "updateTodoText",
    [],
    (ctx: { state: AppState }) => (payload: { text: string }) => ({
      state: produce(ctx.state, (draft) => {
        if (!ctx.state.ui.editingId) return;
        const id = ctx.state.ui.editingId as number;
        if (draft.data.todos[id]) {
          draft.data.todos[id].text = payload.text || ctx.state.ui.editDraft;
        }
        draft.ui.editingId = null;
        draft.ui.editDraft = "";
      }),
    }),
  );

  const cancelEdit = define.command(
    "cancelEdit",
    [],
    (ctx: { state: AppState }) => () => ({
      state: produce(ctx.state, (draft) => {
        draft.ui.editingId = null;
        draft.ui.editDraft = "";
      }),
    }),
  );

  return {
    commands: { syncEditDraft, updateTodoText, cancelEdit },
    field: {
      onChange: syncEditDraft,
      onSubmit: updateTodoText,
      onCancel: cancelEdit,
    },
  };
});

// ═══════════════════════════════════════════════════════════════════
// TodoToolbar — shared commands (view toggle, clear)
// ═══════════════════════════════════════════════════════════════════

export const TodoToolbar = TodoApp.createWidget("toolbar", (define) => {
  const toggleView = define.command(
    "toggleView",
    [],
    (ctx: { state: AppState }) => () => ({
      state: {
        ...ctx.state,
        ui: {
          ...ctx.state.ui,
          viewMode: ctx.state.ui.viewMode === "board" ? "list" : "board",
        },
      },
    }),
  );

  const clearCompleted = define.command(
    "clearCompleted",
    [],
    (ctx: { state: AppState }) => () => ({
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

  return {
    commands: { toggleView, clearCompleted },
  };
});
