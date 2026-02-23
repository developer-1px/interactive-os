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
import type { AppState, Category, Todo } from "@apps/todo/model/appState";
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
import { OS_OVERLAY_OPEN, OS_OVERLAY_CLOSE } from "@/os/3-commands/overlay/overlay";
import { OS_SELECTION_CLEAR } from "@/os/3-commands/selection/selection";
import { OS_TOAST_SHOW } from "@/os/3-commands/toast/toast";

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
  createUndoRedoCommands(TodoApp);

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
  create: (payload: { text: string }, state: AppState): Todo | null => {
    if (!payload.text?.trim()) return null;
    return {
      id: uid(),
      text: payload.text.trim(),
      completed: false,
      categoryId: state.ui.selectedCategoryId,
    };
  },
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

export const requestDeleteTodo = listCollection.command(
  "requestDeleteTodo",
  (ctx, payload: { ids: string[] }) => ({
    state: produce(ctx.state, (draft) => {
      draft.ui.pendingDeleteIds = payload.ids;
    }),
    dispatch: Object.keys(ctx.state.data.todos).some((id) => payload.ids.includes(id))
      ? [
        // Close first to clear any stale overlay from HMR or interrupted flow
        OS_OVERLAY_CLOSE({ id: "todo-delete-dialog" }),
        OS_OVERLAY_OPEN({ id: "todo-delete-dialog", type: "dialog" }),
      ]
      : undefined,
  }),
);

export const confirmDeleteTodo = listCollection.command(
  "confirmDeleteTodo",
  (ctx) => {
    const ids = ctx.state.ui.pendingDeleteIds;
    if (!ids || ids.length === 0) return { state: ctx.state };

    return {
      state: produce(ctx.state, (draft) => {
        for (const id of ids) {
          listCollection.removeFromDraft(draft, id);
        }
        draft.ui.pendingDeleteIds = [];
      }),
      // Focus recovery is automatic: OS_OVERLAY_CLOSE → applyFocusPop
      // detects stale focusedItemId via zone's getItems, resolves to neighbor.
      dispatch: [
        OS_OVERLAY_CLOSE({ id: "todo-delete-dialog" }),
        OS_SELECTION_CLEAR({ zoneId: "list" }),
        OS_TOAST_SHOW({
          message: `${ids.length} task${ids.length > 1 ? "s" : ""} deleted`,
          actionLabel: "Undo",
          actionCommand: undoCommand(),
        }),
      ],
    };
  },
);

export const cancelDeleteTodo = listCollection.command(
  "cancelDeleteTodo",
  (ctx) => ({
    state: produce(ctx.state, (draft) => {
      draft.ui.pendingDeleteIds = [];
    }),
    dispatch: OS_OVERLAY_CLOSE({ id: "todo-delete-dialog" }),
  }),
);

export const bulkToggleCompleted = listCollection.command(
  "bulkToggleCompleted",
  (ctx, payload: { ids: string[] }) => ({
    state: produce(ctx.state, (draft) => {
      const todos = payload.ids
        .map((id) => draft.data.todos[id])
        .filter((t): t is Todo => !!t);
      // If any are incomplete → mark all complete; else mark all incomplete
      const allCompleted = todos.every((t) => t.completed);
      todos.forEach((t) => {
        t.completed = !allCompleted;
      });
    }),
  }),
);

// Zone binding — auto-wired CRUD + clipboard + app-specific handlers
const listBindings = listCollection.collectionBindings();
export const TodoListUI = listCollection.bind({
  role: "listbox",
  options: { dismiss: { escape: "deselect" } },
  onCheck: (cursor) => toggleTodo({ id: cursor.focusId }),
  onAction: (cursor) => startEdit({ id: cursor.focusId }),
  ...listBindings,
  onDelete: (cursor) => requestDeleteTodo({
    ids: cursor.selection.length > 0 ? cursor.selection : [cursor.focusId]
  }),
  onUndo: undoCommand(),
  onRedo: redoCommand(),
  keybindings: [...listBindings.keybindings],
});

// ═══════════════════════════════════════════════════════════════════
// TodoSidebar Zone — category selection + ordering
// ═══════════════════════════════════════════════════════════════════

const sidebarCollection = createCollectionZone(TodoApp, "sidebar", {
  ...fromEntities(
    (s: AppState) => s.data.categories,
    (s: AppState) => s.data.categoryOrder,
  ),
  text: (item: Category) => item.text,
});

export const selectCategory = sidebarCollection.command(
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

const sidebarBindings = sidebarCollection.collectionBindings();
export const TodoSidebarUI = sidebarCollection.bind({
  role: "listbox",
  onAction: (cursor) => selectCategory({ id: cursor.focusId }),
  onSelect: (cursor) => selectCategory({ id: cursor.focusId }),
  onMoveUp: sidebarBindings.onMoveUp,
  onMoveDown: sidebarBindings.onMoveDown,
  getItems: sidebarBindings.getItems,
  options: {
    select: { followFocus: true },
  },
});

// ═══════════════════════════════════════════════════════════════════
// TodoDraft Zone — draft input field
// ═══════════════════════════════════════════════════════════════════

const draftZone = TodoApp.createZone("draft");

export const addTodo = listCollection.add!;

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
// TodoSearch Zone — search input field
// ═══════════════════════════════════════════════════════════════════

const searchZone = TodoApp.createZone("search");

export const setSearchQuery = searchZone.command(
  "setSearchQuery",
  (ctx, payload: { text: string }) => ({
    state: produce(ctx.state, (draft) => {
      draft.ui.searchQuery = payload.text;
    }),
  }),
);

export const clearSearch = searchZone.command(
  "clearSearch",
  (ctx) => ({
    state: produce(ctx.state, (draft) => {
      draft.ui.searchQuery = "";
    }),
  }),
);

export const TodoSearchUI = searchZone.bind({
  role: "textbox",
  field: {
    onCommit: setSearchQuery,
    trigger: "change",
    onCancel: clearSearch(),
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

export const clearCompleted = toolbarZone.command("clearCompleted", (ctx) => {
  const completedIds = Object.values(ctx.state.data.todos)
    .filter((t) => t.completed)
    .map((t) => t.id);

  if (completedIds.length === 0) return { state: ctx.state };

  return {
    state: produce(ctx.state, (draft) => {
      completedIds.forEach((id) => {
        listCollection.removeFromDraft(draft, id);
      });
    }),
    dispatch: OS_TOAST_SHOW({
      message: `${completedIds.length} completed task${completedIds.length > 1 ? "s" : ""} cleared`,
      actionLabel: "Undo",
      actionCommand: undoCommand(),
    }),
  };
});

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
    requestDeleteTodo,
    confirmDeleteTodo,
    cancelDeleteTodo,
    bulkToggleCompleted,
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
    DeleteDialog: TodoApp.createTrigger({
      id: "todo-delete-dialog",
      confirm: confirmDeleteTodo(),
      role: "alertdialog",
    }),
    StartEdit: TodoApp.createTrigger(startEdit),
    MoveItemUp: TodoApp.createTrigger(moveItemUp),
    MoveItemDown: TodoApp.createTrigger(moveItemDown),
  },
};

export const TodoSidebar = {
  ...TodoSidebarUI,
  commands: {
    selectCategory,
    moveCategoryUp: sidebarCollection.moveUp,
    moveCategoryDown: sidebarCollection.moveDown,
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

export const TodoSearch = {
  ...TodoSearchUI,
  commands: {
    setSearchQuery,
    clearSearch,
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
    role: "alertdialog",
  }),
};
export { listCollection };
