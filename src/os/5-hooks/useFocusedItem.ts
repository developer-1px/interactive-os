/**
 * useFocusedItem / getFocusedItem — OS accessors for focused item in a zone.
 *
 * Encapsulates OS internal state path so apps don't need to know
 * `s.os.focus.zones[zoneId]?.focusedItemId`.
 *
 * TODO: Lazy Resolution will be integrated here once Zone provides
 * items list via state registration (not DOM query).
 *
 * - useFocusedItem: React hook (reactive re-render)
 * - getFocusedItem: Non-hook (imperative callbacks, filters)
 */

import { os } from "@/os/kernel";

export function useFocusedItem(zoneId: string): string | null {
  return os.useComputed((s) => s.os.focus.zones[zoneId]?.lastFocusedId ?? null);
}

/** Non-hook accessor for imperative code (callbacks, filters). */
export function getFocusedItem(zoneId: string): string | null {
  return os.getState().os.focus.zones[zoneId]?.focusedItemId ?? null;
}
