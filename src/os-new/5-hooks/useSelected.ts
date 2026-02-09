/**
 * useSelected — Is this item in the selection set?
 */

import { kernel } from "../kernel";

export function useSelected(zoneId: string, itemId: string): boolean {
  return kernel.useComputed(
    (s) => s.os.focus.zones[zoneId]?.selection.includes(itemId) ?? false,
  );
}
