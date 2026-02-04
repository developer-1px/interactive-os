// Recovery Handler - Direction-aware focus restoration
// Resolves next focus target when current focus becomes invalid
import type {
    RecoveryContext,
    RecoveryResult,
    RecoveryPolicy,
    SiblingPolicy,
} from "@os/features/focus/model/recoveryTypes";
import { DEFAULT_RECOVERY_POLICY } from "@os/features/focus/model/recoveryTypes";
import type { FocusDirection } from "@os/entities/FocusDirection";

/**
 * Get sibling indices based on direction strategy
 * 
 * For vertical (v): next = index + 1, prev = index - 1
 * For horizontal (h): next = index + 1, prev = index - 1  
 * For grid: same as above (linear order in items array)
 * For none: same as above (fallback to linear)
 * 
 * The "next" and "prev" semantic follows the primary axis:
 * - v: next = down, prev = up
 * - h: next = right, prev = left
 * - grid: next = right/down (row-major), prev = left/up
 */
function getSiblingIndices(
    currentIndex: number,
    itemCount: number,
    _direction: FocusDirection,
    policy: SiblingPolicy
): { primary: number | null; secondary: number | null } {
    const nextIndex = currentIndex + 1 < itemCount ? currentIndex + 1 : null;
    const prevIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : null;

    // Direction affects which is considered "next" vs "prev"
    // For v: down is next (increasing index)
    // For h: right is next (increasing index)
    // This maps to the natural order of items array

    switch (policy) {
        case "next-first":
            return { primary: nextIndex, secondary: prevIndex };
        case "prev-first":
            return { primary: prevIndex, secondary: nextIndex };
        case "spatial":
            // Spatial would need DOM positions - fallback to next-first for now
            return { primary: nextIndex, secondary: prevIndex };
        default:
            return { primary: nextIndex, secondary: prevIndex };
    }
}

/**
 * Resolve recovery target when focus becomes invalid
 * 
 * @param ctx - Recovery context with zone info and policy
 * @returns Recovery result with new target ID
 */
function resolveRecoveryTarget(ctx: RecoveryContext): RecoveryResult {
    const { removedItemId, items, direction, policy } = ctx;

    // Find index of removed item
    const removedIndex = items.indexOf(removedItemId);

    if (removedIndex === -1) {
        // Item not in list - cannot recover from sibling
        return applyFallback(ctx);
    }

    // Items after removal
    const remainingItems = items.filter((id) => id !== removedItemId);

    if (remainingItems.length === 0) {
        // No items left - use fallback
        return applyFallback(ctx);
    }

    // Calculate sibling based on direction and policy
    const { primary, secondary } = getSiblingIndices(
        removedIndex,
        items.length,
        direction,
        policy.siblingPolicy
    );

    // Try primary sibling (adjusted for removal)
    if (primary !== null) {
        // Adjust index for removed item
        const adjustedIndex = primary > removedIndex ? primary - 1 : primary;
        if (adjustedIndex >= 0 && adjustedIndex < remainingItems.length) {
            return {
                targetId: remainingItems[adjustedIndex],
                reason: policy.siblingPolicy === "prev-first" ? "sibling-prev" : "sibling-next",
            };
        }
    }

    // Try secondary sibling
    if (secondary !== null) {
        const adjustedIndex = secondary > removedIndex ? secondary - 1 : secondary;
        if (adjustedIndex >= 0 && adjustedIndex < remainingItems.length) {
            return {
                targetId: remainingItems[adjustedIndex],
                reason: policy.siblingPolicy === "prev-first" ? "sibling-next" : "sibling-prev",
            };
        }
    }

    // Fallback: use last valid item (edge case)
    if (remainingItems.length > 0) {
        const fallbackIndex = Math.min(removedIndex, remainingItems.length - 1);
        return {
            targetId: remainingItems[fallbackIndex],
            reason: "sibling-next",
        };
    }

    return applyFallback(ctx);
}

/**
 * Apply fallback policy when no sibling available
 */
function applyFallback(ctx: RecoveryContext): RecoveryResult {
    const { items, policy, removedItemId } = ctx;
    const remainingItems = items.filter((id) => id !== removedItemId);

    switch (policy.fallback) {
        case "zone-default":
            // First item in zone
            return {
                targetId: remainingItems[0] ?? null,
                reason: "zone-default",
            };
        case "parent":
            // Caller should handle parent navigation
            return {
                targetId: null,
                reason: "parent",
            };
        case "none":
            return {
                targetId: null,
                reason: "none",
            };
        default:
            return {
                targetId: remainingItems[0] ?? null,
                reason: "zone-default",
            };
    }
}

/**
 * Execute focus recovery for a removed item
 * This is the main entry point for the recovery system
 */
export function executeRecovery(
    removedItemId: string,
    zoneId: string,
    items: string[],
    direction: FocusDirection = "v",
    policy: RecoveryPolicy = DEFAULT_RECOVERY_POLICY
): RecoveryResult {
    const ctx: RecoveryContext = {
        removedItemId,
        zoneId,
        items,
        direction,
        policy,
    };

    return resolveRecoveryTarget(ctx);
}
