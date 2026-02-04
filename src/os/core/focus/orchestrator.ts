// Focus Navigation Orchestrator
// Simplified pipeline-based navigation

import type { NavContext, NavResult } from "./focusTypes";
import { runPipeline, type AxisHandler } from "./pipeline";
import { restoreAxis } from "./axes/restore/restoreHandler";
import { directionAxis } from "./axes/direction/directionDispatcher";
import { entryAxis } from "./axes/entry/entryHandler";

// Navigation pipeline: ordered sequence of axis handlers
const navigationPipeline: AxisHandler[] = [
    restoreAxis,    // 1. Prepare sticky anchor
    directionAxis,  // 2. Find target via zone traversal
    entryAxis,      // 3. Resolve entry point for nested zones
];

/**
 * Execute navigation through the pipeline
 */
export function executeNavigation(ctx: NavContext): NavResult | null {
    return runPipeline(navigationPipeline, ctx);
}

// Re-export types for consumers
export type { NavContext, NavResult } from "./focusTypes";
