import type { AppState, CommandType } from './types';
import { CommandRegistry, defineCommand } from './command';

// --- 1. Global / Infrastructure Commands --- (Constitution)

export const PatchCommand = defineCommand<AppState, Partial<AppState>, CommandType>({
    id: 'PATCH',
    run: (state, payload) => ({ ...state, ...payload })
});

export const SetFocusCommand = defineCommand<AppState, { id: any }, CommandType>({
    id: 'SET_FOCUS',
    run: (state, payload) => {
        if (state.focusId === payload.id) return state;
        return { ...state, focusId: payload.id };
    }
});

// --- 2. SideBar Portfolio ---

export const SideBarCommands = [
    defineCommand<AppState, any, CommandType>({
        id: 'MOVE_CATEGORY_UP',
        kb: ['ArrowUp'],
        run: (state) => {
            const idx = state.categories.findIndex(c => c.id === state.focusId);
            return idx <= 0 ? state : { ...state, focusId: state.categories[idx - 1].id };
        }
    }),
    defineCommand<AppState, any, CommandType>({
        id: 'MOVE_CATEGORY_DOWN',
        kb: ['ArrowDown'],
        run: (state) => {
            const idx = state.categories.findIndex(c => c.id === state.focusId);
            return (idx === -1 || idx >= state.categories.length - 1) ? state : { ...state, focusId: state.categories[idx + 1].id };
        }
    }),
    defineCommand<AppState, { id?: string }, CommandType>({
        id: 'SELECT_CATEGORY',
        kb: ['Enter', ' '],
        run: (state, payload) => {
            const id = payload?.id || (state.focusId as string);
            return (!id || typeof id !== 'string') ? state : { ...state, selectedCategoryId: id };
        }
    }),
    defineCommand<AppState, any, CommandType>({
        id: 'JUMP_TO_LIST',
        kb: ['ArrowRight'],
        run: (state) => ({ ...state, focusId: 'DRAFT' })
    })
];

export const SIDEBAR_REGISTRY = new CommandRegistry<AppState, CommandType>();
SideBarCommands.forEach(cmd => SIDEBAR_REGISTRY.register(cmd));

// --- 3. TodoList Portfolio ---

export const TodoListCommands = [
    defineCommand<AppState, any, CommandType>({
        id: 'ADD_TODO',
        kb: ['Enter'],
        when: 'isInputFocused',
        run: (state, payload) => {
            const text = payload?.text || state.draft;
            if (!text || !text.trim()) return state;
            const newTodo = { id: Date.now(), text: text.trim(), completed: false, categoryId: state.selectedCategoryId };
            return { ...state, todos: [...state.todos, newTodo], draft: '', editDraft: '' };
        }
    }),
    defineCommand<AppState, { id?: number }, CommandType>({
        id: 'TOGGLE_TODO',
        kb: [' '],
        run: (state, payload) => {
            const targetId = payload?.id || state.focusId;
            if (targetId === null || targetId === 'DRAFT') return state;
            return { ...state, todos: state.todos.map(t => String(t.id) == String(targetId) ? { ...t, completed: !t.completed } : t) };
        }
    }),
    defineCommand<AppState, { id?: number }, CommandType>({
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
    }),
    defineCommand<AppState, any, CommandType>({
        id: 'MOVE_FOCUS_UP',
        kb: ['ArrowUp'],
        when: '!isEditing',
        run: (state) => {
            const focusIndex = state.focusId === 'DRAFT' ? -1 : state.todos.findIndex(t => String(t.id) === String(state.focusId));
            const nextFocus = focusIndex === 0 ? 'DRAFT' : (focusIndex > 0 ? state.todos[focusIndex - 1].id : state.focusId);
            return { ...state, focusId: nextFocus };
        }
    }),
    defineCommand<AppState, any, CommandType>({
        id: 'MOVE_FOCUS_DOWN',
        kb: ['ArrowDown'],
        when: '!isEditing',
        run: (state) => {
            const focusIndex = state.focusId === 'DRAFT' ? -1 : state.todos.findIndex(t => String(t.id) === String(state.focusId));
            const nextFocus = focusIndex < state.todos.length - 1 ? state.todos[focusIndex + 1].id : state.focusId;
            return { ...state, focusId: nextFocus };
        }
    }),
    defineCommand<AppState, any, CommandType>({
        id: 'START_EDIT',
        kb: ['Enter'],
        when: '!isEditing',
        run: (state) => {
            if (state.focusId === 'DRAFT' || typeof state.focusId !== 'number') return state;
            const todo = state.todos.find(t => t.id === state.focusId);
            return { ...state, editingId: state.focusId, editDraft: todo?.text || '' };
        }
    }),
    defineCommand<AppState, any, CommandType>({
        id: 'JUMP_TO_SIDEBAR',
        kb: ['ArrowLeft'],
        run: (state) => ({ ...state, focusId: state.selectedCategoryId })
    }),
    defineCommand<AppState, { text: string }, CommandType>({
        id: 'SYNC_EDIT_DRAFT',
        run: (state, payload) => ({ ...state, editDraft: payload.text })
    }),
    defineCommand<AppState, any, CommandType>({
        id: 'CANCEL_EDIT',
        kb: ['Escape'],
        when: 'isEditing',
        run: (state) => ({ ...state, editingId: null, editDraft: '' })
    }),
    defineCommand<AppState, any, CommandType>({
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
    })
];

export const TODO_LIST_REGISTRY = new CommandRegistry<AppState, CommandType>();
TodoListCommands.forEach(cmd => TODO_LIST_REGISTRY.register(cmd));

// --- 4. Constitutional Global Registry ---

export const GLOBAL_COMMANDS = [PatchCommand, SetFocusCommand];
export const CONSTITUTION_REGISTRY = new CommandRegistry<AppState, CommandType>();
GLOBAL_COMMANDS.forEach(cmd => CONSTITUTION_REGISTRY.register(cmd));
