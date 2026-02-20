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
    // Clone initial state to avoid shared reference mutations if not using immer correctly (though immer handles it)
    draft.focus.zones[zoneId] = { ...initialZoneState };
  }
  return draft.focus.zones[zoneId];
}

/**
 * Apply followFocus: selection follows the focused item.
 * W3C APG: In single-select listbox, selection follows focus.
 *
 * Single source of truth — used by both FOCUS and NAVIGATE commands.
 */
export function applyFollowFocus(
  zone: ZoneState,
  itemId: string,
  selectConfig?: { followFocus?: boolean; mode?: string },
): void {
  if (selectConfig?.followFocus && selectConfig?.mode !== "none") {
    zone.selection = [itemId];
    zone.selectionAnchor = itemId;
  }
}
