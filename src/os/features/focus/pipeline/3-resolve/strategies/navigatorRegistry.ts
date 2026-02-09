import { DOM } from "../../../lib/dom";
import type { Direction, NavigateConfig } from "../../../types";
import { resolveCorner } from "../cornerNav";
import { findBestCandidate, type FocusCandidate } from "../focusFinder";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface NavigateResult {
  targetId: string | null;
  stickyX: number | null;
  stickyY: number | null;
}

export type NavigationStrategy = (
  currentId: string | null,
  direction: Direction,
  items: string[],
  config: NavigateConfig,
  spatial: { stickyX: number | null; stickyY: number | null },
) => NavigateResult;

// ═══════════════════════════════════════════════════════════════════
// Default Strategies
// ═══════════════════════════════════════════════════════════════════

const resolveLinear: NavigationStrategy = (
  currentIndex,
  direction,
  items,
  config,
) => {
  // Note: currentIndex is passed as ID in the signature, so we need to find index
  // But the signature says currentId: string | null.
  // Let's fix the implementation to match the signature.

  // Safety check if we got an index instead of ID (due to casting in previous code)
  // Actually, let's keep it strictly ID based in the interface.

  const currentId = currentIndex as string | null;
  if (!currentId) return { targetId: items[0], stickyX: null, stickyY: null };

  const idx = items.indexOf(currentId);
  if (idx === -1) return { targetId: items[0], stickyX: null, stickyY: null };

  // W3C APG: Home/End jump to first/last
  if (direction === "home") {
    return { targetId: items[0], stickyX: null, stickyY: null };
  }
  if (direction === "end") {
    return {
      targetId: items[items.length - 1],
      stickyX: null,
      stickyY: null,
    };
  }

  const isForward = direction === "down" || direction === "right";
  const delta = isForward ? 1 : -1;
  let nextIndex = idx + delta;

  // Boundary handling
  if (nextIndex < 0) {
    nextIndex = config.loop ? items.length - 1 : 0;
  } else if (nextIndex >= items.length) {
    nextIndex = config.loop ? 0 : items.length - 1;
  }

  return {
    targetId: items[nextIndex],
    stickyX: null,
    stickyY: null,
  };
};

/**
 * Android FocusFinder-style Spatial Navigation
 *
 * 100% port of Android's FocusFinder algorithm:
 * - isCandidate: partial overlap allowed (not strict boundary)
 * - beamBeats: beam-aligned candidates strongly preferred
 * - getWeightedDistanceFor: 13 * major² + minor² scoring
 */
const resolveSpatial: NavigationStrategy = (
  currentId,
  direction,
  items,
  _config,
  spatial,
) => {
  if (!currentId) return { targetId: null, stickyX: null, stickyY: null };

  const currentEl = DOM.getItem(currentId);
  if (!currentEl) {
    return { targetId: currentId, stickyX: null, stickyY: null };
  }

  const currentRect = currentEl.getBoundingClientRect();

  // Build candidate list
  const candidates: FocusCandidate[] = [];
  for (const id of items) {
    if (id === currentId) continue;
    const el = DOM.getItem(id);
    if (!el) continue;
    candidates.push({ id, rect: el.getBoundingClientRect() });
  }

  if (candidates.length === 0) {
    return { targetId: currentId, stickyX: null, stickyY: null };
  }

  // home/end are not spatial directions
  if (direction === "home" || direction === "end") {
    return { targetId: currentId, stickyX: null, stickyY: null };
  }

  // Use Android FocusFinder to find best candidate
  const best = findBestCandidate(currentRect, direction, candidates);

  if (!best) {
    return {
      targetId: currentId,
      stickyX: spatial.stickyX,
      stickyY: spatial.stickyY,
    };
  }

  // Update sticky based on movement direction
  const currentCenterX = (currentRect.left + currentRect.right) / 2;
  const currentCenterY = (currentRect.top + currentRect.bottom) / 2;
  const anchorX = spatial.stickyX ?? currentCenterX;
  const anchorY = spatial.stickyY ?? currentCenterY;

  const newStickyX =
    direction === "up" || direction === "down" ? anchorX : null;
  const newStickyY =
    direction === "left" || direction === "right" ? anchorY : null;

  return {
    targetId: best.id,
    stickyX: newStickyX,
    stickyY: newStickyY,
  };
};


// ═══════════════════════════════════════════════════════════════════
// Registry
// ═══════════════════════════════════════════════════════════════════

const strategies = new Map<string, NavigationStrategy>();

function registerNavigationStrategy(
  name: string,
  strategy: NavigationStrategy,
): void {
  strategies.set(name, strategy);
}

// Register Defaults
registerNavigationStrategy("linear", resolveLinear);
registerNavigationStrategy("spatial", resolveSpatial);
registerNavigationStrategy("corner", resolveCorner);

// ═══════════════════════════════════════════════════════════════════
// Resolver Facade
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolves navigation using the strategy defined in config.orientation.
 * If no strategy matches, falls back to 'linear' or 'spatial' based on name.
 */
export function resolveWithStrategy(
  orientation: string,
  ...args: Parameters<NavigationStrategy>
): NavigateResult {
  // 1. Try exact match (e.g. 'grid-custom')
  let strategy = strategies.get(orientation);

  // 2. Fallback: Map known orientations to core strategies
  if (!strategy) {
    if (orientation === "horizontal" || orientation === "vertical") {
      strategy = strategies.get("linear");
    } else if (orientation === "both") {
      strategy = strategies.get("spatial");
    } else if (orientation === "corner") {
      strategy = strategies.get("corner");
    }
  }

  if (strategy) {
    return strategy(...args);
  }

  // 3. Last Resort: No-op
  return { targetId: args[0], stickyX: null, stickyY: null };
}
