/**
 * resolveRecovery - Focus recovery when item is removed
 *
 * Pipeline Phase 3: UPDATE (pure function)
 *
 * When the focused item is removed, calculates the next focus target
 * based on the recovery strategy ('next' | 'prev' | 'nearest').
 */

export type RecoveryStrategy = "next" | "prev" | "nearest";

export interface RecoveryResult {
  targetId: string | null;
  changed: boolean;
}

/**
 * Calculate the recovery target when an item is removed.
 *
 * @param removedId - The ID of the removed item
 * @param focusedId - The currently focused item ID
 * @param items - Current items list (BEFORE removal)
 * @param strategy - Recovery strategy
 * @returns The new focus target
 */
export function resolveRecovery(
  removedId: string,
  focusedId: string | null,
  items: string[],
  strategy: RecoveryStrategy = "next",
): RecoveryResult {
  // No recovery needed if removed item wasn't focused
  if (focusedId !== removedId) {
    return { targetId: null, changed: false };
  }

  const removedIndex = items.indexOf(removedId);
  if (removedIndex === -1) {
    return { targetId: null, changed: false };
  }

  // Calculate remaining items after removal
  const remainingItems = items.filter((id) => id !== removedId);

  if (remainingItems.length === 0) {
    return { targetId: null, changed: true };
  }

  let targetId: string;

  switch (strategy) {
    case "next":
      // Try next, fallback to prev (last item in list)
      if (removedIndex < remainingItems.length) {
        targetId = remainingItems[removedIndex];
      } else {
        targetId = remainingItems[remainingItems.length - 1];
      }
      break;

    case "prev":
      // Try prev, fallback to next (first item in list)
      if (removedIndex > 0) {
        targetId = remainingItems[removedIndex - 1];
      } else {
        targetId = remainingItems[0];
      }
      break;

    case "nearest":
      // Prefer next, but if at end, use prev
      if (removedIndex < remainingItems.length) {
        targetId = remainingItems[removedIndex];
      } else if (removedIndex > 0) {
        targetId = remainingItems[removedIndex - 1];
      } else {
        targetId = remainingItems[0];
      }
      break;

    default:
      targetId = remainingItems[0];
  }

  return { targetId, changed: true };
}
