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

// ═══════════════════════════════════════════════════════════════════
// Frequency Guard (Rate Limiting per Frame)
// ═══════════════════════════════════════════════════════════════════

/**
 * Limits how many times a function can be called within a single animation frame.
 * Prevents rapid-fire state updates that cause the browser to freeze.
 *
 * Usage:
 *   const guard = createFrequencyGuard("focusSensor", 50);
 *   function handleEvent(e) {
 *     if (!guard.check()) return; // rate limited
 *     ...
 *   }
 */
export function createFrequencyGuard(name: string, maxPerFrame: number = 50) {
  let count = 0;
  let frameId: number | null = null;
  let warned = false;

  function resetOnNextFrame() {
    if (frameId === null) {
      frameId = requestAnimationFrame(() => {
        count = 0;
        frameId = null;
        warned = false;
      });
    }
  }

  return {
    /** Check if the call is within limits. Returns false if rate limited. */
    check(): boolean {
      count++;
      resetOnNextFrame();

      if (count > maxPerFrame) {
        if (!warned) {
          warned = true;
          console.error(
            `[LoopGuard] ⛔ "${name}" exceeded ${maxPerFrame} calls/frame. ` +
              `Likely an infinite loop. Throttling until next frame.`,
          );
        }
        return false;
      }
      return true;
    },

    /** Get call count in current frame (for debugging). */
    getCount(): number {
      return count;
    },

    /** Reset (for testing). */
    reset(): void {
      count = 0;
      warned = false;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// Pre-built Guards (Singleton instances for OS systems)
// ═══════════════════════════════════════════════════════════════════

/** Guard for command dispatch — prevents recursive dispatch loops */
export const dispatchGuard = createReentrantGuard("command.dispatch", 10);

/** Guard for focus sensor events — prevents event storm */
export const sensorGuard = createFrequencyGuard("focus.sensor", 200);

/** Guard for active zone changes — prevents zone flip-flop */
export const activeZoneGuard = createFrequencyGuard("focus.activeZone", 50);
