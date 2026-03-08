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
import { defineApp } from "@os-sdk/app/defineApp";
import { history } from "@os-sdk/app/modules/history";
import {
  OS_CHECK,
  OS_FIELD_START_EDIT,
  OS_NOTIFY,
  OS_OVERLAY_CLOSE,
  OS_OVERLAY_OPEN,
  OS_SELECTION_CLEAR,
  os,
} from "@os-sdk/os";
import { produce } from "immer";
import { z } from "zod";

/** Collision-free random ID */
const uid = () => Math.random().toString(36).slice(2, 10);

// ═══════════════════════════════════════════════════════════════════
// App
// ═══════════════════════════════════════════════════════════════════

export const TodoApp = defineApp<AppState>("todo-v5", INITIAL_STATE, {
  modules: [history()],
});

// Undo / Redo — generic factory
import { createUndoRedoCommands } from "@os-sdk/app/defineApp/undoRedo";

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
} from "@os-sdk/library/collection/createCollectionZone";

const listCollection = createCollectionZone(TodoApp, "list", {
  ...fromEntities(
    (s: AppState) => s.data.todos,
    (s: AppState) => s.data.todoOrder,
  ),
  create: (payload, state) => {
    const { text } = payload as { text: string };
    if (!text?.trim()) return null;
    return {
      id: uid(),
      text: text.trim(),
      completed: false,
      categoryId: state.ui.selectedCategoryId,
    };
  },
  filter: (state) => (item) => item.categoryId === state.ui.selectedCategoryId,
  text: (item) => item.text,
  onPaste: (item, state) => ({
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
    dispatch: Object.keys(ctx.state.data.todos).some((id) =>
      payload.ids.includes(id),
    )
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
        OS_NOTIFY({
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

// DnD reorder — moves item to new position in todoOrder
const reorderTodo = listCollection.command(
  "reorderTodo",
  (
    ctx,
    payload: {
      itemId: string;
      overItemId: string;
      position: "before" | "after";
    },
  ) => ({
    state: produce(ctx.state, (draft) => {
      const { itemId, overItemId, position } = payload;
      const order = draft.data.todoOrder;
      const fromIndex = order.indexOf(itemId);
      if (fromIndex === -1) return;

      // Remove from current position
      order.splice(fromIndex, 1);

      // Find target position
      let toIndex = order.indexOf(overItemId);
      if (toIndex === -1) return;
      if (position === "after") toIndex += 1;

      // Insert at new position
      order.splice(toIndex, 0, itemId);
    }),
  }),
);

// ── List trigger declarations (single source, used in both bind + namespace) ──

function getSelectedIds(zoneId: string): string[] {
  const items = os.getState().os.focus.zones[zoneId]?.items;
  return items
    ? Object.keys(items).filter((id) => items[id]?.["aria-selected"])
    : [];
}

export const TodoListUI = listCollection.bind({
  role: "listbox",
  options: {
    dismiss: { escape: "deselect" },
    select: { mode: "multiple", range: true, toggle: true, followFocus: false },
    inputmap: { Space: [OS_CHECK()] },
  },
  onCheck: (cursor) => toggleTodo({ id: cursor.focusId }),
  onAction: (cursor) => startEdit({ id: cursor.focusId }),
  ...listBindings,
  onDelete: (cursor) =>
    requestDeleteTodo({
      ids: cursor.selection.length > 0 ? cursor.selection : [cursor.focusId],
    }),
  onUndo: undoCommand(),
  onRedo: redoCommand(),
  onReorder: (info) => {
    os.dispatch(reorderTodo(info));
  },
  triggers: {
    StartEdit: (fid: string) => startEdit({ id: fid }),
    MoveItemUp: (fid: string) => moveItemUp({ id: fid }),
    MoveItemDown: (fid: string) => moveItemDown({ id: fid }),
    DeleteTodo: (fid: string) => deleteTodo({ id: fid }),
    ToggleTodo: (fid: string) => toggleTodo({ id: fid }),
    BulkDelete: () => {
      const selected = getSelectedIds("list");
      return requestDeleteTodo({ ids: selected.length > 0 ? selected : [] });
    },
    BulkToggle: () => {
      const selected = getSelectedIds("list");
      return bulkToggleCompleted({ ids: selected });
    },
  },
});

// ═══════════════════════════════════════════════════════════════════
// TodoSidebar Zone — category selection + ordering
// ═══════════════════════════════════════════════════════════════════

const sidebarCollection = createCollectionZone(TodoApp, "sidebar", {
  ...fromEntities(
    (s: AppState) => s.data.categories,
    (s: AppState) => s.data.categoryOrder,
  ),
  text: (item) => item.text,
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
  triggers: {
    SelectCategory: (fid: string) => selectCategory({ id: fid }),
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
    fieldName: "DRAFT",
    onCommit: addTodo,
    trigger: "enter",
    resetOnSubmit: true,
    schema: z.string().min(1, "Hal is watching"),
  },
  onUndo: undoCommand(),
  onRedo: redoCommand(),
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
      const id = ctx.state.ui.editingId;
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
    fieldName: "EDIT",
    onCommit: updateTodoText,
    trigger: "enter",
    onCancel: cancelEdit(),
  },
  onUndo: undoCommand(),
  onRedo: redoCommand(),
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

export const clearSearch = searchZone.command("clearSearch", (ctx) => ({
  state: produce(ctx.state, (draft) => {
    draft.ui.searchQuery = "";
  }),
}));

export const TodoSearchUI = searchZone.bind({
  role: "textbox",
  field: {
    fieldName: "SEARCH",
    onCommit: setSearchQuery,
    trigger: "change",
    onCancel: clearSearch(),
  },
  triggers: {
    ClearSearch: () => clearSearch(),
  },
});

// ═══════════════════════════════════════════════════════════════════
// TodoToolbar Zone — view toggle, clear completed
// ═══════════════════════════════════════════════════════════════════

const toolbarZone = TodoApp.createZone("toolbar");

export const toggleView = toolbarZone.command(
  "toggleView",
  (ctx) => ({
    state: produce(ctx.state, (draft) => {
      draft.ui.viewMode = ctx.state.ui.viewMode === "board" ? "list" : "board";
    }),
  }),
  { key: "Meta+Shift+V" },
);

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
    dispatch: OS_NOTIFY({
      message: `${completedIds.length} completed task${completedIds.length > 1 ? "s" : ""} cleared`,
      actionLabel: "Undo",
      actionCommand: undoCommand(),
    }),
  };
});

export const TodoToolbarUI = toolbarZone.bind({
  role: "toolbar",
  triggers: {
    ToggleView: () => toggleView(),
    Undo: () => undoCommand(),
    Redo: () => redoCommand(),
  },
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
    ...TodoListUI.triggers,
    DeleteDialog: listCollection.overlay("todo-delete-dialog", {
      confirm: confirmDeleteTodo(),
      role: "alertdialog",
    }),
  },
};

export const TodoSidebar = {
  ...TodoSidebarUI,
  commands: {
    selectCategory,
    moveCategoryUp: sidebarCollection.moveUp,
    moveCategoryDown: sidebarCollection.moveDown,
  },
  triggers: TodoSidebarUI.triggers,
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
  triggers: TodoSearchUI.triggers,
};

export const TodoToolbar = {
  ...TodoToolbarUI,
  commands: {
    toggleView,
    clearCompleted,
  },
  triggers: TodoToolbarUI.triggers,
  ClearDialog: toolbarZone.overlay("todo-clear-dialog", {
    confirm: clearCompleted(),
    role: "alertdialog",
  }),
};
export { listCollection };
