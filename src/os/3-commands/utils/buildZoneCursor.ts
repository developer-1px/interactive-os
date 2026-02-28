/**
 * buildZoneCursor — Constructs a ZoneCursor from kernel zone state.
 *
 * Used by OS commands to create the cursor object before passing
 * it to zone callbacks. Returns null if focusedItemId is missing.
 *
 * Enriches cursor with structural meta from ZoneRegistry:
 * isExpandable, isDisabled, treeLevel.
 */

import type { ZoneCursor } from "@os/2-contexts/zoneRegistry";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import type { ZoneState } from "@os/state/OSState";

export function buildZoneCursor(
  zone: ZoneState | undefined,
): ZoneCursor | null {
  if (!zone?.focusedItemId) return null;

  const { zoneId, focusedItemId: focusId } = zone;
  const entry = zoneId ? ZoneRegistry.get(zoneId) : undefined;

  // Expand axis — config-driven
  const expandMode = entry?.config?.expand?.mode ?? "none";
  const isExpandable =
    expandMode === "all"
      ? true
      : expandMode === "explicit"
        ? (entry?.getExpandableItems?.().has(focusId) ?? false)
        : false;

  return {
    focusId,
    selection: zone.selection ?? [],
    anchor: zone.selectionAnchor ?? null,
    isExpandable,
    isDisabled: zoneId ? ZoneRegistry.isDisabled(zoneId, focusId) : false,
    treeLevel: entry?.getTreeLevels?.().get(focusId),
  };
}
