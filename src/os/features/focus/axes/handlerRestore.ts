// Restore Axis: Focus restoration and spatial memory
// Manages sticky anchors and focus history restoration

import type { AxisHandler } from "@os/features/focus/lib/focusPipeline";

// (Function removed - logic inlined in handlerRestore)

/**
 * Restore Axis Handler for Pipeline
 * Prepares sticky anchor at the start of navigation
 * 
 * Key Behavior:
 * - If stickyX/Y already exists from store, USE IT (don't recalculate)
 * - Only calculate from current element if no sticky value exists
 */
export const handlerRestore: AxisHandler = (ctx) => {
    const isVertical = ctx.direction === "UP" || ctx.direction === "DOWN";
    const isHorizontal = ctx.direction === "LEFT" || ctx.direction === "RIGHT";

    // Start with existing sticky values from store
    let stickyX = ctx.stickyX;
    let stickyY = ctx.stickyY;

    // Only initialize sticky from current element if not already set
    if (isVertical && stickyX === null && ctx.focusedItemId) {
        const el = document.getElementById(ctx.focusedItemId);
        if (el) {
            const rect = el.getBoundingClientRect();
            stickyX = rect.left + rect.width / 2;
        }
    } else if (isHorizontal && stickyY === null && ctx.focusedItemId) {
        const el = document.getElementById(ctx.focusedItemId);
        if (el) {
            const rect = el.getBoundingClientRect();
            stickyY = rect.top + rect.height / 2;
        }
    }

    // Clear the perpendicular axis when changing direction
    if (isVertical) {
        stickyY = null;
    } else if (isHorizontal) {
        stickyX = null;
    }

    return {
        ...ctx,
        anchor: { x: stickyX, y: stickyY },
    };
};

