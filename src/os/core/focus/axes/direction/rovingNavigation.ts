// Roving Navigation Engine (1D: v/h)
// Index-based navigation for lists with JIT spatial sorting

import type { FocusBehavior } from "../../behavior/behaviorTypes";
import { wrapIndex } from "../edge/edgeHandler";

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export interface NavigationContext {
    currentId: string | null;
    items: string[];
    direction: Direction;
    itemRects?: Record<string, DOMRect>;
    stickyX?: number | null;
    stickyY?: number | null;
}

/**
 * Roving Navigation Engine
 * Index-based navigation for lists.
 */
export function findNextRovingTarget(ctx: NavigationContext, behavior: FocusBehavior): string | null {
    const { currentId, items, direction } = ctx;
    const { edge } = behavior;

    // Determine major axis from behavior
    // "v" -> Column layout (Y-major)
    // "h" -> Row layout (X-major)
    const isVertical = behavior.direction === "v";

    // JIT Spatial Sort: Ensure items are sorted by Visual Position
    const sortedItems = [...items].sort((a, b) => {
        const rectA = ctx.itemRects?.[a] || document.getElementById(a)?.getBoundingClientRect();
        const rectB = ctx.itemRects?.[b] || document.getElementById(b)?.getBoundingClientRect();

        if (!rectA || !rectB) return 0; // Fallback

        const threshold = 4; // visual tolerance

        if (isVertical) {
            // Sort by Y -> X
            const deltaY = rectA.top - rectB.top;
            if (Math.abs(deltaY) < threshold) {
                return rectA.left - rectB.left;
            }
            return deltaY;
        } else {
            // Sort by X -> Y
            const deltaX = rectA.left - rectB.left;
            if (Math.abs(deltaX) < threshold) {
                return rectA.top - rectB.top;
            }
            return deltaX;
        }
    });

    if (!currentId || sortedItems.length === 0) return sortedItems[0] || null;

    const currentIndex = sortedItems.indexOf(currentId);
    if (currentIndex === -1) return sortedItems[0];

    let nextIndex = currentIndex;
    const isHorizontal = !isVertical;

    if (
        (isVertical && direction === "UP") ||
        (isHorizontal && direction === "LEFT")
    ) {
        nextIndex--;
    } else if (
        (isVertical && direction === "DOWN") ||
        (isHorizontal && direction === "RIGHT")
    ) {
        nextIndex++;
    }

    // Use Edge Handler for boundary wrapping
    const wrappedIndex = wrapIndex(nextIndex, sortedItems.length, edge);

    // If index didn't change after wrapping (stop behavior at boundary), return current
    if (wrappedIndex === nextIndex && (nextIndex < 0 || nextIndex >= sortedItems.length)) {
        return currentId;
    }

    return sortedItems[wrappedIndex];
}

