/**
 * NAVIGATE Command - Arrow key navigation
 *
 * Pure function — all DOM data comes via ctx.
 */

import type {
  OSCommand,
  OSContext,
  OSResult,
} from "@os/features/focus/pipeline/core/osCommand.ts";
import {
  type FocusCandidate,
  findBestCandidate,
  getWeightedDistanceFor,
  majorAxisDistance,
  minorAxisDistance,
} from "./focusFinder.ts";
import { resolveNavigate } from "./resolve.ts";
import { resolveZoneSpatial } from "./zoneSpatial.ts";

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
  const currentItemId = ctx.focusedItemId;
  if (!currentItemId) return null;

  const currentRect = ctx.dom.queries.getItemRect(currentItemId);
  if (!currentRect) return null;

  // ─── Phase 1: Collect item candidates from ancestor zones ───
  let bestAncestorItem: { id: string; zoneId: string } | null = null;

  {
    let walkZoneId = ctx.zoneId;
    for (let depth = 0; depth < 5; depth++) {
      const parentId = ctx.dom.queries.getGroupParentId(walkZoneId);
      if (!parentId) break;

      const parentItems = ctx.dom.queries.getGroupItems(parentId);
      const itemCandidates: FocusCandidate[] = [];
      for (const itemId of parentItems) {
        if (itemId === currentItemId) continue;
        const itemRect = ctx.dom.queries.getItemRect(itemId);
        if (itemRect) {
          itemCandidates.push({ id: itemId, rect: itemRect });
        }
      }

      if (itemCandidates.length > 0) {
        const best = findBestCandidate(currentRect, dir, itemCandidates);
        if (best) {
          const parentEntry = ctx.dom.queries.getGroupEntry(parentId);
          if (parentEntry?.store) {
            bestAncestorItem = { id: best.id, zoneId: parentId };
            break;
          }
        }
      }

      walkZoneId = parentId;
    }
  }

  // ─── Phase 2: Zone-to-zone spatial ───
  let bestZoneResult: {
    targetItemId: string | null;
    targetGroupId: string;
    targetStore: any;
  } | null = null;

  {
    let walkZoneId = ctx.zoneId;
    for (let depth = 0; depth < 6; depth++) {
      const spatialResult = resolveZoneSpatial(
        walkZoneId,
        dir,
        currentItemId,
        ctx.dom.queries,
      );
      if (spatialResult) {
        bestZoneResult = spatialResult;
        break;
      }
      const parentId = ctx.dom.queries.getGroupParentId(walkZoneId);
      if (!parentId) break;
      walkZoneId = parentId;
    }
  }

  // ─── Phase 3: Pick the closer one ───
  if (bestAncestorItem && bestZoneResult) {
    const ancestorRect = ctx.dom.queries.getItemRect(bestAncestorItem.id);
    const zoneItemRect = bestZoneResult.targetItemId
      ? ctx.dom.queries.getItemRect(bestZoneResult.targetItemId)
      : ctx.dom.queries.getGroupRect(bestZoneResult.targetGroupId);

    if (ancestorRect && zoneItemRect) {
      const ancestorDist = getWeightedDistanceFor(
        majorAxisDistance(dir, currentRect, ancestorRect),
        minorAxisDistance(dir, currentRect, ancestorRect),
      );
      const zoneDist = getWeightedDistanceFor(
        majorAxisDistance(dir, currentRect, zoneItemRect),
        minorAxisDistance(dir, currentRect, zoneItemRect),
      );

      if (ancestorDist <= zoneDist) {
        return {
          state: { focusedItemId: bestAncestorItem.id },
          activeZoneId: bestAncestorItem.zoneId,
          domEffects: [{ type: "FOCUS", targetId: bestAncestorItem.id }],
        };
      }
    } else if (ancestorRect) {
      return {
        state: { focusedItemId: bestAncestorItem.id },
        activeZoneId: bestAncestorItem.zoneId,
        domEffects: [{ type: "FOCUS", targetId: bestAncestorItem.id }],
      };
    }

    return {
      state: { focusedItemId: bestZoneResult.targetItemId },
      activeZoneId: bestZoneResult.targetGroupId,
      domEffects: bestZoneResult.targetItemId
        ? [{ type: "FOCUS", targetId: bestZoneResult.targetItemId }]
        : [],
    };
  }

  if (bestAncestorItem) {
    return {
      state: { focusedItemId: bestAncestorItem.id },
      activeZoneId: bestAncestorItem.zoneId,
      domEffects: [{ type: "FOCUS", targetId: bestAncestorItem.id }],
    };
  }

  if (bestZoneResult) {
    return {
      state: { focusedItemId: bestZoneResult.targetItemId },
      activeZoneId: bestZoneResult.targetGroupId,
      domEffects: bestZoneResult.targetItemId
        ? [{ type: "FOCUS", targetId: bestZoneResult.targetItemId }]
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

  if (selectMode === "range" && targetId) {
    const anchor = ctx.selectionAnchor || ctx.focusedItemId || targetId;
    const items = ctx.dom.items;
    const anchorIdx = items.indexOf(anchor);
    const targetIdx = items.indexOf(targetId);

    if (anchorIdx !== -1 && targetIdx !== -1) {
      const start = Math.min(anchorIdx, targetIdx);
      const end = Math.max(anchorIdx, targetIdx);
      result.state!.selection = items.slice(start, end + 1);
      result.state!.selectionAnchor = anchor;
    }

    if (ctx.selectCommand) {
      result.dispatch = ctx.selectCommand;
    }

    return result;
  }

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

interface NavigatePayload {
  direction: string;
  select?: "range" | "toggle";
}

export const NAVIGATE: OSCommand<NavigatePayload> = {
  run: (ctx, payload) => {
    const dir = payload.direction.toLowerCase() as Direction;

    // 0. Home/End
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

    // 2. Normal Navigation (pass itemRects for spatial strategies)
    const navResult = resolveNavigate(
      ctx.focusedItemId,
      dir,
      ctx.dom.items,
      ctx.config.navigate,
      {
        stickyX: ctx.stickyX,
        stickyY: ctx.stickyY,
        itemRects: ctx.dom.itemRects,
      },
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
