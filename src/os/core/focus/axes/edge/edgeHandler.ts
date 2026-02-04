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
 * Returns:
 * - wrapped index for "loop"
 * - boundary index for "stop"  
 */
export function wrapIndex(
    currentIndex: number,
    itemCount: number,
    edge: EdgeBehavior
): number {
    if (itemCount === 0) return -1;

    if (currentIndex < 0) {
        if (edge === "loop") return itemCount - 1;
        return 0; // stop
    }

    if (currentIndex >= itemCount) {
        if (edge === "loop") return 0;
        return itemCount - 1; // stop
    }

    return currentIndex;
}
