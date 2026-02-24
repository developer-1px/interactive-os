/**
 * collectionView — Pure view transform functions.
 *
 * All transforms are (NormalizedCollection, options?) → view data.
 * Domain-agnostic: works with any T extends { id: string }.
 *
 * Replaces domain-specific flattenVisibleTree(DocItem[], expanded[])
 * with a universal toVisibleTree(collection, expanded[]).
 */

import type { NormalizedCollection } from "./NormalizedCollection";

// ═══════════════════════════════════════════════════════════════════
// FlatNode — universal tree node for rendering
// ═══════════════════════════════════════════════════════════════════

export interface FlatNode {
  /** Entity id */
  id: string;
  /** Nesting depth (0 = root) */
  level: number;
  /** Has children in the order map */
  expandable: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// toFlatList — ListView projection
// ═══════════════════════════════════════════════════════════════════

/** Returns root-level ids in order. Use for flat list views. */
export function toFlatList<T extends { id: string }>(
  c: NormalizedCollection<T>,
): string[] {
  return c.order[""] ?? [];
}

// ═══════════════════════════════════════════════════════════════════
// toVisibleTree — TreeView projection
// ═══════════════════════════════════════════════════════════════════

/**
 * Returns a flat list of visible nodes respecting expanded state.
 * Collapsed folders' children are excluded.
 *
 * Replaces flattenVisibleTree(DocItem[], expanded[]):
 *   Before: flattenVisibleTree(items, expandedIds)
 *   After:  toVisibleTree(collection, expandedIds)
 */
export function toVisibleTree<T extends { id: string }>(
  c: NormalizedCollection<T>,
  expandedIds: readonly string[],
): FlatNode[] {
  const expanded = new Set(expandedIds);
  const result: FlatNode[] = [];

  function walk(pId: string, depth: number) {
    for (const id of c.order[pId] ?? []) {
      const expandable = (c.order[id]?.length ?? 0) > 0;
      result.push({ id, level: depth, expandable });
      if (expandable && expanded.has(id)) {
        walk(id, depth + 1);
      }
    }
  }

  walk("", 0);
  return result;
}

// ═══════════════════════════════════════════════════════════════════
// toGrouped — KanbanView / GroupedList projection
// ═══════════════════════════════════════════════════════════════════

/**
 * Groups root-level entities by a key function.
 * Returns Map<GroupKey, T[]> preserving insertion order within groups.
 *
 * Example:
 *   toGrouped(collection, item => item.status)
 *   → Map { "todo" => [a, c], "doing" => [b], "done" => [d] }
 */
export function toGrouped<T extends { id: string }, G>(
  c: NormalizedCollection<T>,
  groupBy: (item: T) => G,
): Map<G, T[]> {
  const map = new Map<G, T[]>();
  for (const id of c.order[""] ?? []) {
    const entity = c.entities[id];
    if (!entity) continue;
    const key = groupBy(entity);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entity);
  }
  return map;
}
