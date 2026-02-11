/**
 * useFocusExpansion - Hook to access expansion state from kernel
 *
 * Provides a simple API to check and toggle expansion for tree and accordion items.
 * Uses OS_EXPAND kernel command for mutations, kernel state for reads.
 */

import { useCallback } from "react";
import { EXPAND } from "@/os-new/3-commands/expand";
import { kernel } from "@/os-new/kernel";
import { useFocusGroupContext } from "@os/6-components/base/FocusGroup.tsx";

export function useFocusExpansion() {
  const ctx = useFocusGroupContext();

  if (!ctx) {
    throw new Error("useFocusExpansion must be used within a FocusGroup");
  }

  const { zoneId } = ctx;

  // Subscribe to expandedItems for reactive use
  const expandedItems = kernel.useComputed(
    (s) => s.os.focus.zones[zoneId]?.expandedItems ?? [],
  );

  const toggleExpanded = useCallback((id: string) => {
    kernel.dispatch(EXPAND({ itemId: id, action: "toggle" }));
  }, []);

  const setExpanded = useCallback((id: string, expanded: boolean) => {
    kernel.dispatch(
      EXPAND({ itemId: id, action: expanded ? "expand" : "collapse" }),
    );
  }, []);

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
