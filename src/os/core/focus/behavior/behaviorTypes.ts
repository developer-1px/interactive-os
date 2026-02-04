// Focus Behavior Types (6-Axis System)

export type FocusDirection = "none" | "v" | "h" | "grid";
export type FocusEdge = "loop" | "stop";

/**
 * Tab Navigation Policy (v7.3 Semantics)
 * 
 * - `loop`: Focus stays trapped within the zone (cycles at boundaries)
 * - `escape`: Jump to the next/previous **Zone** (Zone-level granularity)
 * - `flow`: Linear traversal through all items across zones (Item-level granularity)
 */
export type FocusTab = "loop" | "escape" | "flow";

export type FocusTarget = "real" | "virtual";
export type FocusEntry = "first" | "restore" | "selected";

/**
 * The 6-Axis Focus Behavior System
 * A unified declarative API for all interaction patterns.
 */
export interface FocusBehavior {
    direction: FocusDirection;
    edge: FocusEdge;
    tab: FocusTab;
    tabSkip?: "none" | "skip-disabled";
    target: FocusTarget;
    entry: FocusEntry;
    restore: boolean;

    /**
     * Seamless: Enable spatial cross-zone navigation
     * When true, allows navigation in directions perpendicular to the zone's axis
     * to find and move to adjacent sibling zones (like TV navigation)
     */
    seamless?: boolean;
}
