/**
 * OS_ACTIVATE Command — Enter key activation (kernel version)
 *
 * Behavior:
 * - If zone role is expandable: toggle expansion (via OS_EXPAND dispatch)
 * - If zone has onAction: pass ZoneCursor to onAction callback
 * - Otherwise: trigger CLICK effect on focused element
 */

import { DOM_EXPANDABLE_ITEMS, ZONE_CONFIG } from "@os-core/3-inject";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { os } from "../../engine/kernel";
import { OS_EXPAND } from "../expand";
import { OS_SELECT } from "../selection/select";
import { buildZoneCursor } from "../utils/buildZoneCursor";

export const OS_ACTIVATE = os.defineCommand(
  "OS_ACTIVATE",
  [DOM_EXPANDABLE_ITEMS, ZONE_CONFIG],
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

    // Zone callback: pass cursor to onAction (takes priority over selection)
    if (entry?.onAction) {
      const cursor = buildZoneCursor(zone);
      if (!cursor) return;
      const result = entry.onAction(cursor);
      return { dispatch: result };
    }

    // Item-level callback: Trigger's onActivate registered via FocusItem
    const itemCb = ZoneRegistry.getItemCallback(
      activeZoneId,
      zone.focusedItemId,
    );
    if (itemCb?.onActivate) {
      return { dispatch: itemCb.onActivate };
    }

    // W3C Tabs/Listbox Pattern: Enter selects the focused item.
    // Selectable zones (select.mode is not "none") get OS_SELECT on Enter.
    // This fires after expand/onAction/onActivate so it doesn't override those.
    const zoneConfig = ctx.inject(ZONE_CONFIG);
    if (zoneConfig?.select?.mode !== "none") {
      return {
        dispatch: OS_SELECT({
          targetId: zone.focusedItemId,
        }),
      };
    }

    // Fallback: programmatic click
    return {
      click: zone.focusedItemId,
    };
  },
);
