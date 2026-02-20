/**
 * buildZoneCursor — Constructs a ZoneCursor from kernel zone state.
 *
 * Used by OS commands to create the cursor object before passing
 * it to zone callbacks. Returns null if focusedItemId is missing.
 */

import type { ZoneCursor } from "@os/2-contexts/zoneRegistry";
import type { ZoneState } from "@os/state/OSState";

export function buildZoneCursor(
  zone: ZoneState | undefined,
): ZoneCursor | null {
  if (!zone?.focusedItemId) return null;

  return {
    focusId: zone.focusedItemId,
    selection: zone.selection ?? [],
    anchor: zone.selectionAnchor ?? null,
  };
}
