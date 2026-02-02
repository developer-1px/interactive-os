import type { AppState } from './types';
import { CommandRegistry } from './command';
import { createCommandFactory } from './definition';

// --- Defines ---

// Initialize factory with State type ONCE.
const defineCommand = createCommandFactory<AppState>();

// 1. Global

export const Patch = defineCommand({
    id: 'PATCH',
    run: (state, payload: Partial<AppState>) => ({ ...state, ...payload })
});

export const SetFocus = defineCommand({
    id: 'SET_FOCUS',
    run: (state, payload: { id: any }) => {
        if (state.ui.focusId === payload.id) return state;
        return { ...state, ui: { ...state.ui, focusId: payload.id } };
    }
});

export const Undo = defineCommand({
    id: 'UNDO',
    kb: ['Meta+z'],
    allowInInput: true,
    run: (s) => s // Handled by middleware
});

export const Redo = defineCommand({
    id: 'REDO',
    kb: ['Meta+Shift+z'],
    allowInInput: true,
    run: (s) => s // Handled by middleware
});

// 2. Sidebar
export const MoveCategoryUp = defineCommand({
    id: 'MOVE_CATEGORY_UP',
    kb: ['ArrowUp'],
    enabled: (state) => {
        const idx = state.data.categories.findIndex(c => c.id === state.ui.focusId);
        return idx > 0;
    },
    run: (state) => {
        const idx = state.data.categories.findIndex(c => c.id === state.ui.focusId);
        return idx <= 0 ? state : { ...state, ui: { ...state.ui, focusId: state.data.categories[idx - 1].id } };
    }
});

export const MoveCategoryDown = defineCommand({
    id: 'MOVE_CATEGORY_DOWN',
    kb: ['ArrowDown'],
    enabled: (state) => {
        const idx = state.data.categories.findIndex(c => c.id === state.ui.focusId);
        return idx !== -1 && idx < state.data.categories.length - 1;
    },
    run: (state) => {
        const idx = state.data.categories.findIndex(c => c.id === state.ui.focusId);
        return (idx === -1 || idx >= state.data.categories.length - 1) ? state : { ...state, ui: { ...state.ui, focusId: state.data.categories[idx + 1].id } };
    }
});

export const SelectCategory = defineCommand({
    id: 'SELECT_CATEGORY',
    kb: ['Enter', ' '],
    run: (state, payload: { id?: string } = {}) => {
        const id = payload?.id || (state.ui.focusId as string);
        return (!id || typeof id !== 'string') ? state : { ...state, ui: { ...state.ui, selectedCategoryId: id } };
    }
});

export const JumpToList = defineCommand({
    id: 'JUMP_TO_LIST',
    kb: ['ArrowRight'],
    run: (state) => ({ ...state, ui: { ...state.ui, focusId: 'DRAFT' } })
});

// 3. TodoList
export const AddTodo = defineCommand({
    id: 'ADD_TODO',
    kb: ['Enter'],
    when: 'isInputFocused',
    allowInInput: true,
    enabled: (state) => !!state.ui.draft.trim(),  // Disabled if draft is empty (UI feedback)
    run: (state, payload: { text?: string } = {}) => {
        const text = payload?.text || state.ui.draft;
        if (!text || !text.trim()) return state;
        const newTodo = { id: Date.now(), text: text.trim(), completed: false, categoryId: state.ui.selectedCategoryId };
        return {
            ...state,
            data: { ...state.data, todos: [...state.data.todos, newTodo] },
            ui: { ...state.ui, draft: '', editDraft: '' }
        };
    }
});

export const ToggleTodo = defineCommand({
    id: 'TOGGLE_TODO',
    kb: [' '],
    enabled: (state) => typeof state.ui.focusId === 'number',
    run: (state, payload: { id?: number } = {}) => {
        const targetId = payload?.id || state.ui.focusId;
        if (targetId === null || targetId === 'DRAFT') return state;
        return {
            ...state,
            data: {
                ...state.data,
                todos: state.data.todos.map(t => String(t.id) == String(targetId) ? { ...t, completed: !t.completed } : t)
            }
        };
    }
});

