/**
 * useExpanded - Hook to access expansion state from kernel
 *
 * Derives expanded items from `items[id]["aria-expanded"]` in zone state.
 * Uses OS_EXPAND kernel command for mutations, os state for reads.
 */

import { OS_EXPAND } from "@os-core/4-command/expand";
import { os } from "@os-core/engine/kernel";
import { useZoneContext } from "@os-react/6-project/Zone.tsx";
import { useCallback } from "react";

// Stable empty array reference to avoid infinite re-render in useSyncExternalStore.
const EMPTY: readonly string[] = [];

export function useExpanded() {
  const ctx = useZoneContext();

  if (!ctx) {
    throw new Error("useExpanded must be used within a Zone");
  }

  const { zoneId } = ctx;

  // Derive expanded items from aria-expanded in items map
  const expandedItems = os.useComputed((s) => {
    const items = s.os.focus.zones[zoneId]?.items;
    if (!items) return EMPTY;
    const expanded: string[] = [];
    for (const id in items) {
      if (items[id]?.["aria-expanded"]) expanded.push(id);
    }
    return expanded.length > 0 ? expanded : EMPTY;
  });

  const toggleExpanded = useCallback(
    (id: string) => {
      os.dispatch(OS_EXPAND({ itemId: id, action: "toggle", zoneId }));
    },
    [zoneId],
  );

  const setExpanded = useCallback(
    (id: string, expanded: boolean) => {
      os.dispatch(
        OS_EXPAND({
          itemId: id,
          action: expanded ? "expand" : "collapse",
          zoneId,
        }),
      );
    },
    [zoneId],
  );

  const isExpanded = (id: string) => {
    return expandedItems.includes(id);
  };

  return {
    toggleExpanded,
    setExpanded,
    isExpanded,
    expandedItems,
  };
}
