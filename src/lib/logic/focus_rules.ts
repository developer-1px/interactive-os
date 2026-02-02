import type { AppState } from '../types';
import { findNextFocusTarget } from './focus_utils';

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
    // Normalized check: O(1)
    if (newState.data.todos[currentFocusId]) return newState; // Safe

    // 3. Heal: It was deleted. Find next candidate from PREVIOUS list.
    // We use prevState because newState doesn't have the item anymore, so we can't find its neighbors easily.
    const nextFocus = findNextFocusTarget(
        prevState.data.todos,
        prevState.data.todoOrder, // Pass order array
        currentFocusId,
        prevState.ui.selectedCategoryId
    );

    // Return corrected state
    return {
        ...newState,
        ui: { ...newState.ui, focusId: nextFocus }
    };
}
