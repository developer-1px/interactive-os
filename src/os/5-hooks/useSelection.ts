/**
 * useSelection — OS hook to read selected items in a zone.
 *
 * Encapsulates OS internal state path so apps don't need to know
 * `s.os.focus.zones[zoneId]?.selection`.
 */

import { os } from "@/os/kernel";

// Stable empty array to avoid re-render loops in useSyncExternalStore.
const EMPTY: readonly string[] = [];

export function useSelection(zoneId: string): readonly string[] {
  return os.useComputed((s) => s.os.focus.zones[zoneId]?.selection ?? EMPTY);
}
