/**
 * OS_SELECT_ALL Command — Cmd+A select all items
 *
 * Selects all visible items in the active zone.
 * Uses DOM_ITEMS to get the list of all item IDs in the zone.
 */

import { DOM_ITEMS, ZONE_CONFIG } from "@os-core/3-inject";
import { produce } from "immer";
import { os } from "../../engine/kernel";
import { ensureZone } from "../../schema/state/utils";

export const OS_SELECT_ALL = os.defineCommand(
  "OS_SELECT_ALL",
  [DOM_ITEMS, ZONE_CONFIG],
  (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    // W3C APG: Ctrl+A only applies to multi-select zones
    const zoneConfig = ctx.inject(ZONE_CONFIG);
    if (zoneConfig.select.mode !== "multiple") return;

    // DOM_ITEMS provider decides the source (browser/headless+React/pure headless)
    const items: string[] = ctx.inject(DOM_ITEMS);
    if (items.length === 0) return;

    return {
      state: produce(ctx.state, (draft) => {
        const zone = ensureZone(draft.os, activeZoneId);
        for (const id of items) {
          if (!zone.items[id]) zone.items[id] = {};
          zone.items[id] = { ...zone.items[id], "aria-selected": true };
        }
        zone.selectionAnchor = items[0] ?? null;
      }) as typeof ctx.state,
    };
  },
);
