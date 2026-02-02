import type { FocusTarget, Todo } from "../types";

/**
 * Calculates the next focus target when an item is deleted.
 *
 * Rules:
 * 1. If the list is empty after deletion, focus DRAFT.
 * 2. If the deleted item has a next sibling, focus it.
 * 3. If the deleted item was the last one, focus the previous sibling.
 * 4. Checks availability of candidates in the *remaining* list (simulated by checking next/prev existence).
 *
 * @param todos - The list of todos BEFORE deletion (must include the item being deleted to find neighbors).
 * @param currentId - The ID of the item being deleted (currently focused).
 * @param categoryId - The current category ID to filter visible todos.
 */
export function findNextFocusTarget(
  todos: Record<number, Todo>,
  order: number[],
  currentId: number,
  categoryId: string,
): FocusTarget {
  // 1. Filter order list by category to get visible sequence
  const visibleOrder = order.filter(
    (id) => todos[id]?.categoryId === categoryId,
  );

  const visibleIdx = visibleOrder.indexOf(currentId);

  if (visibleIdx === -1) {
    // Current item not found in the list? Fallback to DRAFT.
    return "DRAFT";
  }

  // Candidate 1: Next Item (visibleIdx + 1)
  if (visibleIdx < visibleOrder.length - 1) {
    return visibleOrder[visibleIdx + 1];
  }

  // Candidate 2: Previous Item (visibleIdx - 1)
  if (visibleIdx > 0) {
    return visibleOrder[visibleIdx - 1];
  }

  // No candidates left? Focus DRAFT.
  return "DRAFT";
}
