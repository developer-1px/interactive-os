// Focus Navigation Orchestrator
// Simplified pipeline-based navigation
import { focusPipeline, type AxisHandler } from "./focusPipeline";
import { handlerRestore } from "@os/features/focus/pipeline/3-resolve/tab/restore";
import { handlerDirection } from "@os/features/focus/pipeline/3-resolve/navigate/roving";
import { handlerEntry } from "@os/features/focus/pipeline/3-resolve/navigate/entry";
import type { NavContext } from "@os/entities/NavContext";
import type { NavResult } from "@os/entities/NavResult";

// Navigation pipeline: ordered sequence of axis handlers
const navigationPipeline: AxisHandler[] = [
    handlerRestore,    // 1. Prepare sticky anchor
    handlerDirection,  // 2. Find target via zone traversal
    handlerEntry,      // 3. Resolve entry point for nested zones
];

/**
 * Execute navigation through the pipeline
 */
export function executeNavigation(ctx: NavContext): NavResult | null {
    return focusPipeline(navigationPipeline, ctx);
}

// Re-export types for consumers
