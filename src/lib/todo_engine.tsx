import { useCommandCenter, createCommandStore, CommandRegistry } from './command';
import { Action, Field, Option, FocusZone, CommandContext } from './primitives';
import { CONSTITUTION_REGISTRY, SIDEBAR_REGISTRY, TODO_LIST_REGISTRY } from './todo_commands';
import type { AppState, TodoCommand, HistoryEntry, CommandType } from './types';
import { conditionRegistry } from './context';
import type { ConditionDefinition } from './context';
import { useEffect, useMemo } from 'react';

// Initialize Unified Engine Registry (The "Brain" knows all, but UI is scoped)
const ENGINE_REGISTRY = new CommandRegistry<AppState, CommandType>();
[CONSTITUTION_REGISTRY, SIDEBAR_REGISTRY, TODO_LIST_REGISTRY].forEach(reg => {
    reg.getAll().forEach(cmd => ENGINE_REGISTRY.register(cmd));
});

const registry = ENGINE_REGISTRY;

const INITIAL_STATE: AppState = {
    categories: [
        { id: 'cat_inbox', text: 'Inbox', icon: '📥' },
        { id: 'cat_work', text: 'Work', icon: '💼' },
        { id: 'cat_personal', text: 'Personal', icon: '👤' }
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

// --- 3. Condition Definitions ---

export const TODO_CONDITIONS: ConditionDefinition<AppState>[] = [
    {
        id: 'categoryListFocus',
        description: 'True if a category is currently focused',
        run: (s) => typeof s.focusId === 'string' && s.focusId.startsWith('cat_')
    },
    {
        id: 'todoListFocus',
        description: 'True if a todo item is currently focused',
        run: (s) => typeof s.focusId === 'number'
    },
    {
        id: 'isEditing',
        description: 'True if a todo is currently being edited inline',
        run: (s) => s.editingId !== null
    },
    {
        id: 'isInputFocused',
        description: 'True if the main creation input is focused',
        run: (s) => s.focusId === 'DRAFT'
    }
];

/**
 * useTodoStore: Global Zustand store for Todo application state.
 * Allows access to state and dispatch from any component.
 */
export const useTodoStore = createCommandStore<AppState, TodoCommand>(
    registry,
    INITIAL_STATE,
    {
        onStateChange: (newState, action) => {
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
    // Register conditions once on mount
    useEffect(() => {
        TODO_CONDITIONS.forEach(cond => {
            if (!conditionRegistry.get(cond.id)) {
                conditionRegistry.register(cond);
            }
        });
    }, []);

    const config = useMemo(() => ({
        mapStateToContext: (state: AppState) => {
            const isSidebar = String(state.focusId).startsWith('cat_');
            const isTodo = state.focusId === 'DRAFT' || state.focusId === 'draft' || typeof state.focusId === 'number';

            const ctx: Record<string, any> = {
                editDraft: state.editDraft,
                focusId: state.focusId,
                selectedCategoryId: state.selectedCategoryId,
                hasTodos: state.todos.length > 0,
                filteredTodos: state.todos.filter(t => t.categoryId === state.selectedCategoryId),
                activeZone: isSidebar ? 'sidebar' : isTodo ? 'todoList' : null
            };

            // Dynamically evaluate all registered conditions
            conditionRegistry.getAll().forEach(cond => {
                ctx[cond.id] = (cond as ConditionDefinition<AppState>).run(state);
            });

            return ctx;
        }
    }), []);

    return useCommandCenter<AppState, TodoCommand, CommandType>(
        useTodoStore,
        registry,
        config
    );
}
