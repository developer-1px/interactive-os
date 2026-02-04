// Restore Axis: Focus restoration and spatial memory
// Manages sticky anchors and focus history restoration

import type { AxisHandler } from "../../pipeline";

/**
 * Prepares sticky anchor for spatial navigation
 * When moving vertically, preserve X position
 * When moving horizontally, preserve Y position
 */
export function prepareStickyAnchor(
    direction: "UP" | "DOWN" | "LEFT" | "RIGHT",
    focusedItemId: string | null,
    currentStickyX: number | null,
    currentStickyY: number | null
): { x: number | null; y: number | null } {
    const isVertical = direction === "UP" || direction === "DOWN";
    const isHorizontal = direction === "LEFT" || direction === "RIGHT";

    let activeStickyX = currentStickyX;
    let activeStickyY = currentStickyY;

    // Axis Reset
    if (isVertical) {
        activeStickyY = null; // Clear horizontal anchor
        if (activeStickyX === null && focusedItemId) {
            const el = document.getElementById(focusedItemId);
            if (el) {
                const rect = el.getBoundingClientRect();
                activeStickyX = rect.left + rect.width / 2;
            }
        }
    } else if (isHorizontal) {
        activeStickyX = null; // Clear vertical anchor
        if (activeStickyY === null && focusedItemId) {
            const el = document.getElementById(focusedItemId);
            if (el) {
                const rect = el.getBoundingClientRect();
                activeStickyY = rect.top + rect.height / 2;
            }
        }
    }

    return { x: activeStickyX, y: activeStickyY };
}

/**
 * Restore Axis Handler for Pipeline
 * Prepares sticky anchor at the start of navigation
 */
export const restoreAxis: AxisHandler = (ctx) => {
    const anchor = prepareStickyAnchor(
        ctx.direction,
        ctx.focusedItemId,
        ctx.stickyX,
        ctx.stickyY
    );

    return {
        ...ctx,
        anchor,
    };
};

