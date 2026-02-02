import type { AppState } from './types';
import { CommandRegistry } from './command';
import { createCommandFactory } from './definition';
import { produce } from 'immer';

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
    run: (s) => s // Handled by middleware
});

export const Redo = defineCommand({
    id: 'REDO',
    run: (s) => s // Handled by middleware
});

// 2. Sidebar
export const MoveCategoryUp = defineCommand({
    id: 'MOVE_CATEGORY_UP',
    run: (state) => produce(state, draft => {
        const currentId = state.ui.focusId as string;
        const idx = draft.data.categoryOrder.indexOf(currentId);
        if (idx <= 0) return;

        // Swap in Order Array
        [draft.data.categoryOrder[idx], draft.data.categoryOrder[idx - 1]] =
            [draft.data.categoryOrder[idx - 1], draft.data.categoryOrder[idx]];
    })
});

export const MoveCategoryDown = defineCommand({
    id: 'MOVE_CATEGORY_DOWN',
    run: (state) => produce(state, draft => {
        const currentId = state.ui.focusId as string;
        const idx = draft.data.categoryOrder.indexOf(currentId);
        if (idx === -1 || idx >= draft.data.categoryOrder.length - 1) return;

        // Swap in Order Array
        [draft.data.categoryOrder[idx], draft.data.categoryOrder[idx + 1]] =
            [draft.data.categoryOrder[idx + 1], draft.data.categoryOrder[idx]];
    })
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
    run: (state) => produce(state, draft => {
        const text = draft.ui.draft;
        if (!text || !text.trim()) return;

        const newId = Date.now();
        const newTodo = {
            id: newId,
            text: text.trim(),
            completed: false,
            categoryId: draft.ui.selectedCategoryId
        };

        // Add to Entity Map
        draft.data.todos[newId] = newTodo;
        // Add to Order Array
        draft.data.todoOrder.push(newId);

        // Reset UI
        draft.ui.draft = '';
        draft.ui.editDraft = '';
    })
});

export const ImportTodos = defineCommand({
    id: 'IMPORT_TODOS',
    run: (state, payload: { items: any[] }) => produce(state, draft => {
        if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) return;

        payload.items.forEach((item, idx) => {
            const id = Date.now() + idx;
            draft.data.todos[id] = {
                id,
                text: typeof item === 'string' ? item : (item.text || 'Untitled'),
                completed: typeof item === 'object' ? item.completed || false : false,
                categoryId: draft.ui.selectedCategoryId
            };
            draft.data.todoOrder.push(id);
        });
    })
});

export const ToggleTodo = defineCommand({
    id: 'TOGGLE_TODO',
    run: (state, payload: { id?: number } = {}) => produce(state, draft => {
        const targetId = payload?.id || (state.ui.focusId as number);
        // Guard against string focusId (categories)
        if (typeof targetId !== 'number') return;

        const todo = draft.data.todos[targetId];
        if (todo) {
            todo.completed = !todo.completed;
        }
    })
});

export const DeleteTodo = defineCommand({
    id: 'DELETE_TODO',
    run: (state, payload: { id?: number } = {}) => produce(state, draft => {
        const targetId = payload?.id || (state.ui.focusId as number);
        if (typeof targetId !== 'number') return;

        // Delete from Map
        delete draft.data.todos[targetId];
        // Remove from Order
        const idx = draft.data.todoOrder.indexOf(targetId);
        if (idx !== -1) {
            draft.data.todoOrder.splice(idx, 1);
        }
    })
});

