/**
 * pasteBubbling — Pure function for paste target resolution.
 *
 * Given a focused item ID and clipboard data, traverses the registered
 * collection hierarchy to find the nearest collection that accepts the data.
 *
 * PRD 1.5: Paste Bubbling (OS mechanism)
 *
 * Rules:
 * 1. Find the collection that contains the focused item
 * 2. Ask that collection to accept the clipboard data
 * 3. If rejected, bubble up to parent collection
 * 4. Repeat until accepted or no more parents → null
 */

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface CollectionNode {
    /** Unique collection identifier (e.g., "root", "ncp-pricing:cards") */
    id: string;
    /** Parent collection ID. null = root level. */
    parentId: string | null;
    /** Accept function: returns transformed item if accepted, null if rejected */
    accept: (data: unknown) => unknown | null;
    /** Returns true if this collection directly contains the given item ID */
    containsItem: (itemId: string) => boolean;
}

export interface BubbleResult {
    /** The collection that accepted the data */
    collectionId: string;
    /** The transformed data (output of accept) */
    acceptedData: unknown;
}

// ═══════════════════════════════════════════════════════════════════
// Pure function
// ═══════════════════════════════════════════════════════════════════

/**
 * Find the nearest collection that accepts the clipboard data,
 * starting from the collection containing the focused item and
 * bubbling up through parent collections.
 */
export function findAcceptingCollection(
    focusedItemId: string,
    clipboardData: unknown,
    collections: CollectionNode[],
): BubbleResult | null {
    // 1. Find which collection contains the focused item
    let current = collections.find((c) => c.containsItem(focusedItemId));

    // If no collection contains this item, try root (parentId===null)
    if (!current) {
        current = collections.find((c) => c.parentId === null);
    }

    // 2. Bubble up through collection hierarchy
    while (current) {
        const result = current.accept(clipboardData);
        if (result !== null) {
            return { collectionId: current.id, acceptedData: result };
        }
        // Move to parent
        if (current.parentId === null) break;
        current = collections.find((c) => c.id === current!.parentId);
    }

    return null;
}
