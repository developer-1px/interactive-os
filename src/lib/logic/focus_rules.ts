import type { AppState } from "../types";
import { findNextFocusTarget } from "./focus_utils";
import { useFocusStore } from "../../stores/useFocusStore";

/**
 * Ensures that the OS-level focus is valid relative to the new Data State.
 * If the currently focused Todo ID no longer exists in todos (deleted),
 * it auto-heals by finding the nearest neighbor from the PREVIOUS state.
 * 
 * Side Effect: Updates useFocusStore directly if healing is needed.
 */
export function ensureFocusIntegrity(
  newState: AppState,
  prevState: AppState,
): AppState {
  // 1. Get current OS Focus
  const currentFocusId = useFocusStore.getState().focusedItemId;

  // 2. If focus is DRAFT or Category, it's safe
  if (typeof currentFocusId !== "number") return newState;

  // 3. Check existence in NEW data
  // Normalized check: O(1)
  if (newState.data.todos[currentFocusId]) return newState; // Still exists, Safe.

  // 4. Heal: It was deleted. Find next candidate from PREVIOUS list.
  // We use prevState because newState doesn't have the item anymore.
  const nextFocus = findNextFocusTarget(
    prevState.data.todos,
    prevState.data.todoOrder,
    currentFocusId,
    prevState.ui.selectedCategoryId, // Use previous selection context
  );

  // 5. Execute Side Effect: Sync OS Focus
  // We don't wait for render cycle; we fix it immediately so the UI doesn't try to render a missing focus.
  useFocusStore.getState().setFocus(String(nextFocus));

  // Return state as-is (Focus is not in AppState anymore)
  return newState;
}
