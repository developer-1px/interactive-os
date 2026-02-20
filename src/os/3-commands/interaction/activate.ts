/**
 * OS_ACTIVATE Command — Enter key activation (kernel version)
 *
 * Behavior:
 * - If zone role is expandable: toggle expansion (via OS_EXPAND dispatch)
 * - If zone has onAction: pass ZoneCursor to onAction callback
 * - Otherwise: trigger CLICK effect on focused element
 */

import { DOM_EXPANDABLE_ITEMS } from "../../2-contexts";
import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { os } from "../../kernel";
import { OS_EXPAND } from "../expand";
import { buildZoneCursor } from "../utils/buildZoneCursor";

export const OS_ACTIVATE = os.defineCommand(
  "OS_ACTIVATE",
  [DOM_EXPANDABLE_ITEMS],
  (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone?.focusedItemId) return;

    // APG: disabled items cannot be activated
    if (ZoneRegistry.isDisabled(activeZoneId, zone.focusedItemId)) return;

    // W3C Tree Pattern: Enter/Space toggles expansion for expandable items
    const entry = ZoneRegistry.get(activeZoneId);
    const expandableItems = ctx.inject(DOM_EXPANDABLE_ITEMS);
    if (expandableItems.has(zone.focusedItemId)) {
      return {
        dispatch: OS_EXPAND({ action: "toggle", itemId: zone.focusedItemId }),
      };
    }

    // Zone callback: pass cursor to onAction
    if (entry?.onAction) {
      const cursor = buildZoneCursor(zone);
      if (!cursor) return;
      const result = entry.onAction(cursor);
      return { dispatch: result };
    }

    // Fallback: programmatic click
    return {
      click: zone.focusedItemId,
    };
  },
);
