// Direction Axis Dispatcher
// Unified entry point for all direction navigation

import { logger } from "@os/debug/logger";
import type { FocusBehavior } from "../../behavior/behaviorTypes";
import type { AxisHandler } from "../../pipeline";
import { resolveBehavior } from "../../behavior/behaviorResolver";
import { collectItemRects } from "../../utils/domUtils";
import { resolvePivot, getBubblePath } from "../../utils/pivotUtils";
import { findNextRovingTarget, type NavigationContext } from "./rovingNavigation";
import { findNextSpatialTarget } from "./spatialNavigation";

export type { Direction } from "../../focusTypes";

/**
 * Unified Navigation Finder (Behavior-First)
 * Dispatches to the appropriate logic based on FocusBehavior.
 */
export function findNextTarget(behavior: FocusBehavior, ctx: NavigationContext): string | null {
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

