/**
 * TAB Command - Tab key navigation with trap/escape/flow
 */

import { DOM } from "../../../lib/dom";
import { FocusData } from "../../../lib/focusData";
import type { OSCommand, OSContext, OSResult } from "../../core/osCommand";

// ═══════════════════════════════════════════════════════════════════
// Behavior Handlers (분리된 순수함수)
// ═══════════════════════════════════════════════════════════════════

function handleTrap(
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

  // Loop at boundaries
  if (nextIndex < 0) nextIndex = items.length - 1;
  else if (nextIndex >= items.length) nextIndex = 0;

  const targetId = items[nextIndex];
  return {
    state: { focusedItemId: targetId },
    domEffects: [{ type: "FOCUS", targetId }],
  };
}

function handleEscape(
  ctx: OSContext,
  direction: "forward" | "backward",
): OSResult | null {
  // Escape: 바로 다음/이전 Zone으로 이동
  const siblingZoneId =
    direction === "forward"
      ? ctx.dom.siblingZones.next
      : ctx.dom.siblingZones.prev;

  if (siblingZoneId) {
    const siblingData = FocusData.getById(siblingZoneId);
    const siblingStore = siblingData?.store;
    const targetItemId =
      siblingStore?.getState().focusedItemId ??
      DOM.getGroupItems(siblingZoneId)[0] ??
      null;

    return {
      activeZoneId: siblingZoneId,
      domEffects: targetItemId
        ? [{ type: "FOCUS", targetId: targetItemId }]
        : [],
    };
  }

  return null;
}

function handleFlow(
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

  // At boundary - move to sibling zone
  if (nextIndex < 0 || nextIndex >= items.length) {
    return handleEscape(ctx, direction);
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
        return handleTrap(ctx, direction);
      case "escape":
        return handleEscape(ctx, direction);
      case "flow":
        return handleFlow(ctx, direction);
      default:
        return handleEscape(ctx, direction);
    }
  },
};
