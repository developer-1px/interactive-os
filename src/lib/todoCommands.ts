import type { AppState, OSEnvironment } from "./types";
import { CommandRegistry } from "./command";
import { createCommandFactory } from "./definition";
import { produce } from "immer";


// 1. Context-Aware Factories
const defineCommand = createCommandFactory<AppState, OSEnvironment>();

// 1. Global

export const Patch = defineCommand({
  id: "PATCH",
  run: (state, payload: Partial<AppState>) => ({ ...state, ...payload }),
});

export const SetFocus = defineCommand({
  id: "SET_FOCUS",
  run: (state, payload: { id: any }) => {
    // Auto-switch category if focusing a todo
    let nextCategory = state.ui.selectedCategoryId;
    if (typeof payload.id === "number") {
      const todo = state.data.todos[payload.id];
      if (todo) {
        nextCategory = todo.categoryId;
      }
    }
    // Also if focusing a category header directly (string id)
    if (typeof payload.id === "string" && state.data.categories[payload.id]) {
      nextCategory = payload.id;
    }

    return {
      ...state,
      ui: {
        ...state.ui,
        selectedCategoryId: nextCategory,
      },
      effects: [
        ...state.effects,
        { type: "FOCUS_ID", id: payload.id },
      ],
    };
  };
});

export const Undo = defineCommand({
  id: "UNDO",
  run: (s) => s, // Handled by middleware
});

export const Redo = defineCommand({
  id: "REDO",
  run: (s) => s, // Handled by middleware
});

// 2. Sidebar
export const MoveCategoryUp = defineCommand({
  id: "MOVE_CATEGORY_UP",
  run: (state) =>
    produce(state, (draft) => {
      const id = state.ui.selectedCategoryId;
      const idx = draft.data.categoryOrder.indexOf(id);
      if (idx > 0) {
        const prev = draft.data.categoryOrder[idx - 1];
        draft.data.categoryOrder[idx - 1] = id;
        draft.data.categoryOrder[idx] = prev;
      }
    }),
});

export const MoveCategoryDown = defineCommand({
  id: "MOVE_CATEGORY_DOWN",
  run: (state) =>
    produce(state, (draft) => {
      const id = state.ui.selectedCategoryId;
      const idx = draft.data.categoryOrder.indexOf(id);
      if (idx !== -1 && idx < draft.data.categoryOrder.length - 1) {
        const next = draft.data.categoryOrder[idx + 1];
        draft.data.categoryOrder[idx + 1] = id;
        draft.data.categoryOrder[idx] = next;
      }
    }),
});

export const SelectCategory = defineCommand({
  id: "SELECT_CATEGORY",

  run: (state, payload: { id?: string } = {}) => {
    const id = payload?.id;
    // Requires explicit payload now
    return !id || typeof id !== "string"
      ? state
      : { ...state, ui: { ...state.ui, selectedCategoryId: id } };
  },
});

export const JumpToList = defineCommand({
  id: "JUMP_TO_LIST",

  run: (state) => ({
    ...state,
    effects: [...state.effects, { type: "FOCUS_ID", id: "DRAFT" }],
  }),
});

// 3. TodoList
export const AddTodo = defineCommand({
  id: "ADD_TODO",
  run: (state) =>
    produce(state, (draft) => {
      const text = draft.ui.draft;
      if (!text || !text.trim()) return;

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
    }),
});

export const ImportTodos = defineCommand({
  id: "IMPORT_TODOS",
  run: (state, payload: { items: any[] }) =>
    produce(state, (draft) => {
      if (
        !payload.items ||
        !Array.isArray(payload.items) ||
        payload.items.length === 0
      )
        return;

      payload.items.forEach((item, index) => {
        const id = Date.now() + index;
        draft.data.todos[id] = {
          id,
          text: typeof item === "string" ? item : item.text || "Untitled",
          completed: typeof item === "object" ? item.completed || false : false,
          categoryId: draft.ui.selectedCategoryId,
        };
        draft.data.todoOrder.push(id);
      });
    }),
});

export const ToggleTodo = defineCommand({
  id: "TOGGLE_TODO",
  run: (state, payload: { id?: number } = {}, env) =>
    produce(state, (draft) => {
      // Use Payload OR Environment (Context Receiver Pattern)
      const targetId = payload.id !== undefined ? payload.id : Number(env.focusId);

      // Validate ID (must be number)
      if (!targetId || isNaN(targetId)) return;

      const todo = draft.data.todos[targetId];
      if (todo) {
        todo.completed = !todo.completed;
      }
    }),
});

