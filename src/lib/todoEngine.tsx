import { useCommandCenter, createCommandStore } from './command';
import { useContextService } from './context';
import { useFocusStore } from '../stores/useFocusStore';
import { produce } from 'immer';

import { UNIFIED_TODO_REGISTRY } from './todoCommands';
import type { AppState, TodoCommand, HistoryEntry } from './types';
import type { TodoContext } from './logic/schema';
import { TODO_KEYMAP } from './todoKeys';
import { ensureFocusIntegrity } from './logic/focus_rules';
import { setGlobalEngine } from './primitives/CommandContext';
import { useMemo, useLayoutEffect } from 'react';

// Initialize Unified Engine Registry (The "Brain" knows all, but UI is scoped)
const ENGINE_REGISTRY = UNIFIED_TODO_REGISTRY;
ENGINE_REGISTRY.setKeymap(TODO_KEYMAP);

const registry = ENGINE_REGISTRY;

const INITIAL_STATE: AppState = {
    data: {
        categories: {
            'cat_inbox': { id: 'cat_inbox', text: 'Inbox' },
            'cat_work': { id: 'cat_work', text: 'Work' },
            'cat_personal': { id: 'cat_personal', text: 'Personal' }
        },
        categoryOrder: ['cat_inbox', 'cat_work', 'cat_personal'],
        todos: {
            1: { id: 1, text: 'Complete Interaction OS docs', completed: false, categoryId: 'cat_inbox' },
            2: { id: 2, text: 'Review Red Team feedback', completed: true, categoryId: 'cat_work' },
            3: { id: 3, text: 'Plan next iteration', completed: false, categoryId: 'cat_work' },
            4: { id: 4, text: 'Buy groceries', completed: false, categoryId: 'cat_personal' }
        },
        todoOrder: [1, 2, 3, 4]
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

const STORAGE_KEY = 'interactive-os-todo-v3';

const loadState = (): AppState => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Quick migration check: if parsed.todos is array, we need to migrate or failover
            if (Array.isArray(parsed.todos)) {
                // Simple migration logic could go here, but for now fallback to initial
                console.warn('Detected legacy array state, resetting to initial normalized state.');
                return INITIAL_STATE;
            }

            if (parsed.categories && parsed.todos) {
                return {
                    ...INITIAL_STATE,
                    data: {
                        ...INITIAL_STATE.data,
                        categories: parsed.categories,
                        todos: parsed.todos,
                        categoryOrder: parsed.categoryOrder || Object.keys(parsed.categories),
                        todoOrder: parsed.todoOrder || Object.keys(parsed.todos).map(Number)
                    }
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
            // Note: ensureFocusIntegrity might need updates if it depends on array structure, 
            // but for now we assume it handles the AppState shape or we need to check it.
            // Let's assume ensureFocusIntegrity is pure logic on the shape.
            // We apply it to the result of the command execution.

            const healedState = ensureFocusIntegrity(rawNewState, prevState);
            saveState(healedState);

            const createSnapshot = (s: AppState, cmd: TodoCommand): HistoryEntry => ({
                command: cmd,
                resultingState: {
                    todos: s.data.todos,
                    todoOrder: s.data.todoOrder, // Snapshot order too
                    draft: s.ui.draft,
                    focusId: s.ui.focusId
                }
            });

            // Universal Undo Logic with Immer
            if (action.type === 'UNDO') {
                return produce(prevState, draft => {
                    const past = draft.history.past;
                    if (past.length === 0) return;

                    const popEntry = () => past.pop();

                    // Pop the last Action
                    const entry = popEntry();
                    if (!entry) return;

                    const targetGroupId = entry.groupId;
                    let entryToRestore = entry;

                    // Group Undo Logic
                    if (targetGroupId) {
                        while (past.length > 0 && past[past.length - 1].groupId === targetGroupId) {
                            entryToRestore = past.pop()!;
                        }
                    }

                    // Push to Future
                    const currentSnapshot = createSnapshot(prevState, action);
                    // Ensure currentSnapshot matches HistoryEntry type (it does)
                    draft.history.future.unshift(currentSnapshot);

                    // Restore State
                    draft.data.todos = entryToRestore.resultingState.todos;
                    draft.data.todoOrder = entryToRestore.resultingState.todoOrder;
                    draft.ui.draft = entryToRestore.resultingState.draft;
                    draft.ui.focusId = entryToRestore.resultingState.focusId;
                });
            }

            // Universal Redo Logic with Immer
            if (action.type === 'REDO') {
                return produce(prevState, draft => {
                    const future = draft.history.future;
                    if (future.length === 0) return;

                    const nextEntry = future.shift(); // Pop from front
                    if (!nextEntry) return;

                    // Push current to Past
                    const currentSnapshot = createSnapshot(prevState, action);
                    draft.history.past.push(currentSnapshot);

                    // Restore State
                    draft.data.todos = nextEntry.resultingState.todos;
                    draft.data.todoOrder = nextEntry.resultingState.todoOrder;
                    draft.ui.draft = nextEntry.resultingState.draft;
                    draft.ui.focusId = nextEntry.resultingState.focusId;
                });
            }

            // Standard Action - Commit to History
            const cmdDef = registry.get(action.type);
            const shouldRecord = cmdDef ? (cmdDef.log !== false) : true;

            if (!shouldRecord) {
                return healedState;
            }

            return produce(healedState, draft => {
                const snapshot = createSnapshot(prevState, action);
                if (action.payload && (action.payload as any).groupId) {
                    snapshot.groupId = (action.payload as any).groupId;
                }

                // Add to past, limit 50
                draft.history.past.push(snapshot);
                if (draft.history.past.length > 50) draft.history.past.shift();

                // Clear future
                draft.history.future = [];
            });
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

            // Calculate Physics using Normalized Data
            let focusIndex = -1;
            let listLength = 0;

            if (isSidebar) {
                focusIndex = data.categoryOrder.indexOf(ui.focusId as string);
                listLength = data.categoryOrder.length;
            } else {
                // Derived View: Todo List for selected category
                const visibleIds = data.todoOrder.filter(id => data.todos[id].categoryId === ui.selectedCategoryId);
                listLength = visibleIds.length;
                if (isTodo) {
                    focusIndex = visibleIds.indexOf(ui.focusId as number);
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
                hasCategories: data.categoryOrder.length > 0,
                hasTodos: data.todoOrder.length > 0,

                selectedCategoryId: ui.selectedCategoryId
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

    const focusStoreZone = useFocusStore(s => s.activeZoneId);
    const contextService = useContextService();

    useLayoutEffect(() => {
        if (contextService) {
            contextService.updateContext({ activeZone: focusStoreZone });
        }
    }, [focusStoreZone, contextService]);

    return engine;
}
