/**
 * useFocusExpansion - Hook to access expansion state from kernel
 *
 * Provides a simple API to check and toggle expansion for tree and accordion items.
 * Uses OS_EXPAND kernel command for mutations, os state for reads.
 */

import { useFocusGroupContext } from "@os/6-components/base/FocusGroup.tsx";
import { useCallback } from "react";
import { OS_EXPAND } from "@/os/3-commands/expand";
import { os } from "@/os/kernel";

// Stable empty array reference to avoid infinite re-render in useSyncExternalStore.
// `?? []` inside a selector creates a new reference per call → referential inequality → re-render loop.
const EMPTY: readonly string[] = [];

export function useFocusExpansion() {
  const ctx = useFocusGroupContext();

  if (!ctx) {
    throw new Error("useFocusExpansion must be used within a FocusGroup");
  }

  const { zoneId } = ctx;

  // Subscribe to expandedItems for reactive use
  const expandedItems = os.useComputed(
    (s) => s.os.focus.zones[zoneId]?.expandedItems ?? EMPTY,
  );

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
