/**
 * useFlatTree — OS hook for flat tree rendering.
 *
 * Derives expanded items from `items[id]["aria-expanded"]` in zone state
 * and applies a pure transform to convert nested tree data into a flat visible list.
 *
 * Usage:
 *   const visibleNodes = useFlatTree("docs-sidebar", items, flattenVisibleTree);
 */

import { os } from "@os-core/engine/kernel";
import { useMemo } from "react";

// Stable empty array reference — same pattern as useExpanded.ts.
const EMPTY: readonly string[] = [];

export function useFlatTree<TItem, TNode>(
  zoneId: string,
  items: TItem[],
  flatten: (items: TItem[], expandedItems: string[]) => TNode[],
): TNode[] {
  const expandedItems = os.useComputed((s) => {
    const zoneItems = s.os.focus.zones[zoneId]?.items;
    if (!zoneItems) return EMPTY as string[];
    const expanded: string[] = [];
    for (const id in zoneItems) {
      if (zoneItems[id]?.["aria-expanded"]) expanded.push(id);
    }
    return expanded.length > 0 ? expanded : (EMPTY as string[]);
  });
  return useMemo(
    () => flatten(items, expandedItems),
    [items, expandedItems, flatten],
  );
}
