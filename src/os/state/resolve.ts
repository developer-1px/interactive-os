/**
 * Lazy Resolution — resolveItemId / resolveSelection
 *
 * Core principle: "저장은 ID만, 해석은 읽을 때"
 *
 * Instead of write-time recovery (OS_RECOVER pre-computing targets),
 * we resolve stale references at read-time:
 *   - If storedId exists in items → return as-is
 *   - If storedId is gone → fallback to nearest neighbor (next > prev)
 *   - If null → null
 *
 * This enables zero-cost undo restoration: undo restores the item,
 * and the stored original ID naturally resolves back to it.
 */

/**
 * Resolve a possibly-stale item ID against the current item list.
 *
 * @param storedId     - The persisted focus/selection ID (may be stale)
 * @param items        - Current live item list (ordered)
 * @param lastIndex    - Optional: last known index before deletion (for next > prev)
 * @returns            - Resolved ID, or null if unresolvable
 */
export function resolveItemId(
  storedId: string | null,
  items: readonly string[],
  lastIndex?: number,
): string | null {
  // Null focus = no focus
  if (storedId === null) return null;

  // Empty list = nothing to resolve to
  if (items.length === 0) return null;

  // Happy path: ID still exists
  if (items.includes(storedId)) return storedId;

  // Stale reference: resolve to nearest neighbor
  if (lastIndex !== undefined) {
    // Clamp to valid range
    const idx = Math.min(lastIndex, items.length - 1);
    return items[idx] ?? items[items.length - 1] ?? null;
  }

  // No index hint: fall back to first item
  return items[0] ?? null;
}

/**
 * Resolve a possibly-stale selection array.
 * Simply filters to items that still exist — preserves original order.
 */
export function resolveSelection(
  selection: readonly string[],
  items: readonly string[],
): string[] {
  if (selection.length === 0 || items.length === 0) return [];
  const itemSet = new Set(items);
  return selection.filter((id) => itemSet.has(id));
}
