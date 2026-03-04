/**
 * buildZoneCursor — Constructs a ZoneCursor from kernel zone state.
 *
 * Used by OS commands to create the cursor object before passing
 * it to zone callbacks. Returns null if focusedItemId is missing.
 *
 * Enriches cursor with structural meta from ZoneRegistry:
 * isExpandable, isDisabled, treeLevel.
 */

import type { ZoneCursor } from "@os-core/engine/registries/zoneRegistry";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import type { ZoneState } from "@os-core/schema/state/OSState";

export function buildZoneCursor(
  zone: ZoneState | undefined,
): ZoneCursor | null {
  if (!zone?.focusedItemId) return null;

  const { zoneId, focusedItemId: focusId } = zone;
  const entry = zoneId ? ZoneRegistry.get(zoneId) : undefined;

  // Expand axis — config-driven
  const isExpandable = zoneId ? ZoneRegistry.isExpandable(zoneId, focusId) : false;

  // selection: items where aria-selected=true (in insertion order)
  const selection = Object.entries(zone.items ?? {})
    .filter(([, state]) => state?.["aria-selected"])
    .map(([id]) => id);

  return {
    focusId,
    selection,
    anchor: zone.selectionAnchor ?? null,
    isExpandable,
    isDisabled: zoneId ? ZoneRegistry.isDisabled(zoneId, focusId) : false,
    treeLevel: entry?.getTreeLevels?.().get(focusId),
  };
}
