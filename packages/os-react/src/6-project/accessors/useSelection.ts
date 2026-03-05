/**
 * useSelection — OS hook to read selected items in a zone.
 *
 * Derives selection from `items[id]["aria-selected"]` in zone state.
 */

import { os } from "@os-core/engine/kernel";

// Stable empty array to avoid re-render loops in useSyncExternalStore.
const EMPTY: readonly string[] = [];

export function useSelection(zoneId: string): readonly string[] {
  return os.useComputed((s) => {
    const items = s.os.focus.zones[zoneId]?.items;
    if (!items) return EMPTY;
    const selected: string[] = [];
    for (const id in items) {
      if (items[id]?.["aria-selected"]) selected.push(id);
    }
    return selected.length > 0 ? selected : EMPTY;
  });
}
