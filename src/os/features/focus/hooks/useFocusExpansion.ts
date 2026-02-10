/**
 * useFocusExpansion - Hook to access expansion state from FocusGroup context
 *
 * Provides a simple API to toggle/set expansion for tree and accordion items.
 */

import { useCallback } from "react";
import { useStore } from "zustand";
import { useFocusGroupContext } from "@/os-new/primitives/FocusGroup";

export function useFocusExpansion() {
  const ctx = useFocusGroupContext();

  if (!ctx) {
    throw new Error("useFocusExpansion must be used within a FocusGroup");
  }

  const { store } = ctx;

  // Subscribe to expandedItems for reactive use - this MUST come before isExpanded
  const expandedItems = useStore(store, (s) => s.expandedItems);

  const toggleExpanded = useCallback(
    (id: string) => {
      store.getState().toggleExpanded(id);
    },
    [store],
  );

  const setExpanded = useCallback(
    (id: string, expanded: boolean) => {
      store.getState().setExpanded(id, expanded);
    },
    [store],
  );

  // REACTIVE: Use the subscribed expandedItems for reactivity
  const isExpanded = useCallback(
    (id: string) => {
      return expandedItems.includes(id);
    },
    [expandedItems],
  );

  return {
    toggleExpanded,
    setExpanded,
    isExpanded,
    expandedItems,
  };
}
