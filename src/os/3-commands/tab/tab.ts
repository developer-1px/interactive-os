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
import { os } from "../../kernel";
import { ensureZone } from "../../state/utils";
import { resolveTab } from "./resolveTab";

interface TabPayload {
  direction?: "forward" | "backward";
}

export const TAB = os.defineCommand(
  "OS_TAB",
  [DOM_ITEMS, ZONE_CONFIG, DOM_ZONE_ORDER],
  (ctx) => (payload: TabPayload) => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone) return;

    const items: string[] = ctx.inject(DOM_ITEMS);
    const config = ctx.inject(ZONE_CONFIG);
    const zoneOrder = ctx.inject(DOM_ZONE_ORDER);
    const direction = payload.direction ?? "forward";

    const result = resolveTab(
      zone.focusedItemId,
      items,
      config.tab.behavior,
      direction,
      activeZoneId,
      zoneOrder,
    );

    if (!result) return;

    if (result.type === "within") {
      return {
        state: produce(ctx.state, (draft) => {
          const z = ensureZone(draft.os, activeZoneId);
          z.focusedItemId = result.itemId;
          z.lastFocusedId = result.itemId;
        }) as typeof ctx.state,
        focus: result.itemId,
      };
    }

    // escape to different zone
    return {
      state: produce(ctx.state, (draft) => {
        draft.os.focus.activeZoneId = result.zoneId;
        const z = ensureZone(draft.os, result.zoneId);
        z.focusedItemId = result.itemId;
        z.lastFocusedId = result.itemId;
      }) as typeof ctx.state,
      focus: result.itemId,
    };
  },
);
