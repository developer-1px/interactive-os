// Navigation Pipeline
// Composable axis handlers for decoupled focus navigation

import type { NavContext } from "@os/entities/NavContext";
import type { NavResult } from "@os/entities/NavResult";

/** Single axis handler in the pipeline */
export type AxisHandler = (ctx: NavContext) => NavContext | null;

/**
 * Runs the navigation pipeline through all handlers.
 * Each handler can modify context or return null to halt.
 */
export function focusPipeline(
    handlers: AxisHandler[],
    initialContext: NavContext
): NavResult | null {
    let ctx: NavContext | null = initialContext;

    for (const handler of handlers) {
        if (!ctx) break;
        ctx = handler(ctx);
    }

    if (!ctx) return null;

    // Extract result from final context
    return {
        targetId: ctx.finalTargetId ?? ctx.targetId ?? null,
        zoneId: ctx.finalZoneId ?? null,
        stickyX: ctx.anchor?.x ?? null,
        stickyY: ctx.anchor?.y ?? null,
        shouldTrap: ctx.shouldTrap ?? false,
    };
}
