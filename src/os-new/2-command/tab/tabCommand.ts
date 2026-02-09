/**
 * TAB Command - Tab key navigation with trap/escape/flow
 *
 * Pure function — reads only from ctx (no FocusData/DOM direct access).
 */

import type {
  OSCommand,
  OSContext,
  OSResult,
} from "@os/features/focus/pipeline/core/osCommand.ts";

// ═══════════════════════════════════════════════════════════════════
// Behavior: trap — cycle within zone (dialog)
// ═══════════════════════════════════════════════════════════════════

function trap(
  ctx: OSContext,
  direction: "forward" | "backward",
): OSResult | null {
  const items = ctx.dom.items;
  if (items.length === 0) return null;

  const currentIndex = ctx.focusedItemId
    ? items.indexOf(ctx.focusedItemId)
    : -1;
  const delta = direction === "forward" ? 1 : -1;
  let nextIndex = currentIndex + delta;

  if (nextIndex < 0) nextIndex = items.length - 1;
  else if (nextIndex >= items.length) nextIndex = 0;

  const targetId = items[nextIndex];
  return {
    state: { focusedItemId: targetId },
    domEffects: [{ type: "FOCUS", targetId }],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Behavior: escape — move to sibling zone
// ═══════════════════════════════════════════════════════════════════

function escapeToZone(
  ctx: OSContext,
  direction: "forward" | "backward",
): OSResult | null {
  const siblingZoneId =
    direction === "forward"
      ? ctx.dom.siblingZones.next
      : ctx.dom.siblingZones.prev;

  if (!siblingZoneId) return null;

  const siblingEntry = ctx.dom.queries.getGroupEntry(siblingZoneId);
  const targetItemId =
    siblingEntry?.store?.getState().focusedItemId ??
    ctx.dom.queries.getGroupItems(siblingZoneId)[0] ??
    null;

  return {
    activeZoneId: siblingZoneId,
    domEffects: targetItemId ? [{ type: "FOCUS", targetId: targetItemId }] : [],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Behavior: flow — natural flow, escape at boundary
// ═══════════════════════════════════════════════════════════════════

function flow(
  ctx: OSContext,
  direction: "forward" | "backward",
): OSResult | null {
  const items = ctx.dom.items;
  if (items.length === 0) return null;

  const currentIndex = ctx.focusedItemId
    ? items.indexOf(ctx.focusedItemId)
    : -1;
  const delta = direction === "forward" ? 1 : -1;
  const nextIndex = currentIndex + delta;

  if (nextIndex < 0 || nextIndex >= items.length) {
    return escapeToZone(ctx, direction);
  }

  const targetId = items[nextIndex];
  return {
    state: { focusedItemId: targetId },
    domEffects: [{ type: "FOCUS", targetId }],
  };
}

// ═══════════════════════════════════════════════════════════════════
// TAB Command
// ═══════════════════════════════════════════════════════════════════

export const TAB: OSCommand<{ direction?: "forward" | "backward" }> = {
  run: (ctx, payload) => {
    const direction = payload?.direction ?? "forward";
    const behavior = ctx.config.tab.behavior;

    switch (behavior) {
      case "trap":
        return trap(ctx, direction);
      case "escape":
        return escapeToZone(ctx, direction);
      case "flow":
        return flow(ctx, direction);
      default:
        return escapeToZone(ctx, direction);
    }
  },
};
