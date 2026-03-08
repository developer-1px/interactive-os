/**
 * useZoneValue — OS hook to get a value-axis item's current value.
 *
 * Used by slider, spinbutton, and separator (window-splitter) patterns.
 * Encapsulates OS internal state path so apps don't need to know
 * `s.os.focus.zones[zoneId]?.valueNow?.[itemId]`.
 */

import { os } from "@os-core/engine/kernel";

export function useZoneValue(zoneId: string, itemId: string): number | undefined {
  return os.useComputed((s) => s.os.focus.zones[zoneId]?.valueNow?.[itemId]);
}
