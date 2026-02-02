import { useCommandCenter, createCommandStore, CommandRegistry } from './command';
import { useContextService } from './context';
import { useFocusStore } from '../stores/useFocusStore';

import { CONSTITUTION_REGISTRY, SIDEBAR_REGISTRY, TODO_LIST_REGISTRY } from './todo_commands';
import type { AppState, TodoCommand, HistoryEntry } from './types';
import { ensureFocusIntegrity } from './logic/focus_rules';
import { setGlobalEngine } from './primitives/CommandContext';
import { useMemo, useLayoutEffect } from 'react';

// Initialize Unified Engine Registry (The "Brain" knows all, but UI is scoped)
const ENGINE_REGISTRY = new CommandRegistry<AppState>();
[CONSTITUTION_REGISTRY, SIDEBAR_REGISTRY, TODO_LIST_REGISTRY].forEach(reg => {
    reg.getAll().forEach(cmd => ENGINE_REGISTRY.register(cmd));
});

const registry = ENGINE_REGISTRY;

const INITIAL_STATE: AppState = {
    data: {
        categories: [
            { id: 'cat_inbox', text: 'Inbox' },
            { id: 'cat_work', text: 'Work' },
            { id: 'cat_personal', text: 'Personal' }
        ],
        todos: [
            { id: 1, text: 'Complete Interaction OS docs', completed: false, categoryId: 'cat_inbox' },
            { id: 2, text: 'Review Red Team feedback', completed: true, categoryId: 'cat_work' },
            { id: 3, text: 'Plan next iteration', completed: false, categoryId: 'cat_work' },
            { id: 4, text: 'Buy groceries', completed: false, categoryId: 'cat_personal' }
        ]
    },
    ui: {
        selectedCategoryId: 'cat_inbox',
        draft: '',
        focusId: 'DRAFT',
        editingId: null,
        editDraft: ''
    },
    history: {
        past: [],
        future: []
    }
};

// --- 3. Condition Definitions (Inlined) ---
// Conditions are now evaluated directly in mapStateToContext


const STORAGE_KEY = 'interactive-os-todo-v3';

const loadState = (): AppState => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge with structure to ensure new fields exists if schema evolves
            // We assume parsed only contains 'data'. UI and History are reset.
            if (parsed.categories && parsed.todos) {
                return {
                    ...INITIAL_STATE,
                    data: { ...INITIAL_STATE.data, ...parsed }
                };
            }
        }
    } catch (e) {
        console.warn('Failed to load state', e);
    }
    return INITIAL_STATE;
};

const saveState = (state: AppState) => {
    try {
        // Persist only data.
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
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
    loadState(),
    {
        onStateChange: (rawNewState, action, prevState) => {
            // 1. Auto-Heal Focus
            const newState = ensureFocusIntegrity(rawNewState, prevState);

            saveState(newState);

            const createSnapshot = (s: AppState, cmd: TodoCommand): HistoryEntry => ({
                command: cmd,
                resultingState: {
                    todos: s.data.todos,
                    draft: s.ui.draft,
                    focusId: s.ui.focusId
                }
            });

            // Universal Undo Logic
            if (action.type === 'UNDO') {
                const past = prevState.history.past;
                if (past.length === 0) return prevState;

                const previousEntry = past[past.length - 1];
                const newPast = past.slice(0, -1);

                // Snapshot current state to Future
                // We use a dummy command for the snapshot or the last command?
                // For 'Future', the entry represents 'Redo' target.
                const currentSnapshot = createSnapshot(prevState, action);
                // Ideally we want the command that created the current state, but we don't track it on state.
                // It's acceptable to use the UNDO action itself as the marker for now.

                return {
                    ...prevState,
                    data: { ...prevState.data, todos: previousEntry.resultingState.todos },
                    ui: {
                        ...prevState.ui,
                        draft: previousEntry.resultingState.draft,
                        focusId: previousEntry.resultingState.focusId
                    },
                    history: {
                        past: newPast,
                        future: [currentSnapshot, ...prevState.history.future]
                    }
                };
            }

            // Universal Redo Logic
            if (action.type === 'REDO') {
                const future = prevState.history.future;
                if (future.length === 0) return prevState;

                const nextEntry = future[0];
                const newFuture = future.slice(1);

                const currentSnapshot = createSnapshot(prevState, action);

                return {
                    ...prevState,
                    data: { ...prevState.data, todos: nextEntry.resultingState.todos },
                    ui: {
                        ...prevState.ui,
                        draft: nextEntry.resultingState.draft,
                        focusId: nextEntry.resultingState.focusId
                    },
                    history: {
                        past: [...prevState.history.past, currentSnapshot],
                        future: newFuture
                    }
                };
            }

            // Standard Action - Commit to History
            // Only commit if the action logic explicitly allows logging (default true)
            // AND it actually changed something meaningful (optional optimization)

            // We push the PREVIOUS state to 'past'.
            // But wait, 'createSnapshot' takes a state and creates an entry.
            // If we push 'prevState' to past, then 'resultingState' in the entry will be the state BEFORE the action.
            // This is "State-based" history.
            // When we Undo, we restore 'startingState'. This is correct.

            const snapshot = createSnapshot(prevState, action);

            return {
                ...newState,
                history: {
                    past: [...newState.history.past, snapshot].slice(-50), // Limit 50
                    future: [] // Clear future on new branch
                }
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
            const { ui, data } = state;

            const isSidebar = String(ui.focusId).startsWith('cat_');
            const isTodo = ui.focusId === 'DRAFT' || ui.focusId === 'draft' || typeof ui.focusId === 'number';

            // Direct Evaluation of Conditions
            const conditions = {
                categoryListFocus: typeof ui.focusId === 'string' && ui.focusId.startsWith('cat_'),
                todoListFocus: typeof ui.focusId === 'number',
                isEditing: ui.editingId !== null,
                isInputFocused: ui.focusId === 'DRAFT'
            };

            const ctx: Record<string, any> = {
                editDraft: ui.editDraft,
                focusId: ui.focusId,
                selectedCategoryId: ui.selectedCategoryId,
                hasTodos: data.todos.length > 0,
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
    setGlobalEngine(() => engine.providerValue);

    // --- Core Integration: Zone Responsibility ---
    // Instead of calculating activeZone based on focusId (Old Pattern),
    // We subscribe to the Core's useFocusStore to drive the Context.

    // We need to inject the activeZone from the store into the engine context.
    // Since useCommandCenter's useLayoutEffect handles the mapping, we need to pass the store's value into it.
    // However, mapStateToContext only takes (state: AppState).
    // So we need a side-effect to update the 'activeZone' in the context whenever the store changes.

    // We access the raw context updater exposed by the Engine (which wraps useContextService)
    // But engine.ctx is read-only from the hook return.
    // Actually, useCommandCenter calls `updateContext` inside. 
    // We can't easily hook into mapStateToContext for external values unless we pass them in.

    // Better approach matching the architecture debate:
    // We update the context imperatively here using the Service.

    // We update the context imperatively here using the Service.
    // Wait, useCommandCenter doesn't expose updateContext. 
    // It uses useContextService internally.

    // Let's use the same hook to get access to the context service
    const focusStoreZone = useFocusStore(s => s.activeZoneId);

    // We need to force this into the context.
    const contextService = useContextService();

    useLayoutEffect(() => {
        if (contextService) {
            contextService.updateContext({ activeZone: focusStoreZone });
        }
    }, [focusStoreZone, contextService]);

    return engine;
}
