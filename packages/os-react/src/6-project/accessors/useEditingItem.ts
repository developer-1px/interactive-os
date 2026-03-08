/**
 * useEditingItem — OS hook to get the editing item ID in a zone.
 *
 * Encapsulates OS internal state path so apps don't need to know
 * `s.os.focus.zones[zoneId]?.editingItemId`.
 */

import { os } from "@os-core/engine/kernel";

export function useEditingItem(zoneId: string): string | null {
  return os.useComputed((s) => s.os.focus.zones[zoneId]?.editingItemId ?? null);
}
