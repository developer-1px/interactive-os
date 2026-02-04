// Edge Axis: Navigation boundary handling
// Manages loop vs stop behavior at zone boundaries

import type { FocusBehavior } from "../../behavior/behaviorTypes";

export type EdgeBehavior = "loop" | "stop";

/**
 * Determines if navigation should continue bubbling or stop at the edge
 * Returns whether to trap navigation within the current zone
 */
export function shouldTrapAtEdge(
    behavior: FocusBehavior,
    hasValidTarget: boolean
): boolean {
    // If we found a valid target, always trap (stop bubbling)
    if (hasValidTarget) return true;

    // If tab behavior is not 'escape', trap at this zone
    if (behavior.tab !== "escape") return true;

    // Otherwise, allow bubbling to parent zone
    return false;
}

/**
 * Edge wrap logic for lists
 * Returns the wrapped index when hitting boundaries
 */
export function wrapIndex(
    currentIndex: number,
    itemCount: number,
    edge: EdgeBehavior
): number {
    if (itemCount === 0) return -1;

    if (currentIndex < 0) {
        return edge === "loop" ? itemCount - 1 : 0;
    }

    if (currentIndex >= itemCount) {
        return edge === "loop" ? 0 : itemCount - 1;
    }

    return currentIndex;
}
