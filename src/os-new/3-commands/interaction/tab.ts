/**
 * OS_TAB Command — Tab key navigation (kernel version)
 *
 * Behavior modes:
 * - trap: cycle within zone (dialog)
 * - escape: move to sibling zone
 * - flow: natural flow, escape at boundary
 */

import { produce } from "immer";
import { DOM_ITEMS, ZONE_CONFIG } from "../../2-contexts";
import { kernel } from "../../kernel";
import { ensureZone } from "../../state/utils";

interface TabPayload {
  direction?: "forward" | "backward";
}

export const TAB = kernel.defineCommand(
  "OS_TAB",
  [DOM_ITEMS, ZONE_CONFIG],
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
      const currentIndex = zone.focusedItemId
        ? items.indexOf(zone.focusedItemId)
        : -1;
      const delta = direction === "forward" ? 1 : -1;
      let nextIndex = currentIndex + delta;
      if (nextIndex < 0) nextIndex = items.length - 1;
      else if (nextIndex >= items.length) nextIndex = 0;

      const targetId = items[nextIndex] ?? null;
      if (!targetId) return;
      return {
        state: produce(ctx.state, (draft: any) => {
          const z = ensureZone(draft.os, activeZoneId);
          z.focusedItemId = targetId;
          z.lastFocusedId = targetId;
        }) as typeof ctx.state,
        focus: targetId,
      };
    }

    // ─── flow: natural flow, escape at boundary ───
    if (behavior === "flow") {
      const currentIndex = zone.focusedItemId
        ? items.indexOf(zone.focusedItemId)
        : -1;
      const delta = direction === "forward" ? 1 : -1;
      const nextIndex = currentIndex + delta;

      if (nextIndex >= 0 && nextIndex < items.length) {
        const targetId = items[nextIndex] ?? null;
        if (!targetId) return;
        return {
          state: produce(ctx.state, (draft: any) => {
            const z = ensureZone(draft.os, activeZoneId);
            z.focusedItemId = targetId;
            z.lastFocusedId = targetId;
          }) as typeof ctx.state,
          focus: targetId,
        };
      }
      // Fall through to escape behavior
    }

    // ─── escape: move to sibling zone ───
    // Cross-zone tab navigation will be fully implemented in Phase 5
    // For now, return a signal that the tab should escape
    return {
      tabEscape: direction,
    };
  },
);
