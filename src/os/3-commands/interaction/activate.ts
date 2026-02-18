/**
 * OS_ACTIVATE Command — Enter key activation (kernel version)
 *
 * Behavior:
 * - If zone role is expandable: toggle expansion (via OS_EXPAND dispatch)
 * - If zone has onAction: dispatch onAction with resolved focus ID
 * - Otherwise: trigger CLICK effect on focused element
 */

import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { kernel } from "../../kernel";
import {
  getChildRole,
  isExpandableRole,
} from "../../registries/roleRegistry";
import { EXPAND } from "../expand";
import { resolveFocusId } from "../utils/resolveFocusId";

export const ACTIVATE = kernel.defineCommand("OS_ACTIVATE", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const zone = ctx.state.os.focus.zones[activeZoneId];
  if (!zone?.focusedItemId) return;

  // APG: disabled items cannot be activated
  if (ZoneRegistry.isDisabled(activeZoneId, zone.focusedItemId)) return;

  // W3C Tree Pattern: Enter/Space toggles expansion for expandable items
  // Expandability is determined by zone role, not DOM attribute.
  const entry = ZoneRegistry.get(activeZoneId);
  const childRole = getChildRole(entry?.role);
  if (childRole && isExpandableRole(childRole)) {
    return {
      dispatch: EXPAND({ action: "toggle", itemId: zone.focusedItemId }),
    };
  }

  // Zone callback: dispatch onAction if registered
  if (entry?.onAction) {
    return {
      dispatch: resolveFocusId(entry.onAction, zone.focusedItemId),
    };
  }

  // Fallback: programmatic click
  return {
    click: zone.focusedItemId,
  };
});
