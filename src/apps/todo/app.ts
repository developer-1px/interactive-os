/**
 * Todo App v5 — defineApp native (flat handlers, branded types).
 *
 * Migrated from app-v3.ts (curried handlers + createWidget compat layer)
 * to v5 native API (flat handlers + createZone + Condition/Selector).
 *
 * Structure:
 *   TodoApp (defineApp)
 *     ├── Conditions: canUndo, canRedo, isEditing, hasClipboard
 *     ├── Selectors: visibleTodos, categories, stats, editingTodo, todosByCategory
 *     ├── Zones:
 *     │   ├── list     — listbox (CRUD, clipboard, ordering, undo/redo)
 *     │   ├── sidebar  — category selection + ordering
 *     │   ├── draft    — draft input field
 *     │   ├── edit     — edit input field
 *     │   └── toolbar  — view toggle, clear completed
 */

import { INITIAL_STATE } from "@apps/todo/features/todo-details/persistence";
import type { AppState, Todo } from "@apps/todo/model/appState";
import {
  selectCategories,
  selectEditingTodo,
  selectStats,
  selectTodosByCategory,
  selectVisibleTodos,
} from "@apps/todo/selectors";
import { produce } from "immer";
import { FIELD_START_EDIT } from "@/os/3-commands/field/field";
import { FOCUS } from "@/os/3-commands/focus/focus";
import { defineApp } from "@/os/defineApp";

/** Collision-free random ID */
const uid = () => Math.random().toString(36).slice(2, 10);

// ═══════════════════════════════════════════════════════════════════
// App
// ═══════════════════════════════════════════════════════════════════

export const TodoApp = defineApp<AppState>("todo-v5", INITIAL_STATE, {
  history: true,
});

// ═══════════════════════════════════════════════════════════════════
// Conditions
// ═══════════════════════════════════════════════════════════════════

export const canUndo = TodoApp.condition(
  "canUndo",
  (s) => (s.history?.past?.length ?? 0) > 0,
);

export const canRedo = TodoApp.condition(
  "canRedo",
  (s) => (s.history?.future?.length ?? 0) > 0,
);

export const isEditing = TodoApp.condition(
  "isEditing",
  (s) => s.ui.editingId != null,
);

export const hasClipboard = TodoApp.condition(
  "hasClipboard",
  (s) => s.ui.clipboard != null,
);

// ═══════════════════════════════════════════════════════════════════
// Selectors
// ═══════════════════════════════════════════════════════════════════

export const visibleTodos = TodoApp.selector(
  "visibleTodos",
  selectVisibleTodos,
);
export const categories = TodoApp.selector("categories", selectCategories);
export const stats = TodoApp.selector("stats", selectStats);
export const editingTodo = TodoApp.selector("editingTodo", selectEditingTodo);
export const todosByCategory = TodoApp.selector(
  "todosByCategory",
  selectTodosByCategory,
);

// ═══════════════════════════════════════════════════════════════════
// TodoList Zone — listbox with CRUD, clipboard, ordering
// ═══════════════════════════════════════════════════════════════════

const listZone = TodoApp.createZone("list");

export const toggleTodo = listZone.command(
  "toggleTodo",
  (ctx, payload: { id: string }) => ({
    state: produce(ctx.state, (draft) => {
      const todo = draft.data.todos[payload.id];
      if (todo) todo.completed = !todo.completed;
    }),
  }),
);

export const deleteTodo = listZone.command(
  "deleteTodo",
  (ctx, payload: { id: string }) => {
    if (!payload.id) return { state: ctx.state };

    // Compute the next focus target BEFORE deleting
    const visibleIds = ctx.state.data.todoOrder.filter(
      (id) =>
        ctx.state.data.todos[id]?.categoryId ===
        ctx.state.ui.selectedCategoryId,
    );
    const idx = visibleIds.indexOf(payload.id);
    // Prefer next item, fall back to previous
    const nextFocusId =
      idx < visibleIds.length - 1
        ? visibleIds[idx + 1]
        : idx > 0
          ? visibleIds[idx - 1]
          : undefined;

    return {
      state: produce(ctx.state, (draft) => {
        delete draft.data.todos[payload.id];
        const index = draft.data.todoOrder.indexOf(payload.id);
        if (index !== -1) draft.data.todoOrder.splice(index, 1);
      }),
      dispatch: nextFocusId
        ? FOCUS({ zoneId: "list", itemId: nextFocusId })
        : undefined,
    };
  },
);

