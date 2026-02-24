/**
 * useFlatTree — OS hook for flat tree rendering.
 *
 * Reads expandedItems from OS kernel state and applies a pure transform
 * to convert nested tree data into a flat visible list.
 *
 * Usage:
 *   const visibleNodes = useFlatTree("docs-sidebar", items, flattenVisibleTree);
 */

import { os } from "@os/kernel";
import { useMemo } from "react";

// Stable empty array reference — same pattern as useExpanded.ts.
// `?? []` inside a selector creates a new reference per call → re-render loop.
const EMPTY: readonly string[] = [];

export function useFlatTree<TItem, TNode>(
  zoneId: string,
  items: TItem[],
  flatten: (items: TItem[], expandedItems: string[]) => TNode[],
): TNode[] {
  const expandedItems = os.useComputed(
    (s) => s.os.focus.zones[zoneId]?.expandedItems ?? (EMPTY as string[]),
  );
  return useMemo(
    () => flatten(items, expandedItems),
    [items, expandedItems, flatten],
  );
}
