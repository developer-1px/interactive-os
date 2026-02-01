import type { AppState } from './types';
import { CommandRegistry } from './command';
import { createHelper } from './definition';

// --- Defines ---

// 1. Global
export const Patch = createHelper<AppState, Partial<AppState>>({
    id: 'PATCH',
    run: (state, payload) => ({ ...state, ...payload })
});

export const SetFocus = createHelper<AppState, { id: any }>({
    id: 'SET_FOCUS',
    run: (state, payload) => {
        if (state.focusId === payload.id) return state;
        return { ...state, focusId: payload.id };
    }
});

// 2. Sidebar
export const MoveCategoryUp = createHelper<AppState, any>({
    id: 'MOVE_CATEGORY_UP',
    kb: ['ArrowUp'],
    run: (state) => {
        const idx = state.categories.findIndex(c => c.id === state.focusId);
        return idx <= 0 ? state : { ...state, focusId: state.categories[idx - 1].id };
    }
});

export const MoveCategoryDown = createHelper<AppState, any>({
    id: 'MOVE_CATEGORY_DOWN',
    kb: ['ArrowDown'],
    run: (state) => {
        const idx = state.categories.findIndex(c => c.id === state.focusId);
        return (idx === -1 || idx >= state.categories.length - 1) ? state : { ...state, focusId: state.categories[idx + 1].id };
    }
});

export const SelectCategory = createHelper<AppState, { id?: string }>({
    id: 'SELECT_CATEGORY',
    kb: ['Enter', ' '],
    run: (state, payload) => {
        const id = payload?.id || (state.focusId as string);
        return (!id || typeof id !== 'string') ? state : { ...state, selectedCategoryId: id };
    }
});

export const JumpToList = createHelper<AppState, any>({
    id: 'JUMP_TO_LIST',
    kb: ['ArrowRight'],
    run: (state) => ({ ...state, focusId: 'DRAFT' })
});

// 3. TodoList
export const AddTodo = createHelper<AppState, { text?: string }>({
    id: 'ADD_TODO',
    kb: ['Enter'],
    when: 'isInputFocused',
    run: (state, payload) => {
        const text = payload?.text || state.draft;
        if (!text || !text.trim()) return state;
        const newTodo = { id: Date.now(), text: text.trim(), completed: false, categoryId: state.selectedCategoryId };
        return { ...state, todos: [...state.todos, newTodo], draft: '', editDraft: '' };
    }
});

export const ToggleTodo = createHelper<AppState, { id?: number }>({
    id: 'TOGGLE_TODO',
    kb: [' '],
    run: (state, payload) => {
        const targetId = payload?.id || state.focusId;
        if (targetId === null || targetId === 'DRAFT') return state;
        return { ...state, todos: state.todos.map(t => String(t.id) == String(targetId) ? { ...t, completed: !t.completed } : t) };
    }
});

export const DeleteTodo = createHelper<AppState, { id?: number }>({
    id: 'DELETE_TODO',
    kb: ['Delete', 'Backspace'],
    run: (state, payload) => {
        const targetId = payload?.id || state.focusId;
        const remaining = state.todos.filter(t => String(t.id) !== String(targetId));
        if (remaining.length === state.todos.length) return state;
        const idx = state.todos.findIndex(t => String(t.id) === String(targetId));
        let nextFocus = state.focusId;
        if (String(state.focusId) === String(targetId)) {
            nextFocus = remaining[idx]?.id || remaining[idx - 1]?.id || 'DRAFT';
        }
        return { ...state, todos: remaining, focusId: nextFocus };
    }
});

export const MoveFocusUp = createHelper<AppState, any>({
    id: 'MOVE_FOCUS_UP',
    kb: ['ArrowUp'],
    when: '!isEditing',
    run: (state) => {
        const visibleTodos = state.todos.filter(t => t.categoryId === state.selectedCategoryId);
        const focusIndex = state.focusId === 'DRAFT' || state.focusId === 'draft' ? -1 : visibleTodos.findIndex(t => String(t.id) === String(state.focusId));

        if (focusIndex === -1 && state.focusId !== 'DRAFT' && state.focusId !== 'draft') return { ...state, focusId: 'DRAFT' };

        let nextFocus: string | number | null = state.focusId;
        if (state.focusId === 'DRAFT' || state.focusId === 'draft') {
            nextFocus = visibleTodos.length > 0 ? visibleTodos[visibleTodos.length - 1].id : 'DRAFT';
        } else if (focusIndex === 0) {
            nextFocus = 'DRAFT';
        } else {
            nextFocus = visibleTodos[focusIndex - 1].id;
        }
        return { ...state, focusId: nextFocus };
    }
});

