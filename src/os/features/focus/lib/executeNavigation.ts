// Focus Navigation Orchestrator
// Simplified pipeline-based navigation
import { runPipeline, type AxisHandler } from "./runPipeline";
import { restoreAxis } from "@os/features/focus/axes/restoreAxis";
import { directionAxis } from "@os/features/focus/axes/directionAxis";
import { entryAxis } from "@os/features/focus/axes/entryAxis";
import type { NavContext } from "@os/entities/NavContext";
import type { NavResult } from "@os/entities/NavResult";

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
