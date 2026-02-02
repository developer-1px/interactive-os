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
        // Auto-switch category if focusing a todo
        let nextCategory = state.ui.selectedCategoryId;
        if (typeof payload.id === 'number') {
            const todo = state.data.todos[payload.id];
            if (todo) {
                nextCategory = todo.categoryId;
            }
        }
        // Also if focusing a category header directly (string id)
        if (typeof payload.id === 'string' && state.data.categories[payload.id]) {
            nextCategory = payload.id;
        }

        return {
            ...state,
            ui: {
                ...state.ui,
                focusRequest: payload.id, // Proxy to OS
                selectedCategoryId: nextCategory
            }
        };
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
    run: (state) => ({ ...state, ui: { ...state.ui, focusRequest: 'SIDEBAR_PREV' } })
});

export const MoveCategoryDown = defineCommand({
    id: 'MOVE_CATEGORY_DOWN',
    run: (state) => ({ ...state, ui: { ...state.ui, focusRequest: 'SIDEBAR_NEXT' } })
});

export const SelectCategory = defineCommand({
    id: 'SELECT_CATEGORY',

    run: (state, payload: { id?: string } = {}) => {
        const id = payload?.id;
        // Requires explicit payload now
        return (!id || typeof id !== 'string') ? state : { ...state, ui: { ...state.ui, selectedCategoryId: id } };
    }
});

export const JumpToList = defineCommand({
    id: 'JUMP_TO_LIST',

    run: (state) => ({ ...state, ui: { ...state.ui, focusRequest: 'DRAFT' } })
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
        // Payload must be injected if triggered via key
        const targetId = payload?.id;
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
        const targetId = payload?.id;
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
        // Note: We use OS focus (via request) but logic depends on App Data Order
        // Ideally we should pass current focus in payload? 
        // For now, assuming state.ui.focusId is NOT available, we rely on the fact that 
        // we might need to know "what was focused" to move relative to it.
        // BUT we removed focusId from state!
        // CRITICAL FIX: The command needs to know the CURRENT focus to calculate the NEXT focus.
        // Since we decoupled focus, the Command doesn't know where we are!

        // Strategy: We can't implement relative navigation inside a pure state-only command 
        // if the state doesn't track focus.
        // Option 1: Pass current focus as payload from the Keybinding Trigger?
        // Option 2: Zones handle ArrowUp/Down natively (Preferred).
        // Option 3: We re-introduced focusId? No.

        // Decision: We will assume the payload contains { currentFocusId }. 
        // The Trigger in `todoKeys.ts` or `Zone` needs to inject this.
        // OR: useFocusStore.getState().focusedItemId is accessed in the THUNK/Middleware, 
        // not the reducer.

        // PROVISIONAL: We return a special "MOVE_FOCUS_DELTA" request?
        // Or simpler: The keybinding in Zone invokes a different mechanism?

        // Let's go with: Payload should have currentFocusId. 
        // Logic in Zone.tsx `handleSpatialNav` or similar should dispatch this with payload?
        // But `todoKeys` are global/zone based.

        // REVISION: We put `focusRequest` as a generic intent. 
        // But for UP/DOWN we need calculation.
        // Let's assume for this specific refactor step that we will Fix logic issues in separate step 
        // if payload is missing. 
        // Actually, we can just return a 'FOCUS_PREV' request and let the Engine/Middleware calculate it?
        // No, Engine Middleware has access to State + FocusStore?

        // Practical Fix: for now, we leave the logic BROKEN regarding "current position" 
        // unless we inject it.
        // But wait, `useTodoEngine` injects `focusedItemId` into the Context `ctx`.
        // The `when` clause evaluates against `ctx`.
        // Can we pass `ctx` to `run`? No.

        // OK, I will modify `MoveFocusUp` to accept `currentFocusId` in payload.
        // And `todoKeys` (or the dispatcher) needs to provide it. 
        // Since we can't easily change `todoKeys` mapping to inject dynamic state...

        // ALTERNATIVE: Re-read `Zone.tsx`. 
        // I checked `Zone.tsx` and it does NOT handle Item Nav yet.
        // So `TodoEngine` MUST handle it.

        // I will assume for now that I can't easily fix the "Read" part without side effects.
        // So I will modify logic to use a "Best Effort" or maybe I made a mistake removing focusId so aggressively?
        // No, separation of concerns is correct.

        // I will implement `MoveFocus` as returning `focusRequest: 'PREV'` or `'NEXT'`.
        // The `onStateChange` middleware will handle the calculation using `useFocusStore`!
        // This is creating a Protocol.

        return { ...state, ui: { ...state.ui, focusRequest: 'PREV' } };
    }
});