export const DeleteTodo = defineCommand({
  id: "DELETE_TODO",
  run: (state, payload: { id?: number } = {}, env) =>
    produce(state, (draft) => {
      const targetId = payload.id !== undefined ? payload.id : Number(env.focusId);

      if (!targetId || isNaN(targetId)) return;

      // Delete from Map
      delete draft.data.todos[targetId];
      // Remove from Order
      const index = draft.data.todoOrder.indexOf(targetId);
      if (index !== -1) {
        draft.data.todoOrder.splice(index, 1);
      }
    }),
});

// Universal Navigation
export const NavigateUp = defineCommand({
  id: "NAVIGATE_UP",
  run: (state) => ({
    ...state,
    effects: [...state.effects, { type: "NAVIGATE", direction: "UP" }],
  }),
});

export const NavigateDown = defineCommand({
  id: "NAVIGATE_DOWN",
  run: (state) => ({
    ...state,
    effects: [...state.effects, { type: "NAVIGATE", direction: "DOWN" }],
  }),
});

export const NavigateLeft = defineCommand({
  id: "NAVIGATE_LEFT",
  run: (state, payload: { targetZone?: string } = {}) => {
    return {
      ...state,
      effects: [
        ...state.effects,
        { type: "NAVIGATE", direction: "LEFT", targetZone: payload.targetZone },
      ],
    };
  },
});

export const NavigateRight = defineCommand({
  id: "NAVIGATE_RIGHT",
  run: (state, payload: { targetZone?: string } = {}) => {
    return {
      ...state,
      effects: [
        ...state.effects,
        { type: "NAVIGATE", direction: "RIGHT", targetZone: payload.targetZone },
      ],
    };
  },
});

export const MoveItemUp = defineCommand({
  id: "MOVE_ITEM_UP",
  run: (state, payload: { focusId?: number } = {}, env) =>
    produce(state, (draft) => {
      const focusId = payload.focusId !== undefined ? payload.focusId : Number(env.focusId);

      if (!focusId || isNaN(focusId)) return;

      const visibleIds = state.data.todoOrder.filter(
        (id) =>
          state.data.todos[id]?.categoryId === state.ui.selectedCategoryId,
      );
      const visualIdx = visibleIds.indexOf(focusId);

      if (visualIdx <= 0) return;

      const targetId = focusId;
      const swapId = visibleIds[visualIdx - 1];

      const globalTargetIdx = draft.data.todoOrder.indexOf(targetId);
      const globalSwapIdx = draft.data.todoOrder.indexOf(swapId);

      [
        draft.data.todoOrder[globalTargetIdx],
        draft.data.todoOrder[globalSwapIdx],
      ] = [
          draft.data.todoOrder[globalSwapIdx],
          draft.data.todoOrder[globalTargetIdx],
        ];
    }),
});

export const MoveItemDown = defineCommand({
  id: "MOVE_ITEM_DOWN",
  run: (state, payload: { focusId?: number } = {}, env) =>
    produce(state, (draft) => {
      const focusId = payload.focusId !== undefined ? payload.focusId : Number(env.focusId);
      if (!focusId || isNaN(focusId)) return;

      const visibleIds = state.data.todoOrder.filter(
        (id) =>
          state.data.todos[id]?.categoryId === state.ui.selectedCategoryId,
      );
      const visualIdx = visibleIds.indexOf(focusId);

      if (visualIdx === -1 || visualIdx >= visibleIds.length - 1) return;

      const targetId = focusId;
      const swapId = visibleIds[visualIdx + 1];

      const globalTargetIdx = draft.data.todoOrder.indexOf(targetId);
      const globalSwapIdx = draft.data.todoOrder.indexOf(swapId);

      [
        draft.data.todoOrder[globalTargetIdx],
        draft.data.todoOrder[globalSwapIdx],
      ] = [
          draft.data.todoOrder[globalSwapIdx],
          draft.data.todoOrder[globalTargetIdx],
        ];
    }),
});

export const StartEdit = defineCommand({
  id: "START_EDIT",
  run: (state, payload: { id?: number } = {}, env) =>
    produce(state, (draft) => {
      const targetId = payload.id !== undefined ? payload.id : Number(env.focusId);
      if (!targetId || isNaN(targetId)) return;

      const todo = draft.data.todos[targetId];
      draft.ui.editingId = targetId;
      draft.ui.editDraft = todo?.text || "";
    }),
});

