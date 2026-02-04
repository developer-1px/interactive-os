/**
 * DOM Utility for Focus System
 * Centralizes all direct DOM access (read) operations.
 */

// Helper to get rect with fallback
const getRect = (id: string): DOMRect | null => {
    const el = document.getElementById(id);
    return el ? el.getBoundingClientRect() : null;
};

/**
 * Batch Collect Item Rects
 * Queries the DOM for all items in the list and returns a map of ID -> Rect.
 * This should be called ONCE per navigation event to ensure consistency and performance.
 */
export function collectItemRects(items: string[]): Record<string, DOMRect> {
    const rects: Record<string, DOMRect> = {};

    // Optimization: Loop once
    // We can use requestAnimationFrame or similar if this becomes slow (unlikely for <100 items)
    for (const id of items) {
        const rect = getRect(id);
        if (rect) {
            rects[id] = rect;
        }
    }

    return rects;
}

/**
 * Get Single Item Rect
 * Wrapper around getBoundingClientRect for getting pivot or single item context.
 */
export function getItemRect(id: string): DOMRect | null {
    return getRect(id);
}
