import { useCommandCenter, createCommandStore, CommandRegistry } from './command';

import { CONSTITUTION_REGISTRY, SIDEBAR_REGISTRY, TODO_LIST_REGISTRY } from './todo_commands';
import type { AppState, TodoCommand, HistoryEntry } from './types';
import { setGlobalEngine } from './primitives/CommandContext';
import { useMemo } from 'react';

// Initialize Unified Engine Registry (The "Brain" knows all, but UI is scoped)
const ENGINE_REGISTRY = new CommandRegistry<AppState>();
[CONSTITUTION_REGISTRY, SIDEBAR_REGISTRY, TODO_LIST_REGISTRY].forEach(reg => {
    reg.getAll().forEach(cmd => ENGINE_REGISTRY.register(cmd));
});

const registry = ENGINE_REGISTRY;

const INITIAL_STATE: AppState = {
    categories: [
        { id: 'cat_inbox', text: 'Inbox' },
        { id: 'cat_work', text: 'Work' },
        { id: 'cat_personal', text: 'Personal' }
    ],
    selectedCategoryId: 'cat_inbox',
    todos: [
        { id: 1, text: 'Complete Interaction OS docs', completed: false, categoryId: 'cat_inbox' },
        { id: 2, text: 'Review Red Team feedback', completed: true, categoryId: 'cat_work' },
        { id: 3, text: 'Plan next iteration', completed: false, categoryId: 'cat_work' },
        { id: 4, text: 'Buy groceries', completed: false, categoryId: 'cat_personal' }
    ],
    draft: '',
    focusId: 'DRAFT',
    editingId: null,
    editDraft: '',
    history: []
};

// --- 3. Condition Definitions (Inlined) ---
// Conditions are now evaluated directly in mapStateToContext


const STORAGE_KEY = 'interactive-os-todo-v2';

const loadState = (): AppState => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge with structure to ensure new fields exists if schema evolves
            return { ...INITIAL_STATE, ...parsed, history: [] }; // Don't persist history for now
        }
    } catch (e) {
        console.warn('Failed to load state', e);
    }
    return INITIAL_STATE;
};

const saveState = (state: AppState) => {
    try {
        // Persist only data, not transient UI state.
        // We EXCLUDE: history, editingId, editDraft
        // We KEEP: todos, categories, selectedCategoryId, draft (maybe?)
        // Let's keep 'draft' as it might be useful, but definitely NOT 'editingId'.
        const { history, editingId, editDraft, ...subState } = state;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(subState));
    } catch (e) {
        console.warn('Failed to save state', e);
    }
};

/**
 * useTodoStore: Global Zustand store for Todo application state.
 * Allows access to state and dispatch from any component.
 */
export const useTodoStore = createCommandStore<AppState, TodoCommand>(
    registry,
    { ...loadState(), editingId: null, editDraft: '' }, // Force reset of transient state on load
    {
        onStateChange: (newState, action) => {
            saveState(newState);

            const historyEntry: HistoryEntry = {
                command: action,
                resultingState: {
                    todos: newState.todos,
                    draft: newState.draft,
                    focusId: newState.focusId
                }
            };
            return {
                ...newState,
                history: [...newState.history, historyEntry]
            };
        }
    }
);

/**
 * useTodoEngine: 
 * Returns everything the View needs, pre-bound to the global store.
 */
export function useTodoEngine() {
    // Note: Condition Registry side-effect removed. Logic is now direct.

    const config = useMemo(() => ({
        mapStateToContext: (state: AppState) => {
            const isSidebar = String(state.focusId).startsWith('cat_');
            const isTodo = state.focusId === 'DRAFT' || state.focusId === 'draft' || typeof state.focusId === 'number';

            // Direct Evaluation of Conditions
            const conditions = {
                categoryListFocus: typeof state.focusId === 'string' && state.focusId.startsWith('cat_'),
                todoListFocus: typeof state.focusId === 'number',
                isEditing: state.editingId !== null,
                isInputFocused: state.focusId === 'DRAFT'
            };

            const ctx: Record<string, any> = {
                editDraft: state.editDraft,
                focusId: state.focusId,
                selectedCategoryId: state.selectedCategoryId,
                hasTodos: state.todos.length > 0,
                activeZone: isSidebar ? 'sidebar' : isTodo ? 'todoList' : null,
                ...conditions
            };

            return ctx;
        }
    }), []);

    const engine = useCommandCenter<AppState, TodoCommand>(
        useTodoStore,
        registry,
        config
    );

    // Wire up global singleton bridge
    // We wrap it in a closure to match the hook signature
    setGlobalEngine(() => engine.providerValue);

    return engine;
}