export const MoveFocusUp = defineCommand({
    id: 'MOVE_FOCUS_UP',
    run: (state) => {
        const { selectedCategoryId, focusId } = state.ui;
        // Derived Logic: We need to know previous item in the filtered list
        const visibleIds = state.data.todoOrder.filter(id => state.data.todos[id]?.categoryId === selectedCategoryId);

        // 1. If currently DRAFT or draft, move to last item
        if (focusId === 'DRAFT' || focusId === 'draft') {
            const lastId = visibleIds.length > 0 ? visibleIds[visibleIds.length - 1] : 'DRAFT';
            return { ...state, ui: { ...state.ui, focusId: lastId } };
        }

        // 2. Find current index
        const currentIdx = visibleIds.indexOf(focusId as number);

        // 3. If first item, move to DRAFT
        if (currentIdx === 0) {
            return { ...state, ui: { ...state.ui, focusId: 'DRAFT' } };
        }

        // 4. Move to previous
        if (currentIdx > 0) {
            return { ...state, ui: { ...state.ui, focusId: visibleIds[currentIdx - 1] } };
        }

        return state;
    }
});

export const MoveFocusDown = defineCommand({
    id: 'MOVE_FOCUS_DOWN',
    run: (state) => {
        const { selectedCategoryId, focusId } = state.ui;
        // Derived Logic
        const visibleIds = state.data.todoOrder.filter(id => state.data.todos[id]?.categoryId === selectedCategoryId);

        // 1. If currently DRAFT, move to first item
        if (focusId === 'DRAFT' || focusId === 'draft') {
            const firstId = visibleIds.length > 0 ? visibleIds[0] : 'DRAFT';
            return { ...state, ui: { ...state.ui, focusId: firstId } };
        }

        // 2. Find current index
        const currentIdx = visibleIds.indexOf(focusId as number);

        // 3. If last item, move to DRAFT (Loop)
        if (currentIdx === visibleIds.length - 1) {
            return { ...state, ui: { ...state.ui, focusId: 'DRAFT' } };
        }

        // 4. Move to next
        if (currentIdx !== -1) {
            return { ...state, ui: { ...state.ui, focusId: visibleIds[currentIdx + 1] } };
        }

        return state;
    }
});

export const MoveItemUp = defineCommand({
    id: 'MOVE_ITEM_UP',
    run: (state) => produce(state, draft => {
        const focusId = state.ui.focusId as number;
        if (typeof focusId !== 'number') return;

        // Strategy: We are moving items within the GLOBAL 'todoOrder'.
        // BUT, visually we are sorting a subset. 
        // Be careful: If we just swap global indices, it works IF the items are adjacent globally.
        // If there are hidden items in between, we need to decide:
        // Option A: Swap with the *visual* neighbor (jumping over hidden items).
        // Option B: Restricted to same category?
        // Let's go with Option A: Swap mechanism in 'todoOrder' by finding the indices of the two items we want to swap.

        const visibleIds = state.data.todoOrder.filter(id => state.data.todos[id]?.categoryId === state.ui.selectedCategoryId);
        const visualIdx = visibleIds.indexOf(focusId);

        if (visualIdx <= 0) return; // Cannot move up

        const targetId = focusId;
        const swapId = visibleIds[visualIdx - 1]; // Previous item in stored list

        const globalTargetIdx = draft.data.todoOrder.indexOf(targetId);
        const globalSwapIdx = draft.data.todoOrder.indexOf(swapId);

        // Swap in Global Order
        [draft.data.todoOrder[globalTargetIdx], draft.data.todoOrder[globalSwapIdx]] =
            [draft.data.todoOrder[globalSwapIdx], draft.data.todoOrder[globalTargetIdx]];
    })
});

export const MoveItemDown = defineCommand({
    id: 'MOVE_ITEM_DOWN',
    run: (state) => produce(state, draft => {
        const focusId = state.ui.focusId as number;
        if (typeof focusId !== 'number') return;

        const visibleIds = state.data.todoOrder.filter(id => state.data.todos[id]?.categoryId === state.ui.selectedCategoryId);
        const visualIdx = visibleIds.indexOf(focusId);

        if (visualIdx === -1 || visualIdx >= visibleIds.length - 1) return;

        const targetId = focusId;
        const swapId = visibleIds[visualIdx + 1]; // Next item

        const globalTargetIdx = draft.data.todoOrder.indexOf(targetId);
        const globalSwapIdx = draft.data.todoOrder.indexOf(swapId);

        // Swap in Global Order
        [draft.data.todoOrder[globalTargetIdx], draft.data.todoOrder[globalSwapIdx]] =
            [draft.data.todoOrder[globalSwapIdx], draft.data.todoOrder[globalTargetIdx]];
    })
});

