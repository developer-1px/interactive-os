// Navigation Pipeline
// Composable axis handlers for decoupled focus navigation

import { logger } from "@os/debug/logger";
import type { NavContext, NavResult } from "./focusTypes";

/** Single axis handler in the pipeline */
export type AxisHandler = (ctx: NavContext) => NavContext | null;

/**
 * Runs the navigation pipeline through all handlers.
 * Each handler can modify context or return null to halt.
 */
export function runPipeline(
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

/**
 * Creates a debug-wrapped pipeline that logs each step
 */
export function createDebugPipeline(handlers: AxisHandler[]): AxisHandler[] {
    return handlers.map((handler, i) => (ctx) => {
        const result = handler(ctx);
        logger.debug("NAVIGATION", `Pipeline Step ${i + 1}: ${result ? "✓" : "✗"}`);
        return result;
    });
}
