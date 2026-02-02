
import { produce } from 'immer';
import type { AppState, TodoCommand, HistoryEntry } from '../types';
import { useFocusStore } from '../../stores/useFocusStore';
import { ensureFocusIntegrity } from '../logic/focus_rules';
import { saveState } from './persistence';

// Helper to create snapshot
const createSnapshot = (s: AppState, cmd: TodoCommand): HistoryEntry => ({
    command: cmd,
    resultingState: {
        todos: s.data.todos,
        todoOrder: s.data.todoOrder,
        draft: s.ui.draft
    }
});

export const todoPhysicsMiddleware = (rawNewState: AppState, action: TodoCommand, prevState: AppState): AppState => {
    // 1. Focus Signal Processing (The Bridge)
    const request = rawNewState.ui.focusRequest;

    if (request) {
        const currentFocus = useFocusStore.getState().focusedItemId;
        let targetId: string | null = null;

        // Helper to get visible todos
        const getVisibleTodos = (state: AppState) => {
            return state.data.todoOrder.filter(id => state.data.todos[id]?.categoryId === state.ui.selectedCategoryId);
        };

        // Helper to get Sidebar Order
        const getSidebarOrder = (state: AppState) => state.data.categoryOrder;

        if (request === 'PREV') {
            const visible = getVisibleTodos(rawNewState);
            if (currentFocus === 'DRAFT' || !currentFocus) {
                targetId = String(visible[visible.length - 1] || 'DRAFT');
            } else {
                const idx = visible.indexOf(Number(currentFocus));
                if (idx <= 0) targetId = 'DRAFT';
                else targetId = String(visible[idx - 1]);
            }
        } else if (request === 'NEXT') {
            const visible = getVisibleTodos(rawNewState);
            if (currentFocus === 'DRAFT' || !currentFocus) {
                targetId = String(visible[0] || 'DRAFT');
            } else {
                const idx = visible.indexOf(Number(currentFocus));
                // Loop back to DRAFT if at end
                if (idx === visible.length - 1) targetId = 'DRAFT';
                else if (idx !== -1) targetId = String(visible[idx + 1]);
                // If current not found, default to first
                else targetId = String(visible[0] || 'DRAFT');
            }
        } else if (request === 'SIDEBAR_PREV') {
            const order = getSidebarOrder(rawNewState);
            const currentId = currentFocus ? String(currentFocus) : rawNewState.ui.selectedCategoryId;
            const idx = order.indexOf(currentId);
            if (idx > 0) targetId = order[idx - 1];
        } else if (request === 'SIDEBAR_NEXT') {
            const order = getSidebarOrder(rawNewState);
            const currentId = currentFocus ? String(currentFocus) : rawNewState.ui.selectedCategoryId;
            const idx = order.indexOf(currentId);
            if (idx !== -1 && idx < order.length - 1) targetId = order[idx + 1];
        } else {
            // Direct ID Request
            targetId = String(request);
        }

        // EXECUTE SIDE EFFECT
        if (targetId) {
            useFocusStore.getState().setFocus(targetId);
        }
    }

    // 2. Data Integrity Checks
    const healedState = ensureFocusIntegrity(rawNewState, prevState);
    saveState(healedState);

    // Universal Undo Logic with Immer
    if (action.type === 'UNDO') {
        return produce(prevState, draft => {
            const past = draft.history.past;
            if (past.length === 0) return;

            const popEntry = () => past.pop();
            const entry = popEntry();
            if (!entry) return;

            const targetGroupId = entry.groupId;
            let entryToRestore = entry;

            if (targetGroupId) {
                while (past.length > 0 && past[past.length - 1].groupId === targetGroupId) {
                    entryToRestore = past.pop()!;
                }
            }

            // Push to Future
            const currentSnapshot = createSnapshot(prevState, action);
            draft.history.future.unshift(currentSnapshot);

            // Restore State
            draft.data.todos = entryToRestore.resultingState.todos;
            draft.data.todoOrder = entryToRestore.resultingState.todoOrder;
            draft.ui.draft = entryToRestore.resultingState.draft;
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
        });
    }

    return produce(healedState, draft => {
        const snapshot = createSnapshot(prevState, action);
        if (action.payload && (action.payload as any).groupId) {
            snapshot.groupId = (action.payload as any).groupId;
        }

        draft.history.past.push(snapshot);
        if (draft.history.past.length > 50) draft.history.past.shift();
        draft.history.future = [];
    });
};
