/**
 * OS_TAB Command — Tab key navigation (kernel version)
 *
 * Behavior modes:
 * - trap: cycle within zone (dialog/menu)
 * - escape: move to next/prev zone immediately
 * - flow: navigate within zone, escape at boundary
 *
 * The OS manages ALL Tab navigation. No native Tab fallback.
 * Cross-zone movement uses DOM_ZONE_ORDER context.
 */

import { produce } from "immer";
import { DOM_ITEMS, DOM_ZONE_ORDER, ZONE_CONFIG } from "../../2-contexts";
import { kernel } from "../../kernel";
import { ensureZone } from "../../state/utils";

interface TabPayload {
  direction?: "forward" | "backward";
}

export const TAB = kernel.defineCommand(
  "OS_TAB",
  [DOM_ITEMS, ZONE_CONFIG, DOM_ZONE_ORDER],
  (ctx) => (payload: TabPayload) => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone) return;

    const items: string[] = ctx.inject(DOM_ITEMS);
    const config = ctx.inject(ZONE_CONFIG);
    const direction = payload.direction ?? "forward";
    const behavior = config.tab.behavior;

    if (items.length === 0) return;

    // ─── trap: cycle within zone ───
    if (behavior === "trap") {
      return moveFocusWithinZone(ctx, activeZoneId, items, zone.focusedItemId, direction, true);
    }

    // ─── flow: navigate within zone, escape at boundary ───
    if (behavior === "flow") {
      const currentIndex = zone.focusedItemId
        ? items.indexOf(zone.focusedItemId)
        : -1;
      const delta = direction === "forward" ? 1 : -1;
      const nextIndex = currentIndex + delta;

      if (nextIndex >= 0 && nextIndex < items.length) {
        return moveFocusWithinZone(ctx, activeZoneId, items, zone.focusedItemId, direction, false);
      }
      // Boundary reached → fall through to cross-zone escape
    }

    // ─── escape: move to next/prev zone ───
    return escapeToNextZone(ctx, activeZoneId, direction);
  },
);

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function moveFocusWithinZone(
  ctx: any,
  zoneId: string,
  items: string[],
  currentItemId: string | null,
  direction: "forward" | "backward",
  loop: boolean,
) {
  const currentIndex = currentItemId ? items.indexOf(currentItemId) : -1;
  const delta = direction === "forward" ? 1 : -1;
  let nextIndex = currentIndex + delta;

  if (loop) {
    if (nextIndex < 0) nextIndex = items.length - 1;
    else if (nextIndex >= items.length) nextIndex = 0;
  } else if (nextIndex < 0 || nextIndex >= items.length) {
    return;
  }

  const targetId = items[nextIndex];
  if (!targetId) return;

  return {
    state: produce(ctx.state, (draft: any) => {
      const z = ensureZone(draft.os, zoneId);
      z.focusedItemId = targetId;
      z.lastFocusedId = targetId;
    }) as typeof ctx.state,
    focus: targetId,
  };
}

function escapeToNextZone(
  ctx: any,
  currentZoneId: string,
  direction: "forward" | "backward",
) {
  const zoneOrder = ctx.inject(DOM_ZONE_ORDER);
  const currentIdx = zoneOrder.findIndex(
    (z: any) => z.zoneId === currentZoneId,
  );
  if (currentIdx === -1) return;

  const nextIdx = direction === "forward" ? currentIdx + 1 : currentIdx - 1;
  if (nextIdx < 0 || nextIdx >= zoneOrder.length) return;

  const nextZone = zoneOrder[nextIdx];
  const targetId =
    direction === "forward" ? nextZone.firstItemId : nextZone.lastItemId;
  if (!targetId) return;

  return {
    state: produce(ctx.state, (draft: any) => {
      // Switch active zone
      draft.os.focus.activeZoneId = nextZone.zoneId;
      // Set focus in the new zone
      const z = ensureZone(draft.os, nextZone.zoneId);
      z.focusedItemId = targetId;
      z.lastFocusedId = targetId;
    }) as typeof ctx.state,
    focus: targetId,
  };
}
