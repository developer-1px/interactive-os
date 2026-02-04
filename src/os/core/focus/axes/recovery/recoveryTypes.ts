// Recovery Axis Types - Focus restoration when target becomes invalid

import type { FocusDirection } from "../../behavior/behaviorTypes";

/**
 * Sibling selection policy for focus recovery
 */
export type SiblingPolicy = "next-first" | "prev-first" | "spatial";

/**
 * Fallback policy when no sibling is available
 */
export type FallbackPolicy = "zone-default" | "parent" | "none";

/**
 * Recovery policy configuration
 */
export interface RecoveryPolicy {
    /** How to select sibling target */
    siblingPolicy: SiblingPolicy;
    /** What to do when no sibling available */
    fallback: FallbackPolicy;
}

/**
 * Default recovery policy: next sibling first, then zone's first item
 */
export const DEFAULT_RECOVERY_POLICY: RecoveryPolicy = {
    siblingPolicy: "next-first",
    fallback: "zone-default",
};

/**
 * Context for recovery resolution
 */
export interface RecoveryContext {
    /** ID of the item being removed/invalidated */
    removedItemId: string;
    /** Current zone ID */
    zoneId: string;
    /** All items in the zone (before removal) */
    items: string[];
    /** Zone's direction behavior */
    direction: FocusDirection;
    /** Recovery policy to apply */
    policy: RecoveryPolicy;
}

/**
 * Result of recovery resolution
 */
export interface RecoveryResult {
    /** New target to focus */
    targetId: string | null;
    /** Reason for the selection */
    reason: "sibling-next" | "sibling-prev" | "zone-default" | "parent" | "none";
}
