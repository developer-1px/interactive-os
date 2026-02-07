/**
 * resolveExpansion - Expansion state calculation
 *
 * Pipeline Phase 3: UPDATE (pure function)
 * Calculates new expanded items list without side effects.
 */

export type ExpandAction = "toggle" | "expand" | "collapse";

export interface ExpandResult {
  expandedItems: string[];
  changed: boolean;
}

/**
 * Calculate new expanded items list based on action.
 * Pure function - no side effects.
 *
 * @param expandedItems - Current expanded items list
 * @param targetId - Item to expand/collapse
 * @param action - Action to perform
 * @returns New expanded items list and whether it changed
 */
export function resolveExpansion(
  expandedItems: string[],
  targetId: string,
  action: ExpandAction,
): ExpandResult {
  const isCurrentlyExpanded = expandedItems.includes(targetId);

  let shouldBeExpanded: boolean;

  switch (action) {
    case "expand":
      shouldBeExpanded = true;
      break;
    case "collapse":
      shouldBeExpanded = false;
      break;
    case "toggle":
    default:
      shouldBeExpanded = !isCurrentlyExpanded;
      break;
  }

  // No change needed
  if (shouldBeExpanded === isCurrentlyExpanded) {
    return { expandedItems, changed: false };
  }

  // Calculate new list
  const newExpandedItems = shouldBeExpanded
    ? [...expandedItems, targetId]
    : expandedItems.filter((id) => id !== targetId);

  return { expandedItems: newExpandedItems, changed: true };
}
