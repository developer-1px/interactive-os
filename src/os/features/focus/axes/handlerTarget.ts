// Target Axis: Virtual vs Real focus handling
// Determines if focus should be real (DOM) or virtual (state-only)
export type TargetMode = "real" | "virtual";

/**
 * Applies focus to target based on mode
 */
export function applyFocus(
    targetId: string,
    mode: TargetMode,
    options?: { preventScroll?: boolean }
): boolean {
    if (mode === "virtual") {
        // Virtual focus: only update state, don't move DOM focus
        return true;
    }

    // Real focus: move DOM focus to the element
    const element = document.getElementById(targetId);
    if (!element) return false;

    element.focus({ preventScroll: options?.preventScroll ?? true });
    return true;
}