export const DeleteTodo = defineCommand({
    id: 'DELETE_TODO',
    kb: ['Delete', 'Backspace'],
    enabled: (state) => typeof state.ui.focusId === 'number',
    run: (state, payload: { id?: number } = {}) => {
        const targetId = payload?.id || state.ui.focusId;

        // Perform Delete
        const remaining = state.data.todos.filter(t => String(t.id) !== String(targetId));
        if (remaining.length === state.data.todos.length) return state;

        return {
            ...state,
            data: { ...state.data, todos: remaining }
            // Note: ui.focusId is NOT updated here. Middleware handles it via ensureFocusIntegrity.
        };
    }
});

export const MoveFocusUp = defineCommand({
    id: 'MOVE_FOCUS_UP',
    kb: ['ArrowUp'],
    when: '!isEditing',
    allowInInput: true,
    run: (state) => {
        const visibleTodos = state.data.todos.filter(t => t.categoryId === state.ui.selectedCategoryId);
        const focusIndex = state.ui.focusId === 'DRAFT' || state.ui.focusId === 'draft' ? -1 : visibleTodos.findIndex(t => String(t.id) === String(state.ui.focusId));

        if (focusIndex === -1 && state.ui.focusId !== 'DRAFT' && state.ui.focusId !== 'draft') return { ...state, ui: { ...state.ui, focusId: 'DRAFT' } };

        let nextFocus: string | number | null = state.ui.focusId;
        if (state.ui.focusId === 'DRAFT' || state.ui.focusId === 'draft') {
            nextFocus = visibleTodos.length > 0 ? visibleTodos[visibleTodos.length - 1].id : 'DRAFT';
        } else if (focusIndex === 0) {
            nextFocus = 'DRAFT';
        } else {
            nextFocus = visibleTodos[focusIndex - 1].id;
        }
        return { ...state, ui: { ...state.ui, focusId: nextFocus } };
    }
});

export const MoveFocusDown = defineCommand({
    id: 'MOVE_FOCUS_DOWN',
    kb: ['ArrowDown'],
    when: '!isEditing',
    allowInInput: true,
    run: (state) => {
        const visibleTodos = state.data.todos.filter(t => t.categoryId === state.ui.selectedCategoryId);
        const focusIndex = state.ui.focusId === 'DRAFT' || state.ui.focusId === 'draft' ? -1 : visibleTodos.findIndex(t => String(t.id) === String(state.ui.focusId));

        if (focusIndex === -1 && state.ui.focusId !== 'DRAFT' && state.ui.focusId !== 'draft') return { ...state, ui: { ...state.ui, focusId: 'DRAFT' } };

        let nextFocus: string | number | null = state.ui.focusId;
        if (state.ui.focusId === 'DRAFT' || state.ui.focusId === 'draft') {
            nextFocus = visibleTodos.length > 0 ? visibleTodos[0].id : 'DRAFT';
        } else if (focusIndex < visibleTodos.length - 1) {
            nextFocus = visibleTodos[focusIndex + 1].id;
        } else {
            nextFocus = 'DRAFT';
        }
        return { ...state, ui: { ...state.ui, focusId: nextFocus } };
    }
});

