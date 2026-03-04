import { initialZoneState } from "./initial";
import type { OSState, ZoneState } from "./OSState";

/**
 * Ensures a zone entry exists in the OS state draft.
 * If not, it initializes it with the default zone state.
 * Returns the ZoneState draft.
 *
 * Note: This function assumes it is operating on a draft created by Immer.
 */
export function ensureZone(draft: OSState, zoneId: string): ZoneState {
  if (!draft.focus.zones[zoneId]) {
    draft.focus.zones[zoneId] = {
      ...initialZoneState,
      zoneId,
      items: {},
      caretPositions: {},
      valueNow: {},
    };
  }
  return draft.focus.zones[zoneId];
}

/**
 * Apply followFocus: aria-selected follows the focused item.
 * W3C APG: In single-select listbox, selection follows focus.
 *
 * Writes directly to items[id]["aria-selected"] — no selection[] array.
 */
export function applyFollowFocus(
  zone: ZoneState,
  itemId: string,
  selectConfig?: { followFocus?: boolean; mode?: string },
): void {
  if (selectConfig?.followFocus && selectConfig?.mode !== "none") {
    // Clear all aria-selected in this zone, then set the focused item
    for (const id of Object.keys(zone.items)) {
      if (zone.items[id]?.["aria-selected"]) {
        zone.items[id] = { ...zone.items[id], "aria-selected": false };
      }
    }
    if (!zone.items[itemId]) zone.items[itemId] = {};
    zone.items[itemId] = { ...zone.items[itemId], "aria-selected": true };
    zone.selectionAnchor = itemId;
  }
}
