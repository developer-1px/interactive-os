/**
 * LoopGuard - Infinite Loop / Reentrant Call Defense
 *
 * OS-level defensive utility that detects and breaks infinite loops
 * at critical system chokepoints (command dispatch, focus events, store updates).
 *
 * Two guard strategies:
 * 1. ReentrantGuard — Prevents re-entrant calls (recursion depth limit)
 * 2. FrequencyGuard — Limits call frequency per time window
 */

// ═══════════════════════════════════════════════════════════════════
// Reentrant Guard (Recursion Depth)
// ═══════════════════════════════════════════════════════════════════

/**
 * Prevents a function from being called recursively beyond a maximum depth.
 * If the depth is exceeded, logs a warning and returns early.
 *
 * Usage:
 *   const guard = createReentrantGuard("dispatch", 10);
 *   function dispatch(cmd) {
 *     if (!guard.enter()) return; // exceeded max depth
 *     try { ... } finally { guard.exit(); }
 *   }
 */
export function createReentrantGuard(name: string, maxDepth: number = 8) {
  let depth = 0;
  let warned = false;

  return {
    /** Try to enter the guarded section. Returns false if max depth exceeded. */
    enter(): boolean {
      depth++;
      if (depth > maxDepth) {
        if (!warned) {
          warned = true;
          console.error(
            `[LoopGuard] ⛔ "${name}" exceeded max reentrant depth (${maxDepth}). ` +
            `This is likely an infinite loop. Current depth: ${depth}. Breaking out.`,
          );
          // Log stack trace for debugging
          console.trace(`[LoopGuard] "${name}" stack trace:`);
        }
        depth--;
        return false;
      }
      warned = false;
      return true;
    },

    /** Exit the guarded section. */
    exit(): void {
      depth = Math.max(0, depth - 1);
    },

    /** Get current depth (for debugging). */
    getDepth(): number {
      return depth;
    },

    /** Reset the guard state (for testing). */
    reset(): void {
      depth = 0;
      warned = false;
    },
  };
}