export const startEdit = listZone.command(
  "startEdit",
  (ctx, payload: { id: string }) => ({
    state: produce(ctx.state, (draft) => {
      if (!payload.id) return;
      draft.ui.editingId = payload.id;
      draft.ui.editDraft = draft.data.todos[payload.id]?.text || "";
    }),
    // Also set OS-level editingItemId so Field auto-focuses
    dispatch: FIELD_START_EDIT(),
  }),
);

export const moveItemUp = listZone.command(
  "moveItemUp",
  (ctx, payload: { id: string }) => ({
    state: produce(ctx.state, (draft) => {
      if (!payload.id) return;
      const visibleIds = ctx.state.data.todoOrder.filter(
        (id) =>
          ctx.state.data.todos[id]?.categoryId ===
          ctx.state.ui.selectedCategoryId,
      );
      const visualIdx = visibleIds.indexOf(payload.id);
      if (visualIdx <= 0) return;
      const swapId = visibleIds[visualIdx - 1]!;
      const globalTargetIdx = draft.data.todoOrder.indexOf(payload.id);
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

export const moveItemDown = listZone.command(
  "moveItemDown",
  (ctx, payload: { id: string }) => ({
    state: produce(ctx.state, (draft) => {
      if (!payload.id) return;
      const visibleIds = ctx.state.data.todoOrder.filter(
        (id) =>
          ctx.state.data.todos[id]?.categoryId ===
          ctx.state.ui.selectedCategoryId,
      );
      const visualIdx = visibleIds.indexOf(payload.id);
      if (visualIdx === -1 || visualIdx >= visibleIds.length - 1) return;
      const swapId = visibleIds[visualIdx + 1]!;
      const globalTargetIdx = draft.data.todoOrder.indexOf(payload.id);
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

export const duplicateTodo = listZone.command(
  "duplicateTodo",
  (ctx, payload: { id: string }) => {
    if (!payload.id) return { state: ctx.state };
    const todo = ctx.state.data.todos[payload.id];
    if (!todo) return { state: ctx.state };
    return {
      state: produce(ctx.state, (draft) => {
        const newId = uid();
        draft.data.todos[newId] = {
          id: newId,
          text: todo.text,
          completed: todo.completed,
          categoryId: todo.categoryId,
        };
        const originalIndex = draft.data.todoOrder.indexOf(payload.id);
        if (originalIndex !== -1) {
          draft.data.todoOrder.splice(originalIndex + 1, 0, newId);
        } else {
          draft.data.todoOrder.push(newId);
        }
      }),
    };
  },
);

export const copyTodo = listZone.command(
  "copyTodo",
  (ctx, payload: { id: string; _multi?: boolean }) => {
    if (!payload.id) return { state: ctx.state };
    const todo = ctx.state.data.todos[payload.id];
    if (!todo) return { state: ctx.state };
    return {
      state: produce(ctx.state, (draft) => {
        const prev = draft.ui.clipboard;
        if (payload._multi && prev && !prev.isCut) {
          prev.todos.push({ ...todo });
        } else {
          draft.ui.clipboard = { todos: [{ ...todo }], isCut: false };
        }
      }),
      clipboardWrite: { text: todo.text, json: JSON.stringify(todo) },
    };
  },
);

export const cutTodo = listZone.command(
  "cutTodo",
  (ctx, payload: { id: string; _multi?: boolean }) => {
    if (!payload.id) return { state: ctx.state };
    const todo = ctx.state.data.todos[payload.id];
    if (!todo) return { state: ctx.state };
    return {
      state: produce(ctx.state, (draft) => {
        const prev = draft.ui.clipboard;
        // Append to existing clipboard if same mode (cut), otherwise start fresh
        if (payload._multi && prev && prev.isCut) {
          prev.todos.push({ ...todo });
        } else {
          draft.ui.clipboard = { todos: [{ ...todo }], isCut: true };
        }
        delete draft.data.todos[payload.id];
        const index = draft.data.todoOrder.indexOf(payload.id);
        if (index !== -1) draft.data.todoOrder.splice(index, 1);
      }),
      clipboardWrite: { text: todo.text, json: JSON.stringify(todo) },
    };
  },
);

export const pasteTodo = listZone.command(
  "pasteTodo",
  (ctx, payload: { id?: string }) => {
    const clip = ctx.state.ui.clipboard;
    if (!clip || clip.todos.length === 0) return { state: ctx.state };

    let lastNewId = "";
    return {
      state: produce(ctx.state, (draft) => {
        for (let i = 0; i < clip.todos.length; i++) {
          const sourceTodo = clip.todos[i]!;
          const newId = uid();
          lastNewId = newId;
          draft.data.todos[newId] = {
            id: newId,
            text: sourceTodo.text,
            completed: sourceTodo.completed,
            categoryId: draft.ui.selectedCategoryId,
          };
          if (payload.id) {
            const focusIndex = draft.data.todoOrder.indexOf(payload.id);
            if (focusIndex !== -1) {
              draft.data.todoOrder.splice(focusIndex + 1 + i, 0, newId);
            } else {
              draft.data.todoOrder.push(newId);
            }
          } else {
            draft.data.todoOrder.push(newId);
          }
        }
      }),
      dispatch: FOCUS({ zoneId: "list", itemId: lastNewId }),
    };
  },
);

export const undoCommand = listZone.command(
  "undo",
  (ctx) => {
    // when: canUndo guarantees past.length > 0
    const past = ctx.state.history.past;
    const lastEntry = past.at(-1)!;
    const groupId = lastEntry.groupId;

    // Count consecutive entries with the same groupId from the end
    let entriesToPop = 1;
    if (groupId) {
      entriesToPop = 0;
      for (let i = past.length - 1; i >= 0; i--) {
        if (past[i]!.groupId === groupId) {
          entriesToPop++;
        } else {
          break;
        }
      }
    }

    // The snapshot to restore is from the EARLIEST entry being undone
    const earliestUndoEntry = past[past.length - entriesToPop]!;
    const restoreSnapshot = earliestUndoEntry.snapshot;

    const focusTarget = lastEntry.focusedItemId
      ? String(lastEntry.focusedItemId)
      : undefined;

    return {
      state: produce(ctx.state, (draft) => {
        // Save current state for redo
        const { history: _h, ...currentWithoutHistory } = ctx.state;
        draft.history.future.push({
          command: { type: "UNDO_SNAPSHOT" },
          timestamp: Date.now(),
          snapshot: currentWithoutHistory,
          groupId,
        });

        // Pop all grouped entries
        for (let i = 0; i < entriesToPop; i++) {
          draft.history.past.pop();
        }

        // Restore from the earliest entry's snapshot
        if (restoreSnapshot) {
          if (restoreSnapshot.data) draft.data = restoreSnapshot.data;
          if (restoreSnapshot.ui) draft.ui = restoreSnapshot.ui;
        }
      }),
      dispatch: focusTarget
        ? FOCUS({ zoneId: "list", itemId: focusTarget })
        : undefined,
    };
  },
  { when: canUndo },
);

export const redoCommand = listZone.command(
  "redo",
  (ctx) => {
    // when: canRedo guarantees future.length > 0
    const entry = ctx.state.history.future.at(-1)!;
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
  { when: canRedo },
);

// Zone binding
export const TodoListUI = listZone.bind({
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
  keybindings: [{ key: "Meta+D", command: duplicateTodo }],
});

// ═══════════════════════════════════════════════════════════════════
// TodoSidebar Zone — category selection + ordering
// ═══════════════════════════════════════════════════════════════════

const sidebarZone = TodoApp.createZone("sidebar");

export const selectCategory = sidebarZone.command(
  "selectCategory",
  (ctx, payload: { id?: string }) => {
    const id = payload?.id;
    if (!id || typeof id !== "string") return { state: ctx.state };
    return {
      state: produce(ctx.state, (draft) => {
        draft.ui.selectedCategoryId = id;
      }),
    };
  },
);

export const moveCategoryUp = sidebarZone.command("moveCategoryUp", (ctx) => ({
  state: produce(ctx.state, (draft) => {
    const id = ctx.state.ui.selectedCategoryId;
    const idx = draft.data.categoryOrder.indexOf(id);
    if (idx > 0) {
      const prev = draft.data.categoryOrder[idx - 1]!;
      draft.data.categoryOrder[idx - 1] = id;
      draft.data.categoryOrder[idx] = prev;
    }
  }),
}));

export const moveCategoryDown = sidebarZone.command(
  "moveCategoryDown",
  (ctx) => ({
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

export const TodoSidebarUI = sidebarZone.bind({
  role: "listbox",
  onAction: selectCategory,
  onMoveUp: moveCategoryUp,
  onMoveDown: moveCategoryDown,
});

// ═══════════════════════════════════════════════════════════════════
// TodoDraft Zone — draft input field
// ═══════════════════════════════════════════════════════════════════

const draftZone = TodoApp.createZone("draft");

export const syncDraft = draftZone.command(
  "syncDraft",
  (ctx, payload: { text: string }) => ({
    state: produce(ctx.state, (draft) => {
      draft.ui.draft = payload.text;
    }),
  }),
);

export const addTodo = draftZone.command(
  "addTodo",
  (ctx, payload: { text?: string }) => ({
    state: produce(ctx.state, (draft) => {
      const text = payload?.text ?? draft.ui.draft;
      if (text?.trim()) {
        const newId = uid();
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

export const TodoDraftUI = draftZone.bind({
  role: "textbox",
  field: {
    onChange: syncDraft,
    onSubmit: addTodo,
  },
});

// ═══════════════════════════════════════════════════════════════════
// TodoEdit Zone — edit field
// ═══════════════════════════════════════════════════════════════════

const editZone = TodoApp.createZone("edit");

export const syncEditDraft = editZone.command(
  "syncEditDraft",
  (ctx, payload: { text: string }) => ({
    state: produce(ctx.state, (draft) => {
      draft.ui.editDraft = payload.text;
    }),
  }),
);

export const updateTodoText = editZone.command(
  "updateTodoText",
  (ctx, payload: { text: string }) => ({
    state: produce(ctx.state, (draft) => {
      if (!ctx.state.ui.editingId) return;
      const id = ctx.state.ui.editingId as string;
      if (draft.data.todos[id]) {
        draft.data.todos[id].text = payload.text || ctx.state.ui.editDraft;
      }
      draft.ui.editingId = null;
      draft.ui.editDraft = "";
    }),
  }),
);

export const cancelEdit = editZone.command(
  "cancelEdit",
  (ctx) => ({
    state: produce(ctx.state, (draft) => {
      draft.ui.editingId = null;
      draft.ui.editDraft = "";
    }),
  }),
  { when: isEditing },
);

export const TodoEditUI = editZone.bind({
  role: "textbox",
  field: {
    onChange: syncEditDraft,
    onSubmit: updateTodoText,
    onCancel: cancelEdit,
  },
});

// ═══════════════════════════════════════════════════════════════════
// TodoToolbar Zone — view toggle, clear completed
// ═══════════════════════════════════════════════════════════════════

const toolbarZone = TodoApp.createZone("toolbar");

export const toggleView = toolbarZone.command("toggleView", (ctx) => ({
  state: produce(ctx.state, (draft) => {
    draft.ui.viewMode = ctx.state.ui.viewMode === "board" ? "list" : "board";
  }),
}));

export const clearCompleted = toolbarZone.command("clearCompleted", (ctx) => ({
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
}));

export const TodoToolbarUI = toolbarZone.bind({
  role: "toolbar",
  keybindings: [{ key: "Meta+Shift+V", command: toggleView }],
});

// ═══════════════════════════════════════════════════════════════════
// v3 Compat Aliases — widget imports use these names
// Allows: import { TodoList, TodoSidebar } from "@apps/todo/app"
// ═══════════════════════════════════════════════════════════════════

export const TodoList = {
  ...TodoListUI,
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
};

export const TodoSidebar = {
  ...TodoSidebarUI,
  commands: {
    selectCategory,
    moveCategoryUp,
    moveCategoryDown,
  },
};

export const TodoDraft = {
  ...TodoDraftUI,
  commands: {
    syncDraft,
    addTodo,
  },
};

export const TodoEdit = {
  ...TodoEditUI,
  commands: {
    syncEditDraft,
    updateTodoText,
    cancelEdit,
  },
};

export const TodoToolbar = {
  ...TodoToolbarUI,
  commands: {
    toggleView,
    clearCompleted,
  },
};