export const MoveItemUp = defineCommand({
    id: 'MOVE_ITEM_UP',
    kb: ['Meta+ArrowUp'],
    when: '!isEditing && todoListFocus',
    enabled: (state) => {
        const { focusId, selectedCategoryId } = state.ui;
        if (typeof focusId !== 'number') return false;
        const visibleTodos = state.data.todos.filter(t => t.categoryId === selectedCategoryId);
        const focusIndex = visibleTodos.findIndex(t => t.id === focusId);
        return focusIndex > 0;
    },
    run: (state) => {
        const { focusId, selectedCategoryId } = state.ui;
        // Only works if a specific todo is focused
        if (typeof focusId !== 'number') return state;

        const allTodos = state.data.todos;
        const visibleTodos = allTodos.filter(t => t.categoryId === selectedCategoryId);
        const focusIndexInVisible = visibleTodos.findIndex(t => t.id === focusId);

        // Cannot move up if it's already at the top
        if (focusIndexInVisible <= 0) return state;

        const currentTodo = visibleTodos[focusIndexInVisible];
        const prevTodo = visibleTodos[focusIndexInVisible - 1];

        const idxCurrent = allTodos.findIndex(t => t.id === currentTodo.id);
        const idxPrev = allTodos.findIndex(t => t.id === prevTodo.id);

        const newTodos = [...allTodos];
        // Swap
        newTodos[idxCurrent] = prevTodo;
        newTodos[idxPrev] = currentTodo;

        return {
            ...state,
            data: { ...state.data, todos: newTodos }
        };
    }
});

export const MoveItemDown = defineCommand({
    id: 'MOVE_ITEM_DOWN',
    kb: ['Meta+ArrowDown'],
    when: '!isEditing && todoListFocus',
    enabled: (state) => {
        const { focusId, selectedCategoryId } = state.ui;
        if (typeof focusId !== 'number') return false;
        const visibleTodos = state.data.todos.filter(t => t.categoryId === selectedCategoryId);
        const focusIndex = visibleTodos.findIndex(t => t.id === focusId);
        return focusIndex !== -1 && focusIndex < visibleTodos.length - 1;
    },
    run: (state) => {
        const { focusId, selectedCategoryId } = state.ui;
        if (typeof focusId !== 'number') return state;

        const allTodos = state.data.todos;
        const visibleTodos = allTodos.filter(t => t.categoryId === selectedCategoryId);
        const focusIndexInVisible = visibleTodos.findIndex(t => t.id === focusId);

        // Cannot move down if at bottom
        if (focusIndexInVisible === -1 || focusIndexInVisible >= visibleTodos.length - 1) return state;

        const currentTodo = visibleTodos[focusIndexInVisible];
        const nextTodo = visibleTodos[focusIndexInVisible + 1];

        const idxCurrent = allTodos.findIndex(t => t.id === currentTodo.id);
        const idxNext = allTodos.findIndex(t => t.id === nextTodo.id);

        const newTodos = [...allTodos];
        // Swap
        newTodos[idxCurrent] = nextTodo;
        newTodos[idxNext] = currentTodo;

        return {
            ...state,
            data: { ...state.data, todos: newTodos }
        };
    }
});

export const StartEdit = defineCommand({
    id: 'START_EDIT',
    kb: ['Enter'],
    when: '!isEditing',
    enabled: (state) => typeof state.ui.focusId === 'number',
    run: (state, payload: { id?: number } = {}) => {
        // Allow explicit payload ID or fallback to focusId
        const targetId = payload?.id !== undefined ? payload.id : state.ui.focusId;

        if (targetId === 'DRAFT' || typeof targetId !== 'number') return state;
        const todo = state.data.todos.find(t => t.id === targetId);
        return { ...state, ui: { ...state.ui, editingId: targetId, editDraft: todo?.text || '' } };
    }
});

export const JumpToSidebar = defineCommand({
    id: 'JUMP_TO_SIDEBAR',
    kb: ['ArrowLeft'],
    allowInInput: true,
    when: '!isFieldFocused || cursorAtStart',
    run: (state) => ({ ...state, ui: { ...state.ui, focusId: state.ui.selectedCategoryId } })
});

export const SyncDraft = defineCommand({
    id: 'SYNC_DRAFT',
    log: false,
    run: (state, payload: { text: string }) => ({ ...state, ui: { ...state.ui, draft: payload.text } })
});

export const SyncEditDraft = defineCommand({
    id: 'SYNC_EDIT_DRAFT',
    log: false,
    run: (state, payload: { text: string }) => ({ ...state, ui: { ...state.ui, editDraft: payload.text } })
});

