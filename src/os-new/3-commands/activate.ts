/**
 * OS_ACTIVATE Command — Enter key activation (kernel version)
 *
 * Behavior:
 * - If treeitem/menuitem with aria-expanded: toggle expansion (via OS_EXPAND dispatch)
 * - Otherwise: trigger CLICK effect on focused element
 */

import { kernel } from "../kernel";
import { EXPAND } from "./expand";

export const ACTIVATE = kernel.defineCommand("OS_ACTIVATE", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const zone = ctx.state.os.focus.zones[activeZoneId];
  if (!zone?.focusedItemId) return;

  // W3C Tree Pattern: Enter/Space toggles expansion for expandable items
  const focusedEl = document.getElementById(zone.focusedItemId);
  if (focusedEl?.hasAttribute("aria-expanded")) {
    return {
      dispatch: EXPAND({ action: "toggle", itemId: zone.focusedItemId }),
    };
  }

  return {
    click: zone.focusedItemId,
  };
});
