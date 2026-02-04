// Focus Behavior Types (6-Axis System)

export type FocusDirection = "none" | "v" | "h" | "grid";
export type FocusEdge = "loop" | "stop";
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
}