export const CancelEdit = defineCommand({
    id: 'CANCEL_EDIT',
    kb: ['Escape'],
    when: 'isEditing',
    allowInInput: true,
    run: (state) => ({ ...state, ui: { ...state.ui, editingId: null, editDraft: '' } })
});

export const UpdateTodoText = defineCommand({
    id: 'UPDATE_TODO_TEXT',
    kb: ['Enter'],
    when: 'isEditing',
    allowInInput: true,
    enabled: (state) => !!state.ui.editingId,
    run: (state) => {
        if (!state.ui.editingId) return state;
        return {
            ...state,
            data: {
                ...state.data,
                todos: state.data.todos.map(t => t.id === state.ui.editingId ? { ...t, text: state.ui.editDraft } : t)
            },
            ui: { ...state.ui, editingId: null, editDraft: '' }
        };
    }
});

// --- Exports & Registries ---

// We export the inferred union type!
export type InferredTodoCommand =
    | ReturnType<typeof Patch>
    | ReturnType<typeof SetFocus>
    | ReturnType<typeof MoveCategoryUp>
    | ReturnType<typeof MoveCategoryDown>
    | ReturnType<typeof SelectCategory>
    | ReturnType<typeof JumpToList>
    | ReturnType<typeof AddTodo>
    | ReturnType<typeof ToggleTodo>
    | ReturnType<typeof DeleteTodo>
    | ReturnType<typeof MoveFocusUp>
    | ReturnType<typeof MoveFocusDown>
    | ReturnType<typeof MoveItemUp>
    | ReturnType<typeof MoveItemDown>
    | ReturnType<typeof StartEdit>
    | ReturnType<typeof JumpToSidebar>
    | ReturnType<typeof SyncDraft>
    | ReturnType<typeof SyncEditDraft>
    | ReturnType<typeof CancelEdit>
    | ReturnType<typeof UpdateTodoText>
    | ReturnType<typeof Undo>
    | ReturnType<typeof Redo>;

// Group collections
export const GlobalCommands = [Patch, SetFocus, Undo, Redo];
export const SideBarCommands = [MoveCategoryUp, MoveCategoryDown, SelectCategory, JumpToList, ...GlobalCommands];
export const TodoListCommands = [
    AddTodo, ToggleTodo, DeleteTodo, MoveFocusUp, MoveFocusDown,
    MoveItemUp, MoveItemDown,
    StartEdit, JumpToSidebar, SyncDraft, SyncEditDraft, CancelEdit, UpdateTodoText,
    ...GlobalCommands
];

// Registries
// CommandRegistry expects CommandDefinition. 
// Our "Helper" (CommandFactory) *includes* properties of CommandDefinition (via intersection in definition.ts)
// BUT, the factory function type `CommandFactory` has `id`, `run`, etc. as properties.
// The `register` method expects `CommandDefinition`.
// Does `CommandFactory` extends `CommandDefinition`?
// In my `definition.ts`:
// interface CommandFactory extends CommandDefinition { ... } 
// Wait, I didn't extend it. I duplicated properties.
// And `CommandRegistry.register` expects `CommandDefinition`.
// Since the structure matches (structural typing), it MIGHT work.
// But `CommandFactory` is a function. `CommandDefinition` is an object.
// A function WITH properties is technically an object.
// Let's verify if `CommandRegistry` accepts it.

export const SIDEBAR_REGISTRY = new CommandRegistry<AppState, any>();
SideBarCommands.forEach(cmd => SIDEBAR_REGISTRY.register(cmd));

export const TODO_LIST_REGISTRY = new CommandRegistry<AppState, any>();
TodoListCommands.forEach(cmd => TODO_LIST_REGISTRY.register(cmd));

export const CONSTITUTION_REGISTRY = new CommandRegistry<AppState, any>();
GlobalCommands.forEach(cmd => CONSTITUTION_REGISTRY.register(cmd));
