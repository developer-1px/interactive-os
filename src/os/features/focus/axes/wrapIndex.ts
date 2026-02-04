// Edge Axis: Navigation boundary handling

// Edge Axis: Navigation boundary handling
// Manages loop vs stop behavior at zone boundaries
export type EdgeBehavior = "loop" | "stop";

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
