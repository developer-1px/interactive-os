/**
 * Lazy Resolution — pure functions for stale ID recovery.
 *
 * Core rule: "Store IDs as-is, resolve at read-time."
 *   - storedId present in items → return as-is
 *   - storedId stale (deleted) → recover to nearest neighbor
 *   - Undo restores original item → zero-cost: stored ID matches again
 */

/**
 * Resolve a possibly-stale item ID to a valid one.
 *
 * @param storedId  The raw stored ID (may be stale after deletion)
 * @param items     Current ordered item list
 * @param lastIndex Optional hint: the index where storedId was before deletion
 * @returns         A valid item ID, or null if items is empty / storedId is null
 */
export function resolveItemId(
  storedId: string | null,
  items: string[],
  lastIndex?: number,
): string | null {
  if (storedId == null) return null;
  if (items.length === 0) return null;

  // Happy path: ID still exists
  if (items.includes(storedId)) return storedId;

  // Stale: resolve to nearest neighbor
  if (lastIndex != null) {
    // Try the item at the same index (next neighbor)
    if (lastIndex < items.length) return items[lastIndex]!;
    // Past the end → fall back to last item (previous neighbor)
    return items[items.length - 1]!;
  }

  // No hint → fall back to first item
  return items[0]!;
}

/**
 * Filter a selection array to only IDs that still exist in items.
 *
 * Preserves original selection order.
 */
export function resolveSelection(
  selectedIds: string[],
  items: string[],
): string[] {
  if (selectedIds.length === 0 || items.length === 0) return [];
  const itemSet = new Set(items);
  return selectedIds.filter((id) => itemSet.has(id));
}
