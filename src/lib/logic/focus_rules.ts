import type { AppState, FocusTarget } from '../types';

/**
 * Ensures that the focusId in the new state is valid.
 * If the focused Todo ID no longer exists in todos (deleted),
 * it auto-heals by finding the nearest neighbor from the PREVIOUS state.
 */
export function ensureFocusIntegrity(newState: AppState, prevState: AppState): AppState {
    const currentFocusId = newState.ui.focusId;

    // 1. If focus is DRAFT or Category, it's safe (categories don't delete yet, draft is static)
    if (typeof currentFocusId !== 'number') return newState;

    // 2. Check existence in NEW data
    const exists = newState.data.todos.some(t => t.id === currentFocusId);
    if (exists) return newState; // Safe

    // 3. Heal: It was deleted. Find next candidate from PREVIOUS list.
    // We use prevState because newState doesn't have the item anymore, so we can't find its neighbors easily.
    const visibleTodos = prevState.data.todos.filter(t => t.categoryId === prevState.ui.selectedCategoryId);
    const visibleIdx = visibleTodos.findIndex(t => t.id === currentFocusId);

    let nextFocus: FocusTarget = 'DRAFT';

    if (visibleIdx !== -1) {
        // Try next, then previous
        // Note: visibleTodos contains the DELETED item.
        // visibleTodos[visibleIdx] is the one that is gone.
        // So [visibleIdx + 1] is the *actual* next item.
        const nextItem = visibleTodos[visibleIdx + 1];
        const prevItem = visibleTodos[visibleIdx - 1];

        // We must verify that nextItem/prevItem were NOT also deleted (in case of bulk delete, though rare).
        // But for single delete, this is fine.
        // Stricter check: ensure candidates exist in newState.
        const nextExists = nextItem && newState.data.todos.some(t => t.id === nextItem.id);
        const prevExists = prevItem && newState.data.todos.some(t => t.id === prevItem.id);

        if (nextExists) nextFocus = nextItem.id;
        else if (prevExists) nextFocus = prevItem.id;
    }

    // Return corrected state
    return {
        ...newState,
        ui: { ...newState.ui, focusId: nextFocus }
    };
}
