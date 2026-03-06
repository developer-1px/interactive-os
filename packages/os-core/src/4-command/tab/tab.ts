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

import { DOM_ITEMS, DOM_ZONE_ORDER, ZONE_CONFIG } from "@os-core/3-inject";
import { produce } from "immer";
import { os } from "../../engine/kernel";
import { ensureZone } from "../../schema/state/utils";
import { resolveTab } from "./resolveTab";

interface TabPayload {
  direction?: "forward" | "backward";
}

export const OS_TAB = os.defineCommand(
  "OS_TAB",
  [DOM_ITEMS, ZONE_CONFIG, DOM_ZONE_ORDER],
  (ctx) => (payload: TabPayload) => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) {
      console.log("[OS_TAB] ❌ no activeZoneId");
      return;
    }

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone) {
      console.log("[OS_TAB] ❌ no zone state for", activeZoneId);
      return;
    }

    // DOM_ITEMS provider decides the source (browser/headless+React/pure headless)
    const items: string[] = ctx.inject(DOM_ITEMS);
    const config = ctx.inject(ZONE_CONFIG);

    console.log(
      `[OS_TAB] 🔍 zone=${activeZoneId}, behavior=${config.tab.behavior}, items=${items.length}, focused=${zone.focusedItemId}`,
    );

    // "native" → OS does not manage Tab — browser default order
    if (config.tab.behavior === "native") return;

    const zoneOrder = ctx.inject(DOM_ZONE_ORDER);
    const direction = payload.direction ?? "forward";

    console.log(
      `[OS_TAB] 🗺️ zoneOrder=[${zoneOrder.map((z: { zoneId: string; firstItemId: string | null }) => `${z.zoneId}(first:${z.firstItemId})`).join(", ")}]`,
    );

    const result = resolveTab(
      zone.focusedItemId,
      items,
      config.tab.behavior,
      direction,
      activeZoneId,
      zoneOrder,
    );

    console.log(
      "[OS_TAB]",
      result
        ? `✅ ${result.type} → zone=${(result as { zoneId?: string }).zoneId ?? activeZoneId}, item=${result.itemId}`
        : "❌ resolveTab returned null",
    );

    if (!result) return;

    if (result.type === "within") {
      return {
        state: produce(ctx.state, (draft) => {
          const z = ensureZone(draft.os, activeZoneId);
          z.focusedItemId = result.itemId;
          z.lastFocusedId = result.itemId;
        }) as typeof ctx.state,
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
    };
  },
);
