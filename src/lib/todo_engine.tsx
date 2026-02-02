import { useCommandCenter, createCommandStore } from './command';
import { useContextService } from './context';
import { useFocusStore } from '../stores/useFocusStore';

import { UNIFIED_TODO_REGISTRY } from './todo_commands';
import type { AppState, TodoCommand, HistoryEntry } from './types';
import type { TodoContext } from './logic/schema';
import { TODO_KEYMAP } from './todo_keys';
import { ensureFocusIntegrity } from './logic/focus_rules';
import { setGlobalEngine } from './primitives/CommandContext';
import { useMemo, useLayoutEffect } from 'react';

// Initialize Unified Engine Registry (The "Brain" knows all, but UI is scoped)
const ENGINE_REGISTRY = UNIFIED_TODO_REGISTRY;
ENGINE_REGISTRY.setKeymap(TODO_KEYMAP);

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

                // Helper: Pop logic
                const popEntry = (history: HistoryEntry[]) => {
                    const entry = history[history.length - 1];
                    const remaining = history.slice(0, -1);
                    return { entry, remaining };
                };

                // 1. Pop the first entry
                let { entry, remaining } = popEntry(past);
                const targetGroupId = entry.groupId;

                // 2. If it has a groupId, pop all preceding entries with the same groupId
                // (e.g. if we did [A, B, C] in group '123', we are at C.
                // Undo C -> restores B. But B is also '123'. Undo B -> restores A. Undo A -> restores pre-A.
                // So we want to restore the state BEFORE the *first* command of the group.)

                // Wait, our 'past' stack contains snapshots of the state *before* the action.
                // Entry 1: Shot of S0 (Action 1)
                // Entry 2: Shot of S1 (Action 2)
                // Current State: S2.
                // Undo Action 2 -> Restore Entry 2 (S1).

                // If Action 1 and Action 2 are grouped:
                // We want to restore Entry 1 (S0).

                // So we need to keep popping while groupId matches.
                let entryToRestore = entry;

                if (targetGroupId) {
                    while (remaining.length > 0 && remaining[remaining.length - 1].groupId === targetGroupId) {
                        const popped = popEntry(remaining);
                        entryToRestore = popped.entry; // Keep going back
                        remaining = popped.remaining;
                    }
                }

                // Snapshot current state to Future (Redo Stack)
                // Ideally Redo should also group, but for now simple stacking
                const currentSnapshot = createSnapshot(prevState, action);
                // We might need to tag this snapshot with the groupId so Redo works transactionally too.
                // But Redo is usually just re-playing.
                // Let's keep it simple: clear future or just push one entry. 
                // Actually if we grouped-undo, we created a large gap.
                // Future stack: we should probably push ALL the undone actions to future if we want precise Redo?
                // For MVP, let's just push the composite result. 
                // Users rarely Redo partially inside a transaction.

                return {
                    ...prevState,
                    data: { ...prevState.data, todos: entryToRestore.resultingState.todos },
                    ui: {
                        ...prevState.ui,
                        draft: entryToRestore.resultingState.draft,
                        focusId: entryToRestore.resultingState.focusId
                    },
                    history: {
                        past: remaining,
                        future: [currentSnapshot, ...prevState.history.future]
                    }
                };
            }

            // Universal Redo Logic
            if (action.type === 'REDO') {
                // Redo needs similar logic if we want to support Redoing a transaction?
                // If we Undid a transaction, we really just jumped back in time.
                // The 'Future' stack got 1 entry (the state before Undo).
                // So Redo just restores that state. It's atomic. 
                // So no loop needed here.
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
            // Only commit if the action logic specifically allows it.
            // We reuse 'log' property or defaults.
            const cmdDef = registry.get(action.type);
            const shouldRecord = cmdDef ? (cmdDef.log !== false) : true;

            if (!shouldRecord) {
                return newState;
            }

            // We push the PREVIOUS state to 'past'.
            // But wait, 'createSnapshot' takes a state and creates an entry.
            // If we push 'prevState' to past, then 'resultingState' in the entry will be the state BEFORE the action.
            // This is "State-based" history.
            // When we Undo, we restore 'startingState'. This is correct.

            const snapshot = createSnapshot(prevState, action);
            // Inject groupId if present in payload (primitive transaction support)
            // Commands can pass { groupId: '...' } in payload to transparently group themselves.
            if (action.payload && (action.payload as any).groupId) {
                snapshot.groupId = (action.payload as any).groupId;
            }

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
        mapStateToContext: (state: AppState): TodoContext & Record<string, any> => {
            const { ui, data } = state;

            const isSidebar = String(ui.focusId).startsWith('cat_');
            const isTodo = typeof ui.focusId === 'number';
            const isDraft = ui.focusId === 'DRAFT' || ui.focusId === 'draft';

            // Calculate Physics
            let focusIndex = -1;
            let listLength = 0;

            if (isSidebar) {
                focusIndex = data.categories.findIndex(c => c.id === ui.focusId);
                listLength = data.categories.length;
            } else {
                // Todo List context (includes Draft)
                const visible = data.todos.filter(t => t.categoryId === ui.selectedCategoryId);
                listLength = visible.length;
                if (isTodo) {
                    focusIndex = visible.findIndex(t => t.id === ui.focusId);
                }
            }

            return {
                // Physics
                focusIndex,
                listLength,
                maxIndex: listLength > 0 ? listLength - 1 : 0,

                // State Flags
                hasDraft: !!ui.draft,
                isOrdering: false,

                // Environment
                activeZone: isSidebar ? 'sidebar' : 'todoList',
                isEditing: ui.editingId !== null,
                isDraftFocused: isDraft,
                isFieldFocused: isDraft || (ui.editingId !== null),

                // Data Stats
                hasCategories: data.categories.length > 0,
                hasTodos: data.todos.length > 0,

                // Selection
                selectedCategoryId: ui.selectedCategoryId,

                // --- Legacy/Compatibility Strings (Optional) ---
                // We keep these if any UI components rely on them, but commands will migrate to Rules.
                categoryListFocus: isSidebar,
                todoListFocus: isTodo
            };
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
