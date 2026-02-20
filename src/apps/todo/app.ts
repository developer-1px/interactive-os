/**
 * Todo App v5 — defineApp native (flat handlers, branded types).
 *
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
import { z } from "zod";
import { OS_FIELD_START_EDIT } from "@/os/3-commands/field/field";

import { defineApp } from "@/os/defineApp";

/** Collision-free random ID */
const uid = () => Math.random().toString(36).slice(2, 10);

// ═══════════════════════════════════════════════════════════════════
// App
// ═══════════════════════════════════════════════════════════════════

export const TodoApp = defineApp<AppState>("todo-v5", INITIAL_STATE, {
  history: true,
});

// Undo / Redo — generic factory
import { createUndoRedoCommands } from "@/os/defineApp.undoRedo";

export const { canUndo, canRedo, undoCommand, redoCommand } =
  createUndoRedoCommands(TodoApp, { focusZoneId: "list" });

export const isEditing = TodoApp.condition(
  "isEditing",
  (s) => s.ui.editingId != null,
);

export const hasClipboard = TodoApp.condition(
  "hasClipboard",
  () => true, // Clipboard is OS-managed — always available for paste attempt
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
// TodoList Zone — Collection Zone Facade + app-specific commands
// ═══════════════════════════════════════════════════════════════════

import {
  createCollectionZone,
  fromEntities,
} from "@/os/collection/createCollectionZone";

const listCollection = createCollectionZone(TodoApp, "list", {
  ...fromEntities(
    (s: AppState) => s.data.todos,
    (s: AppState) => s.data.todoOrder,
  ),
  filter: (state: AppState) => (item: Todo) =>
    item.categoryId === state.ui.selectedCategoryId,
  text: (item: Todo) => item.text,
  onPaste: (item: Todo, state: AppState) => ({
    ...item,
    categoryId: state.ui.selectedCategoryId,
  }),
});

// Re-export for backward compatibility
export const deleteTodo = listCollection.remove;
export const moveItemUp = listCollection.moveUp;
export const moveItemDown = listCollection.moveDown;
export const duplicateTodo = listCollection.duplicate;
export const copyTodo = listCollection.copy;
export const cutTodo = listCollection.cut;
export const pasteTodo = listCollection.paste;

// ── App-specific commands on the collection zone ──

export const toggleTodo = listCollection.command(
  "toggleTodo",
  (ctx, payload: { id: string }) => ({
    state: produce(ctx.state, (draft) => {
      const todo = draft.data.todos[payload.id];
      if (todo) todo.completed = !todo.completed;
    }),
  }),
);

export const startEdit = listCollection.command(
  "startEdit",
  (ctx, payload: { id: string }) => ({
    state: produce(ctx.state, (draft) => {
      if (!payload.id) return;
      draft.ui.editingId = payload.id;
    }),
    // Also set OS-level editingItemId so Field auto-focuses
    dispatch: OS_FIELD_START_EDIT(),
  }),
);

// Zone binding — auto-wired CRUD + clipboard + app-specific handlers
const listBindings = listCollection.collectionBindings();
export const TodoListUI = listCollection.bind({
  role: "listbox",
  onCheck: (cursor) => toggleTodo({ id: cursor.focusId }),
  onAction: (cursor) => startEdit({ id: cursor.focusId }),
  ...listBindings,
  onUndo: undoCommand(),
  onRedo: redoCommand(),
  keybindings: [...listBindings.keybindings],
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
  onAction: (cursor) => selectCategory({ id: cursor.focusId }),
  onMoveUp: () => moveCategoryUp(),
  onMoveDown: () => moveCategoryDown(),
});

// ═══════════════════════════════════════════════════════════════════
// TodoDraft Zone — draft input field
// ═══════════════════════════════════════════════════════════════════

const draftZone = TodoApp.createZone("draft");

export const addTodo = draftZone.command(
  "addTodo",
  (ctx, payload: { text: string }) => ({
    state: produce(ctx.state, (draft) => {
      const text = payload.text;
      if (text?.trim()) {
        const newId = uid();
        draft.data.todos[newId] = {
          id: newId,
          text: text.trim(),
          completed: false,
          categoryId: draft.ui.selectedCategoryId,
        };
        draft.data.todoOrder.push(newId);
      }
    }),
  }),
);

export const TodoDraftUI = draftZone.bind({
  role: "textbox",
  field: {
    onCommit: addTodo,
    trigger: "enter",
    resetOnSubmit: true,
    schema: z.string().min(1, "Hal is watching"),
    // Wait, Field checks schema against string value.
    // Zod schema should be z.string().min(1).
    // My Field.tsx checks schema.safeParse(currentValue). currentValue is string.
  },
});

// ═══════════════════════════════════════════════════════════════════
// TodoEdit Zone — edit field
// ═══════════════════════════════════════════════════════════════════

const editZone = TodoApp.createZone("edit");

export const updateTodoText = editZone.command(
  "updateTodoText",
  (ctx, payload: { text: string }) => ({
    state: produce(ctx.state, (draft) => {
      if (!ctx.state.ui.editingId) return;
      const id = ctx.state.ui.editingId as string;
      if (draft.data.todos[id]) {
        // Must use payload.text directly. No fallback.
        if (payload.text) {
          draft.data.todos[id].text = payload.text;
        }
      }
      draft.ui.editingId = null;
    }),
  }),
);

export const cancelEdit = editZone.command(
  "cancelEdit",
  (ctx) => ({
    state: produce(ctx.state, (draft) => {
      draft.ui.editingId = null;
    }),
  }),
  { when: isEditing },
);

export const TodoEditUI = editZone.bind({
  role: "textbox",
  field: {
    onCommit: updateTodoText, // Factory without call
    trigger: "enter",
    onCancel: cancelEdit(), // Command (Result of Factory) matches BaseCommand
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
  keybindings: [{ key: "Meta+Shift+V", command: () => toggleView() }],
});

// ═══════════════════════════════════════════════════════════════════
// Namespaced Exports — widget imports use these names
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
  triggers: {
    ToggleTodo: TodoApp.createTrigger(toggleTodo),
    DeleteTodo: TodoApp.createTrigger(deleteTodo),
    StartEdit: TodoApp.createTrigger(startEdit),
    MoveItemUp: TodoApp.createTrigger(moveItemUp),
    MoveItemDown: TodoApp.createTrigger(moveItemDown),
  },
};

export const TodoSidebar = {
  ...TodoSidebarUI,
  commands: {
    selectCategory,
    moveCategoryUp,
    moveCategoryDown,
  },
  triggers: {
    SelectCategory: TodoApp.createTrigger(selectCategory),
  },
};

export const TodoDraft = {
  ...TodoDraftUI,
  commands: {
    addTodo,
  },
};

export const TodoEdit = {
  ...TodoEditUI,
  commands: {
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
  ClearDialog: TodoApp.createTrigger({
    id: "todo-clear-dialog",
    confirm: clearCompleted(),
  }),
};
export { listCollection };
