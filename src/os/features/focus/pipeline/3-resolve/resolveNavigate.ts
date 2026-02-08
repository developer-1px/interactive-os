import type { Direction, NavigateConfig } from "../../types";
import { resolveEntry } from "./resolveEntry";
import {
  type NavigateResult,
  resolveWithStrategy,
} from "./strategies/navigatorRegistry";

// ═══════════════════════════════════════════════════════════════════
// Main Resolver
// ═══════════════════════════════════════════════════════════════════

export function resolveNavigate(
  currentId: string | null,
  direction: Direction,
  items: string[],
  config: NavigateConfig,
  spatial: { stickyX: number | null; stickyY: number | null },
): NavigateResult {
  if (items.length === 0) {
    return { targetId: null, stickyX: null, stickyY: null };
  }

  // If no current focus, enter zone
  if (!currentId) {
    // Entry logic remains here for now or could be moved to strategy?
    // Ideally strategy handles it if config.entry is strategy-aware, but for now we keep it simple.
    const entryId = resolveEntry(items, config);
    return { targetId: entryId, stickyX: null, stickyY: null };
  }

  // Validate currentId exists
  if (!items.includes(currentId)) {
    return { targetId: items[0], stickyX: null, stickyY: null };
  }

  // Check availability of movement
  const isVertical = direction === "up" || direction === "down";
  const isHorizontal = direction === "left" || direction === "right";

  // Home/End bypass orientation check (work in any orientation)
  if (direction === "home" || direction === "end") {
    return resolveWithStrategy(
      config.orientation,
      currentId,
      direction,
      items,
      config,
      spatial,
    );
  }

  if (config.orientation === "horizontal" && isVertical) {
    return {
      targetId: currentId,
      stickyX: spatial.stickyX,
      stickyY: spatial.stickyY,
    };
  }
  if (config.orientation === "vertical" && isHorizontal) {
    return {
      targetId: currentId,
      stickyX: spatial.stickyX,
      stickyY: spatial.stickyY,
    };
  }

  // Delegate to Strategy
  return resolveWithStrategy(
    config.orientation,
    currentId,
    direction,
    items,
    config,
    spatial,
  );
}
// Remove old implementations resolveLinear and resolveSpatial as they are now in registry