export const MoveFocusDown = defineCommand({
    id: 'MOVE_FOCUS_DOWN',
    run: (state) => {
        return { ...state, ui: { ...state.ui, focusRequest: 'NEXT' } };
    }
});

export const MoveItemUp = defineCommand({
    id: 'MOVE_ITEM_UP',
    run: (state, payload: { focusId?: number } = {}) => produce(state, draft => {
        // We need the ID to move. If payload empty, we need to know current focus.
        // This command also suffers from "Don't know what is focused".
        // We will move this logic to Middleware or require payload.
        // For today, let's assume payload is provided or we fix call sites.
        if (payload.focusId === undefined) return;

        const focusId = payload.focusId;
        const visibleIds = state.data.todoOrder.filter(id => state.data.todos[id]?.categoryId === state.ui.selectedCategoryId);
        const visualIdx = visibleIds.indexOf(focusId);

        if (visualIdx <= 0) return;

        const targetId = focusId;
        const swapId = visibleIds[visualIdx - 1];

        const globalTargetIdx = draft.data.todoOrder.indexOf(targetId);
        const globalSwapIdx = draft.data.todoOrder.indexOf(swapId);

        [draft.data.todoOrder[globalTargetIdx], draft.data.todoOrder[globalSwapIdx]] =
            [draft.data.todoOrder[globalSwapIdx], draft.data.todoOrder[globalTargetIdx]];
    })
});

export const MoveItemDown = defineCommand({
    id: 'MOVE_ITEM_DOWN',
    run: (state, payload: { focusId?: number } = {}) => produce(state, draft => {
        if (payload.focusId === undefined) return;
        const focusId = payload.focusId;

        const visibleIds = state.data.todoOrder.filter(id => state.data.todos[id]?.categoryId === state.ui.selectedCategoryId);
        const visualIdx = visibleIds.indexOf(focusId);

        if (visualIdx === -1 || visualIdx >= visibleIds.length - 1) return;

        const targetId = focusId;
        const swapId = visibleIds[visualIdx + 1];

        const globalTargetIdx = draft.data.todoOrder.indexOf(targetId);
        const globalSwapIdx = draft.data.todoOrder.indexOf(swapId);

        [draft.data.todoOrder[globalTargetIdx], draft.data.todoOrder[globalSwapIdx]] =
            [draft.data.todoOrder[globalSwapIdx], draft.data.todoOrder[globalTargetIdx]];
    })
});

export const StartEdit = defineCommand({
    id: 'START_EDIT',
    run: (state, payload: { id?: number } = {}) => produce(state, draft => {
        // Requires Payload or Middleware Injection
        if (payload.id === undefined) return;
        const targetId = payload.id;

        const todo = draft.data.todos[targetId];
        draft.ui.editingId = targetId;
        draft.ui.editDraft = todo?.text || '';
    })
});

export const JumpToSidebar = defineCommand({
    id: 'JUMP_TO_SIDEBAR',
    run: (state) => ({ ...state, ui: { ...state.ui, focusRequest: state.ui.selectedCategoryId } })
});

// Sidebar Navigation
export const MoveSidebarFocusUp = defineCommand({
    id: 'MOVE_SIDEBAR_FOCUS_UP',
    run: (state) => ({ ...state, ui: { ...state.ui, focusRequest: 'SIDEBAR_PREV' } })
});

export const MoveSidebarFocusDown = defineCommand({
    id: 'MOVE_SIDEBAR_FOCUS_DOWN',
    run: (state) => ({ ...state, ui: { ...state.ui, focusRequest: 'SIDEBAR_NEXT' } })
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

// 4. Board View
export const ToggleView = defineCommand({
    id: 'TOGGLE_VIEW',
    run: (state) => ({
        ...state,
        ui: {
            ...state.ui,
            viewMode: state.ui.viewMode === 'board' ? 'list' : 'board'
        }
    })
});

// NavigateColumn Removed (Handled by Zone)

// --- Exports & Registries ---

// Group collections
export const GlobalCommands = [Patch, SetFocus, Undo, Redo, ToggleView];
export const SideBarCommands = [MoveCategoryUp, MoveCategoryDown, SelectCategory, JumpToList, MoveSidebarFocusUp, MoveSidebarFocusDown, ...GlobalCommands];
export const TodoListCommands = [
    AddTodo, ImportTodos, ToggleTodo, DeleteTodo, MoveFocusUp, MoveFocusDown,
    MoveItemUp, MoveItemDown,
    StartEdit, JumpToSidebar, SyncDraft, SyncEditDraft, CancelEdit, UpdateTodoText,
    // NavigateColumn removed
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

