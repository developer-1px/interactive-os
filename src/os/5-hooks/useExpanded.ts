/**
 * useExpanded — Is this item expanded?
 */

import { kernel } from "../kernel";

export function useExpanded(zoneId: string, itemId: string): boolean {
  return kernel.useComputed(
    (s) => s.os.focus.zones[zoneId]?.expandedItems.includes(itemId) ?? false,
  );
}