// JumpToSidebar Removed (Handled by Zone)


// Sidebar Navigation
export const MoveSidebarFocusUp = defineCommand({
  id: "MOVE_SIDEBAR_FOCUS_UP",
  run: (state) => {
    // We map generic sidebar navigation to effect.
    // Ideally we use generic NAVIGATE, but here we keep specific intent if needed.
    // For now, map to NAVIGATE UP/DOWN? No, "SIDEBAR_PREV" was a special token.
    // Let's map it to specific effect or generic navigate?
    // Let's blindly trust generic navigate handles it if we are IN the sidebar zone?
    // Actually the command says "MoveSidebarFocusUp".
    // Let's assume this means "Navigate Up" while in Sidebar.
    // So generic NAVIGATE UP is correct.
    return {
      ...state,
      effects: [...state.effects, { type: "NAVIGATE", direction: "UP" }],
    };
  },
});

export const MoveSidebarFocusDown = defineCommand({
  id: "MOVE_SIDEBAR_FOCUS_DOWN",
  run: (state) => ({
    ...state,
    effects: [...state.effects, { type: "NAVIGATE", direction: "DOWN" }],
  }),
});

export const SyncDraft = defineCommand({
  id: "SYNC_DRAFT",
  log: false,
  run: (state, payload: { text: string }) => ({
    ...state,
    ui: { ...state.ui, draft: payload.text },
  }),
});

export const SyncEditDraft = defineCommand({
  id: "SYNC_EDIT_DRAFT",
  log: false,
  run: (state, payload: { text: string }) => ({
    ...state,
    ui: { ...state.ui, editDraft: payload.text },
  }),
});

export const CancelEdit = defineCommand({
  id: "CANCEL_EDIT",

  run: (state) => ({
    ...state,
    ui: { ...state.ui, editingId: null, editDraft: "" },
  }),
});

export const UpdateTodoText = defineCommand({
  id: "UPDATE_TODO_TEXT",
  run: (state) =>
    produce(state, (draft) => {
      if (!state.ui.editingId) return;
      const id = state.ui.editingId as number;
      if (draft.data.todos[id]) {
        draft.data.todos[id].text = state.ui.editDraft;
      }
      draft.ui.editingId = null;
      draft.ui.editDraft = "";
    }),
});

// 4. Board View
export const ToggleView = defineCommand({
  id: "TOGGLE_VIEW",
  run: (state) => ({
    ...state,
    ui: {
      ...state.ui,
      viewMode: state.ui.viewMode === "board" ? "list" : "board",
    },
  }),
});

// NavigateColumn Removed (Handled by Zone)

// --- Exports & Registries ---

// Group collections
export const GlobalCommands = [Patch, SetFocus, Undo, Redo, ToggleView];
export const SideBarCommands = [
  MoveCategoryUp,
  MoveCategoryDown,
  SelectCategory,
  JumpToList,
  MoveSidebarFocusUp,
  MoveSidebarFocusDown,
  ...GlobalCommands,
];
export const TodoListCommands = [
  AddTodo,
  ImportTodos,
  ToggleTodo,
  ToggleTodo,
  DeleteTodo,
  NavigateUp,
  NavigateDown,
  NavigateLeft,
  NavigateRight,
  MoveItemUp,
  MoveItemDown,
  StartEdit,
  SyncDraft,
  SyncEditDraft,
  CancelEdit,
  UpdateTodoText,
  // NavigateColumn removed
  ...GlobalCommands,
];

// Unified Command List (Flattened & Unique for Type Inference)
// We use a Set to ensure uniqueness if groups overlap, but for type inference array is fine.
const ALL_COMMANDS = [
  ...new Set([...GlobalCommands, ...SideBarCommands, ...TodoListCommands]),
];

// Auto-Infer the Union Type from the factories!
export type InferredTodoCommand = ReturnType<(typeof ALL_COMMANDS)[number]>;

// Registries
export type TodoCommandId = InferredTodoCommand["type"];
export const UNIFIED_TODO_REGISTRY = new CommandRegistry<AppState, TodoCommandId, OSEnvironment>();

// Register all commands
ALL_COMMANDS.forEach((cmd) => UNIFIED_TODO_REGISTRY.register(cmd));
