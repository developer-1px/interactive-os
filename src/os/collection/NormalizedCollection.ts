/**
 * NormalizedCollection — Universal collection format.
 *
 * Based on: Redux EntityAdapter (entities) + Adjacency List (order).
 *
 * entities: Record<id, T>         — O(1) lookup
 * order:    Record<parentId, id[]> — "" = root, parentId = children
 *
 * Flat list:  { entities, order: { "": ["a","b","c"] } }
 * Tree:       { entities, order: { "": ["root"], "root": ["c1","c2"] } }
 */

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface NormalizedCollection<T extends { id: string }> {
    /** Entity map — O(1) lookup by id */
    entities: Record<string, T>;
    /** Adjacency list — parentId → ordered children. "" = root level. */
    order: Record<string, string[]>;
}

// ═══════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════

export function createCollection<T extends { id: string }>(
    entities: Record<string, T>,
    order: Record<string, string[]>,
): NormalizedCollection<T> {
    return { entities, order };
}

// ═══════════════════════════════════════════════════════════════════
// Queries (pure, non-mutating)
// ═══════════════════════════════════════════════════════════════════

/** Root-level item ids in order. */
export function getRoots<T extends { id: string }>(c: NormalizedCollection<T>): string[] {
    return c.order[""] ?? [];
}

/** Ordered children of a parent. Empty array if none. */
export function getChildren<T extends { id: string }>(c: NormalizedCollection<T>, parentId: string): string[] {
    return c.order[parentId] ?? [];
}

/** Find parent id of a given entity. null if root-level. */
export function getParent<T extends { id: string }>(c: NormalizedCollection<T>, id: string): string | null {
    for (const [parentId, children] of Object.entries(c.order)) {
        if (children.includes(id)) {
            return parentId === "" ? null : parentId;
        }
    }
    return null;
}

/** All entity ids (unordered). */
export function allIds<T extends { id: string }>(c: NormalizedCollection<T>): string[] {
    return Object.keys(c.entities);
}
