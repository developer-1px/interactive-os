/**
 * useFocused — Is this item the focused item in its zone?
 */

import { kernel } from "../kernel";

export function useFocused(zoneId: string, itemId: string): boolean {
  return kernel.useComputed(
    (s) => s.os.focus.zones[zoneId]?.focusedItemId === itemId,
  );
}
