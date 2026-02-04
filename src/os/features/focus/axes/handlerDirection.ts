// Direction Axis Dispatcher
// Unified entry point for all direction navigation

import { logger } from "@os/app/debug/logger";
import type { AxisHandler } from "@os/features/focus/lib/focusPipeline";
import { resolveBehavior } from "@os/features/focus/lib/behaviorResolver";
import { collectItemRects } from "@os/features/focus/lib/domUtils";
import { resolvePivot, getBubblePath } from "@os/features/focus/lib/pivotUtils";
import { findNextRovingTarget, type NavigationContext } from "@os/features/focus/lib/navigationRoving";
import { findNextSpatialTarget } from "@os/features/focus/lib/navigationSpatial";
import { findSiblingZone, getSeamlessEntryItem } from "@os/features/focus/axes/handlerSeamless";
import type { FocusBehavior } from "@os/entities/FocusBehavior";

/**
 * Unified Navigation Finder (Behavior-First)
 * Dispatches to the appropriate logic based on FocusBehavior.
 */
function findNextTarget(behavior: FocusBehavior, ctx: NavigationContext): string | null {
    if (behavior.direction === "none") return null;

    const result = (() => {
        switch (behavior.direction) {
            case "v":
            case "h":
                return findNextRovingTarget(ctx, behavior);
            case "grid":
                return findNextSpatialTarget(ctx);
            default:
                return findNextSpatialTarget(ctx);
        }
    })();

    logger.debug("NAVIGATION", `Direction: ${behavior.direction} -> Result: ${result}`, {
        itemsCount: ctx.items.length,
        firstItem: ctx.items[0],
        currentId: ctx.currentId,
        direction: ctx.direction
    });
    return result;
}

/**
 * Direction Axis Handler for Pipeline
 * Traverses zones and finds navigation target
 */
export const directionAxis: AxisHandler = (ctx) => {
    const { direction, focusPath, zoneRegistry, focusedItemId, anchor } = ctx;

    const bubblePath = getBubblePath(focusPath);

    for (const zoneId of bubblePath) {
        const zoneMetadata = zoneRegistry[zoneId];
        if (!zoneMetadata) continue;

        // Direction Policy Guard
        if (zoneMetadata.allowedDirections) {
            if (!zoneMetadata.allowedDirections.includes(direction)) {
                logger.debug("NAVIGATION", `Blocked by Zone Policy: ${zoneId}`);
                continue;
            }
        }

        const zoneItems = zoneMetadata.items || [];
        const localPivot = resolvePivot(zoneItems, focusedItemId, zoneId);
        const behavior = zoneMetadata.behavior || resolveBehavior(undefined, undefined);

        // Direction Filter (bubble unhandled directions)
        const isVerticalDir = direction === "UP" || direction === "DOWN";
        const isHorizontalDir = direction === "LEFT" || direction === "RIGHT";
        const isMatchingDirection = (
            (behavior.direction === "v" && isVerticalDir) ||
            (behavior.direction === "h" && isHorizontalDir) ||
            behavior.direction === "grid"
        );

        // Seamless: allow cross-direction navigation to sibling zones
        if (behavior.seamless && !isMatchingDirection && behavior.direction !== "none") {
            const siblingZone = findSiblingZone({
                currentZoneId: zoneId,
                direction,
                zoneRegistry
            });

            if (siblingZone) {
                const entryId = getSeamlessEntryItem(siblingZone, direction, focusedItemId ?? undefined);
                if (entryId) {
                    logger.debug("NAVIGATION", `Seamless cross-direction to zone: ${siblingZone.id}, entry: ${entryId}`);
                    return {
                        ...ctx,
                        currentZoneId: siblingZone.id,
                        behavior: siblingZone.behavior,
                        items: siblingZone.items,
                        targetId: entryId,
                    };
                }
            }
            continue; // Bubble up if no sibling found
        }

        if (behavior.direction === "v" && isHorizontalDir) continue;
        if (behavior.direction === "h" && isVerticalDir) continue;
        if (behavior.direction === "none") continue;

        // Navigation Engine
        const itemRects = collectItemRects(zoneItems);
        const targetId = findNextTarget(behavior, {
            currentId: localPivot,
            items: zoneItems,
            direction,
            stickyX: anchor?.x,
            stickyY: anchor?.y,
            itemRects
        });

        if (targetId) {
            return {
                ...ctx,
                currentZoneId: zoneId,
                behavior,
                items: zoneItems,
                pivotId: localPivot,
                targetId,
            };
        }

        // Seamless: attempt cross-zone navigation to sibling zone (same-direction edge case)
        if (behavior.seamless && !targetId) {
            const siblingZone = findSiblingZone({
                currentZoneId: zoneId,
                direction,
                zoneRegistry
            });

            if (siblingZone) {
                const entryId = getSeamlessEntryItem(siblingZone, direction, focusedItemId ?? undefined);
                if (entryId) {
                    logger.debug("NAVIGATION", `Seamless transition to zone: ${siblingZone.id}, entry: ${entryId}`);
                    return {
                        ...ctx,
                        currentZoneId: siblingZone.id,
                        behavior: siblingZone.behavior,
                        items: siblingZone.items,
                        targetId: entryId,
                    };
                }
            }
        }

        // Check trap
        if (behavior.tab !== "escape") {
            return {
                ...ctx,
                currentZoneId: zoneId,
                behavior,
                shouldTrap: true,
            };
        }
    }

    // Bubbled to top without finding target
    return null;
};

