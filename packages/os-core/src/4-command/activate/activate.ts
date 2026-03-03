/**
 * OS_ACTIVATE Command — Enter key activation (kernel version)
 *
 * Config-driven behavior via activate.effect:
 * - "toggleExpand": toggle expansion (→ OS_EXPAND)
 * - default: onAction → onActivate → OS_SELECT → click fallback
 */

import { ZONE_CONFIG } from "@os-core/3-inject";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { os } from "../../engine/kernel";
import { OS_EXPAND } from "../expand";
import { OS_SELECT } from "../selection/select";
import { buildZoneCursor } from "../utils/buildZoneCursor";

export const OS_ACTIVATE = os.defineCommand(
  "OS_ACTIVATE",
  [ZONE_CONFIG],
  (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone?.focusedItemId) return;

    // APG: disabled items cannot be activated
    if (ZoneRegistry.isDisabled(activeZoneId, zone.focusedItemId)) return;

    // Config-driven: activate.effect determines activation behavior
    const zoneConfig = ctx.inject(ZONE_CONFIG);
    if (zoneConfig?.activate?.effect === "toggleExpand") {
      return {
        dispatch: OS_EXPAND({ action: "toggle", itemId: zone.focusedItemId }),
      };
    }

    // Zone callback: pass cursor to onAction (takes priority over selection)
    const entry = ZoneRegistry.get(activeZoneId);
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
