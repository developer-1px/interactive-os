import type { AppState } from './types';
import { CommandRegistry } from './command';
import { createCommandFactory } from './definition';
// 1. Context-Aware Factories
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

    allowInInput: true,
    run: (s) => s // Handled by middleware
});

export const Redo = defineCommand({
    id: 'REDO',

    allowInInput: true,
    run: (s) => s // Handled by middleware
});

// 2. Sidebar
export const MoveCategoryUp = defineCommand({
    id: 'MOVE_CATEGORY_UP',

    // Pure Logic: Swaps category with previous one if possible
    run: (state) => {
        const idx = state.data.categories.findIndex(c => c.id === state.ui.focusId);
        if (idx <= 0) return state; // Guard

        // Swap logic...
        const newCats = [...state.data.categories];
        [newCats[idx], newCats[idx - 1]] = [newCats[idx - 1], newCats[idx]];

        return { ...state, data: { ...state.data, categories: newCats } };
    }
});

export const MoveCategoryDown = defineCommand({
    id: 'MOVE_CATEGORY_DOWN',

    run: (state) => {
        const idx = state.data.categories.findIndex(c => c.id === state.ui.focusId);
        if (idx === -1 || idx >= state.data.categories.length - 1) return state; // Guard

        // Swap logic...
        const newCats = [...state.data.categories];
        [newCats[idx], newCats[idx + 1]] = [newCats[idx + 1], newCats[idx]];

        return { ...state, data: { ...state.data, categories: newCats } };
    }
});

export const SelectCategory = defineCommand({
    id: 'SELECT_CATEGORY',

    run: (state, payload: { id?: string } = {}) => {
        const id = payload?.id || (state.ui.focusId as string);
        return (!id || typeof id !== 'string') ? state : { ...state, ui: { ...state.ui, selectedCategoryId: id } };
    }
});

export const JumpToList = defineCommand({
    id: 'JUMP_TO_LIST',

    run: (state) => ({ ...state, ui: { ...state.ui, focusId: 'DRAFT' } })
});

// 3. TodoList
export const AddTodo = defineCommand({
    id: 'ADD_TODO',
    allowInInput: true,
    // when deleted: strictly guarded by Keybinding (isDraftFocused)
    run: (state) => {
        const text = state.ui.draft;
        if (!text || !text.trim()) return state;
        const newTodo = { id: Date.now(), text: text.trim(), completed: false, categoryId: state.ui.selectedCategoryId };
        return {
            ...state,
            data: { ...state.data, todos: [...state.data.todos, newTodo] },
            ui: { ...state.ui, draft: '', editDraft: '' }
        };
    }
});

export const ImportTodos = defineCommand({
    id: 'IMPORT_TODOS',
    run: (state, payload: { items: any[] }) => {
        if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) return state;

        const newTodos = payload.items.map((item, idx) => ({
            id: Date.now() + idx,
            text: typeof item === 'string' ? item : (item.text || 'Untitled'),
            completed: typeof item === 'object' ? item.completed || false : false,
            categoryId: state.ui.selectedCategoryId
        }));

        return {
            ...state,
            data: { ...state.data, todos: [...state.data.todos, ...newTodos] }
        };
    }
});

export const ToggleTodo = defineCommand({
    id: 'TOGGLE_TODO',

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

    run: (state) => {
        const { focusId, selectedCategoryId } = state.ui;
        if (typeof focusId !== 'number') return state; // Guard

        const allTodos = state.data.todos;
        const visibleTodos = allTodos.filter(t => t.categoryId === selectedCategoryId);
        const focusIndex = visibleTodos.findIndex(t => t.id === focusId);

        if (focusIndex <= 0) return state; // Guard

        // Swap logic
        const newTodos = [...allTodos];
        const globalIdx = newTodos.findIndex(t => t.id === focusId);
        const prevItem = visibleTodos[focusIndex - 1];
        const prevGlobalIdx = newTodos.findIndex(t => t.id === prevItem.id);

        [newTodos[globalIdx], newTodos[prevGlobalIdx]] = [newTodos[prevGlobalIdx], newTodos[globalIdx]];

        return { ...state, data: { ...state.data, todos: newTodos } };
    }
});

export const MoveItemDown = defineCommand({
    id: 'MOVE_ITEM_DOWN',

    run: (state) => {
        const { focusId, selectedCategoryId } = state.ui;
        if (typeof focusId !== 'number') return state; // Guard

        const allTodos = state.data.todos;
        const visibleTodos = allTodos.filter(t => t.categoryId === selectedCategoryId);
        const focusIndex = visibleTodos.findIndex(t => t.id === focusId);

        if (focusIndex === -1 || focusIndex >= visibleTodos.length - 1) return state; // Guard

        // Swap logic
        const newTodos = [...allTodos];
        const globalIdx = newTodos.findIndex(t => t.id === focusId);
        const nextItem = visibleTodos[focusIndex + 1];
        const nextGlobalIdx = newTodos.findIndex(t => t.id === nextItem.id);

        [newTodos[globalIdx], newTodos[nextGlobalIdx]] = [newTodos[nextGlobalIdx], newTodos[globalIdx]];

        return { ...state, data: { ...state.data, todos: newTodos } };
    }
});

export const StartEdit = defineCommand({
    id: 'START_EDIT',

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

    allowInInput: true,
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

    allowInInput: true,
    run: (state) => ({ ...state, ui: { ...state.ui, editingId: null, editDraft: '' } })
});

export const UpdateTodoText = defineCommand({
    id: 'UPDATE_TODO_TEXT',
    allowInInput: true,
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
    | ReturnType<typeof ImportTodos>
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
    AddTodo, ImportTodos, ToggleTodo, DeleteTodo, MoveFocusUp, MoveFocusDown,
    MoveItemUp, MoveItemDown,
    StartEdit, JumpToSidebar, SyncDraft, SyncEditDraft, CancelEdit, UpdateTodoText,
    ...GlobalCommands
];

// Registries
export const UNIFIED_TODO_REGISTRY = new CommandRegistry<AppState, any>();

// Register all commands
const ALL_COMMAND_GROUPS = [GlobalCommands, SideBarCommands, TodoListCommands];
ALL_COMMAND_GROUPS.flat().forEach(cmd => UNIFIED_TODO_REGISTRY.register(cmd));

