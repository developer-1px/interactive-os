/**
 * Navigator Registry — strategy dispatcher for within-zone navigation.
 *
 * Pure function — no DOM access. Rects are passed in via the spatial parameter.
 */

import type { NavigateConfig } from "../../schemas/focus/config/FocusNavigateConfig.ts";
import type { Direction } from "../../schemas/focus/FocusDirection.ts";
import { resolveCorner } from "./cornerNav.ts";
import { type FocusCandidate, findBestCandidate } from "./focusFinder.ts";

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
  spatial: {
    stickyX: number | null;
    stickyY: number | null;
    /** Item rects for spatial strategies — injected by caller */
    itemRects?: Map<string, DOMRect>;
  },
) => NavigateResult;

// ═══════════════════════════════════════════════════════════════════
// Linear Strategy (pure)
// ═══════════════════════════════════════════════════════════════════

const resolveLinear: NavigationStrategy = (
  currentId,
  direction,
  items,
  config,
) => {
  if (!currentId)
    return { targetId: items[0] ?? null, stickyX: null, stickyY: null };

  const idx = items.indexOf(currentId);
  if (idx === -1)
    return { targetId: items[0] ?? null, stickyX: null, stickyY: null };

  if (direction === "home") {
    return { targetId: items[0] ?? null, stickyX: null, stickyY: null };
  }
  if (direction === "end") {
    return {
      targetId: items[items.length - 1] ?? null,
      stickyX: null,
      stickyY: null,
    };
  }

  const isForward = direction === "down" || direction === "right";
  const delta = isForward ? 1 : -1;
  let nextIndex = idx + delta;

  if (nextIndex < 0) {
    nextIndex = config.loop ? items.length - 1 : 0;
  } else if (nextIndex >= items.length) {
    nextIndex = config.loop ? 0 : items.length - 1;
  }

  return {
    targetId: items[nextIndex] ?? null,
    stickyX: null,
    stickyY: null,
  };
};

// ═══════════════════════════════════════════════════════════════════
// Spatial Strategy (pure — uses itemRects from spatial param)
// ═══════════════════════════════════════════════════════════════════

const resolveSpatial: NavigationStrategy = (
  currentId,
  direction,
  items,
  _config,
  spatial,
) => {
  if (!currentId) return { targetId: null, stickyX: null, stickyY: null };

  const itemRects = spatial.itemRects;
  if (!itemRects) {
    return { targetId: currentId, stickyX: null, stickyY: null };
  }

  const currentRect = itemRects.get(currentId);
  if (!currentRect) {
    return { targetId: currentId, stickyX: null, stickyY: null };
  }

  // Build candidate list from provided rects
  const candidates: FocusCandidate[] = [];
  for (const id of items) {
    if (id === currentId) continue;
    const rect = itemRects.get(id);
    if (!rect) continue;
    candidates.push({ id, rect });
  }

  if (candidates.length === 0) {
    return { targetId: currentId, stickyX: null, stickyY: null };
  }

  if (direction === "home") {
    return { targetId: items[0] ?? currentId, stickyX: null, stickyY: null };
  }
  if (direction === "end") {
    return {
      targetId: items[items.length - 1] ?? currentId,
      stickyX: null,
      stickyY: null,
    };
  }

  const best = findBestCandidate(currentRect, direction, candidates);

  if (!best) {
    return {
      targetId: currentId,
      stickyX: spatial.stickyX,
      stickyY: spatial.stickyY,
    };
  }

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

interface StrategyEntry {
  fn: NavigationStrategy;
  /** True if this strategy requires DOM bounding rects to compute navigation. */
  needsDOMRects: boolean;
}

const strategies = new Map<string, StrategyEntry>();

function registerNavigationStrategy(
  name: string,
  fn: NavigationStrategy,
  opts: { needsDOMRects?: boolean } = {},
): void {
  strategies.set(name, { fn, needsDOMRects: opts.needsDOMRects ?? false });
}

registerNavigationStrategy("linear", resolveLinear, { needsDOMRects: false });
registerNavigationStrategy("horizontal", resolveLinear, { needsDOMRects: false });
registerNavigationStrategy("vertical", resolveLinear, { needsDOMRects: false });
registerNavigationStrategy("spatial", resolveSpatial, { needsDOMRects: true });
registerNavigationStrategy("both", resolveSpatial, { needsDOMRects: true });
registerNavigationStrategy("corner", resolveCorner, { needsDOMRects: true });

// ═══════════════════════════════════════════════════════════════════
// Resolver Facade
// ═══════════════════════════════════════════════════════════════════

function resolveStrategyEntry(orientation: string): StrategyEntry | undefined {
  return strategies.get(orientation);
}

/** Query whether the current orientation's strategy requires DOM rects. */
export function strategyNeedsDOMRects(orientation: string): boolean {
  return resolveStrategyEntry(orientation)?.needsDOMRects ?? false;
}

export function resolveWithStrategy(
  orientation: string,
  ...args: Parameters<NavigationStrategy>
): NavigateResult {
  const entry = resolveStrategyEntry(orientation);

  if (entry) {
    return entry.fn(...args);
  }

  return { targetId: args[0], stickyX: null, stickyY: null };
}

