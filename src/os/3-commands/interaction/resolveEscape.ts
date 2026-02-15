/**
 * resolveEscape — Pure escape/dismiss resolver.
 *
 * Extracts the dismiss decision logic from the OS_ESCAPE command.
 * The command itself handles Immer state updates; this function
 * computes what should happen.
 */

export type DismissBehavior = "deselect" | "close" | "none";

export interface EscapeResult {
    action: "deselect" | "close" | "none";
}

/**
 * Resolve what ESCAPE should do for a given dismiss config + zone state.
 *
 * @param behavior - The zone's dismiss.escape config value
 * @param hasSelection - Whether the zone currently has selected items
 * @returns The action to perform
 */
export function resolveEscape(
    behavior: DismissBehavior,
    hasSelection: boolean,
): EscapeResult {
    switch (behavior) {
        case "deselect":
            // Only acts if there's a selection to clear
            return { action: hasSelection ? "deselect" : "none" };
        case "close":
            return { action: "close" };
        default:
            return { action: "none" };
    }
}