export const StartEdit = defineCommand({
    id: 'START_EDIT',
    run: (state, payload: { id?: number } = {}) => produce(state, draft => {
        const targetId = payload?.id !== undefined ? payload.id : state.ui.focusId;
        if (targetId === 'DRAFT' || typeof targetId !== 'number') return;

        const todo = draft.data.todos[targetId];
        draft.ui.editingId = targetId;
        draft.ui.editDraft = todo?.text || '';
    })
});

export const JumpToSidebar = defineCommand({
    id: 'JUMP_TO_SIDEBAR',
    run: (state) => ({ ...state, ui: { ...state.ui, focusId: state.ui.selectedCategoryId } })
});

// Sidebar Navigation
export const MoveSidebarFocusUp = defineCommand({
    id: 'MOVE_SIDEBAR_FOCUS_UP',
    run: (state) => {
        const order = state.data.categoryOrder;
        const currentId = state.ui.focusId as string;
        const idx = order.indexOf(currentId);

        if (idx <= 0) return state;
        return { ...state, ui: { ...state.ui, focusId: order[idx - 1] } };
    }
});

export const MoveSidebarFocusDown = defineCommand({
    id: 'MOVE_SIDEBAR_FOCUS_DOWN',
    run: (state) => {
        const order = state.data.categoryOrder;
        const currentId = state.ui.focusId as string;
        const idx = order.indexOf(currentId);

        if (idx === -1 || idx >= order.length - 1) return state;
        return { ...state, ui: { ...state.ui, focusId: order[idx + 1] } };
    }
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

    run: (state) => ({ ...state, ui: { ...state.ui, editingId: null, editDraft: '' } })
});

export const UpdateTodoText = defineCommand({
    id: 'UPDATE_TODO_TEXT',
    run: (state) => produce(state, draft => {
        if (!state.ui.editingId) return;
        const id = state.ui.editingId as number;
        if (draft.data.todos[id]) {
            draft.data.todos[id].text = state.ui.editDraft;
        }
        draft.ui.editingId = null;
        draft.ui.editDraft = '';
    })
});

// --- Exports & Registries ---

// Group collections
export const GlobalCommands = [Patch, SetFocus, Undo, Redo];
export const SideBarCommands = [MoveCategoryUp, MoveCategoryDown, SelectCategory, JumpToList, MoveSidebarFocusUp, MoveSidebarFocusDown, ...GlobalCommands];
export const TodoListCommands = [
    AddTodo, ImportTodos, ToggleTodo, DeleteTodo, MoveFocusUp, MoveFocusDown,
    MoveItemUp, MoveItemDown,
    StartEdit, JumpToSidebar, SyncDraft, SyncEditDraft, CancelEdit, UpdateTodoText,
    ...GlobalCommands
];

// Unified Command List (Flattened & Unique for Type Inference)
// We use a Set to ensure uniqueness if groups overlap, but for type inference array is fine.
const ALL_COMMANDS = [...new Set([...GlobalCommands, ...SideBarCommands, ...TodoListCommands])];

// Auto-Infer the Union Type from the factories!
export type InferredTodoCommand = ReturnType<typeof ALL_COMMANDS[number]>;

// Registries
export const UNIFIED_TODO_REGISTRY = new CommandRegistry<AppState, any>();

// Register all commands
ALL_COMMANDS.forEach(cmd => UNIFIED_TODO_REGISTRY.register(cmd));

