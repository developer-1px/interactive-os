/**
 * OS_ACTIVATE Command — Enter key activation (kernel version)
 *
 * Behavior:
 * - If zone role is expandable: toggle expansion (via OS_EXPAND dispatch)
 * - If zone has onAction: pass ZoneCursor to onAction callback
 * - Otherwise: trigger CLICK effect on focused element
 */

import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { kernel } from "../../kernel";
import { getChildRole, isExpandableRole } from "../../registries/roleRegistry";
import { EXPAND } from "../expand";
import { buildZoneCursor } from "../utils/buildZoneCursor";

export const ACTIVATE = kernel.defineCommand("OS_ACTIVATE", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const zone = ctx.state.os.focus.zones[activeZoneId];
  if (!zone?.focusedItemId) return;

  // APG: disabled items cannot be activated
  if (ZoneRegistry.isDisabled(activeZoneId, zone.focusedItemId)) return;

  // W3C Tree Pattern: Enter/Space toggles expansion for expandable items
  const entry = ZoneRegistry.get(activeZoneId);
  const childRole = getChildRole(entry?.role);
  if (childRole && isExpandableRole(childRole)) {
    return {
      dispatch: EXPAND({ action: "toggle", itemId: zone.focusedItemId }),
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
});
