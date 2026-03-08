/**
 * useActiveZone — OS hook to check if a zone is the currently active zone.
 *
 * Encapsulates OS internal state path so apps don't need to know
 * `s.os.focus.activeZoneId`.
 */

import { os } from "@os-core/engine/kernel";

export function useActiveZone(zoneId: string): boolean {
  return os.useComputed((s) => s.os.focus.activeZoneId === zoneId);
}