export const MoveFocusDown = createHelper<AppState, any>({
    id: 'MOVE_FOCUS_DOWN',
    kb: ['ArrowDown'],
    when: '!isEditing',
    run: (state) => {
        const visibleTodos = state.todos.filter(t => t.categoryId === state.selectedCategoryId);
        const focusIndex = state.focusId === 'DRAFT' || state.focusId === 'draft' ? -1 : visibleTodos.findIndex(t => String(t.id) === String(state.focusId));

        if (focusIndex === -1 && state.focusId !== 'DRAFT' && state.focusId !== 'draft') return { ...state, focusId: 'DRAFT' };

        let nextFocus: string | number | null = state.focusId;
        if (state.focusId === 'DRAFT' || state.focusId === 'draft') {
            nextFocus = visibleTodos.length > 0 ? visibleTodos[0].id : 'DRAFT';
        } else if (focusIndex < visibleTodos.length - 1) {
            nextFocus = visibleTodos[focusIndex + 1].id;
        } else {
            nextFocus = 'DRAFT';
        }
        return { ...state, focusId: nextFocus };
    }
});

export const StartEdit = createHelper<AppState, { id?: number }>({
    id: 'START_EDIT',
    kb: ['Enter'],
    when: '!isEditing',
    run: (state, payload) => {
        // Allow explicit payload ID or fallback to focusId
        const targetId = payload?.id !== undefined ? payload.id : state.focusId;

        if (targetId === 'DRAFT' || typeof targetId !== 'number') return state;
        const todo = state.todos.find(t => t.id === targetId);
        return { ...state, editingId: targetId, editDraft: todo?.text || '' };
    }
});

export const JumpToSidebar = createHelper<AppState, any>({
    id: 'JUMP_TO_SIDEBAR',
    kb: ['ArrowLeft'],
    run: (state) => ({ ...state, focusId: state.selectedCategoryId })
});

export const SyncEditDraft = createHelper<AppState, { text: string }>({
    id: 'SYNC_EDIT_DRAFT',
    run: (state, payload) => ({ ...state, editDraft: payload.text })
});

export const CancelEdit = createHelper<AppState, any>({
    id: 'CANCEL_EDIT',
    kb: ['Escape'],
    when: 'isEditing',
    run: (state) => ({ ...state, editingId: null, editDraft: '' })
});

export const UpdateTodoText = createHelper<AppState, any>({
    id: 'UPDATE_TODO_TEXT',
    kb: ['Enter'],
    when: 'isEditing',
    run: (state) => {
        if (!state.editingId) return state;
        return {
            ...state,
            editingId: null,
            editDraft: '',
            todos: state.todos.map(t => t.id === state.editingId ? { ...t, text: state.editDraft } : t)
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
    | ReturnType<typeof StartEdit>
    | ReturnType<typeof JumpToSidebar>
    | ReturnType<typeof SyncEditDraft>
    | ReturnType<typeof CancelEdit>
    | ReturnType<typeof UpdateTodoText>;

// Group collections
export const SideBarCommands = [MoveCategoryUp, MoveCategoryDown, SelectCategory, JumpToList];
export const TodoListCommands = [
    AddTodo, ToggleTodo, DeleteTodo, MoveFocusUp, MoveFocusDown,
    StartEdit, JumpToSidebar, SyncEditDraft, CancelEdit, UpdateTodoText
];
export const GlobalCommands = [Patch, SetFocus];

// Registries
// Note: CommandRegistry expects CommandDefinition, which our Helper IS (compatible with interface).
export const SIDEBAR_REGISTRY = new CommandRegistry<AppState, any>(); // any for payload generic
SideBarCommands.forEach(cmd => SIDEBAR_REGISTRY.register(cmd));

export const TODO_LIST_REGISTRY = new CommandRegistry<AppState, any>();
TodoListCommands.forEach(cmd => TODO_LIST_REGISTRY.register(cmd));

export const CONSTITUTION_REGISTRY = new CommandRegistry<AppState, any>();
GlobalCommands.forEach(cmd => CONSTITUTION_REGISTRY.register(cmd));
