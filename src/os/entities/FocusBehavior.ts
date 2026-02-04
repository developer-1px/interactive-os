import type { FocusDirection } from "./FocusDirection";
import type { FocusEdge } from "./FocusEdge";
import type { FocusTab } from "./FocusTab";
import type { FocusTarget } from "./FocusTarget";
import type { FocusEntry } from "./FocusEntry";

// Moved from src/os/core/focus/behavior/behaviorTypes.ts
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
