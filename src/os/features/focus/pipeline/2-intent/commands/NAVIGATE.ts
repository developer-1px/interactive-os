/**
 * NAVIGATE Command - Arrow key navigation
 */

import type { OSNavigatePayload } from "../../../../command/definitions/commandsShell";
import { resolveNavigate } from "../../3-resolve/resolveNavigate";
import { resolveZoneSpatial } from "../../3-resolve/resolveZoneSpatial";
import type { OSCommand, OSContext, OSResult } from "../../core/osCommand";

type Direction = "up" | "down" | "left" | "right";

// ═══════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════

function handleTreeExpansion(ctx: OSContext, dir: Direction): OSResult | null {
  const activeId = ctx.focusedItemId;
  if (!activeId || (dir !== "left" && dir !== "right")) return null;

  const role = ctx.dom.queries.getItemRole(activeId);
  const isExpandable = role === "treeitem";

  if (!isExpandable) return null;

  const isExpanded = ctx.expandedItems.includes(activeId);

  if (dir === "right" && !isExpanded) {
    return { state: { expandedItems: [...ctx.expandedItems, activeId] } };
  }
  if (dir === "left" && isExpanded) {
    return {
      state: {
        expandedItems: ctx.expandedItems.filter((id) => id !== activeId),
      },
    };
  }

  return null;
}

function handleSeamlessNavigation(
  ctx: OSContext,
  dir: Direction,
): OSResult | null {
  const spatialResult = resolveZoneSpatial(
    ctx.zoneId,
    dir,
    ctx.focusedItemId,
    ctx.dom.queries,
  );

  if (spatialResult) {
    return {
      state: { focusedItemId: spatialResult.targetItemId },
      activeZoneId: spatialResult.targetGroupId,
      domEffects: spatialResult.targetItemId
        ? [{ type: "FOCUS", targetId: spatialResult.targetItemId }]
        : [],
    };
  }

  return null;
}

function buildNavigateResult(
  ctx: OSContext,
  targetId: string | null,
  stickyX: number | null,
  stickyY: number | null,
  selectMode?: "range" | "toggle",
): OSResult {
  const result: OSResult = {
    state: {
      focusedItemId: targetId,
      stickyX,
      stickyY,
    },
  };

  // Shift+Arrow: Range selection from anchor to new target
  if (selectMode === "range" && targetId) {
    const anchor = ctx.selectionAnchor || ctx.focusedItemId || targetId;
    const items = ctx.dom.items;
    const anchorIdx = items.indexOf(anchor);
    const targetIdx = items.indexOf(targetId);

    if (anchorIdx !== -1 && targetIdx !== -1) {
      const start = Math.min(anchorIdx, targetIdx);
      const end = Math.max(anchorIdx, targetIdx);
      result.state!.selection = items.slice(start, end + 1);
      result.state!.selectionAnchor = anchor; // Anchor stays fixed
    }

    if (ctx.selectCommand) {
      result.dispatch = ctx.selectCommand;
    }

    return result;
  }

  // Follow focus selection (default)
  if (
    ctx.config.select.followFocus &&
    ctx.config.select.mode !== "none" &&
    targetId
  ) {
    result.state!.selection = [targetId];
    result.state!.selectionAnchor = targetId;

    if (ctx.selectCommand) {
      result.dispatch = ctx.selectCommand;
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════
// NAVIGATE Command
// ═══════════════════════════════════════════════════════════════════

export const NAVIGATE: OSCommand<OSNavigatePayload> = {
  run: (ctx, payload) => {
    const dir = payload.direction.toLowerCase() as Direction;

    // 0. Home/End — jump to first/last item (W3C APG)
    if (dir === ("home" as string)) {
      const firstItem = ctx.dom.items[0] || null;
      return buildNavigateResult(ctx, firstItem, null, null);
    }
    if (dir === ("end" as string)) {
      const lastItem = ctx.dom.items[ctx.dom.items.length - 1] || null;
      return buildNavigateResult(ctx, lastItem, null, null);
    }

    // 1. Tree Expansion/Collapse
    const expansionResult = handleTreeExpansion(ctx, dir);
    if (expansionResult) return expansionResult;

    // 2. Normal Navigation
    const navResult = resolveNavigate(
      ctx.focusedItemId,
      dir,
      ctx.dom.items,
      ctx.config.navigate,
      { stickyX: ctx.stickyX, stickyY: ctx.stickyY },
    );

    // 3. Seamless Navigation (cross-zone)
    if (
      ctx.config.navigate.seamless &&
      navResult.targetId === ctx.focusedItemId
    ) {
      const seamlessResult = handleSeamlessNavigation(ctx, dir);
      if (seamlessResult) return seamlessResult;
    }

    // 4. Build Result
    return buildNavigateResult(
      ctx,
      navResult.targetId,
      navResult.stickyX,
      navResult.stickyY,
      payload.select,
    );
  },
};
