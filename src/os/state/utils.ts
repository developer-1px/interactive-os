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
