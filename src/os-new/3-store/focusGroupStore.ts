/**
 * FocusGroup Store Factory
 *
 * Creates scoped store instances for each FocusGroup.
 * Each zone has isolated state - no global store pollution.
 *
 * Note: Items are tracked via DOM, not store (DOM is source of truth).
 */

import { create } from "zustand";
import { type CursorSlice, createCursorSlice } from "./slices/cursor.ts";
import {
  createExpansionSlice,
  type ExpansionSlice,
} from "./slices/expansion.ts";
import {
  createSelectionSlice,
  type SelectionSlice,
} from "./slices/selection.ts";
import { createSpatialSlice, type SpatialSlice } from "./slices/spatial.ts";

// ═══════════════════════════════════════════════════════════════════
// Combined State Type
// ═══════════════════════════════════════════════════════════════════

export type FocusGroupState = CursorSlice &
  SpatialSlice &
  SelectionSlice &
  ExpansionSlice & {
    groupId: string;
  };

// ═══════════════════════════════════════════════════════════════════
// Store Factory
// ═══════════════════════════════════════════════════════════════════

export type FocusGroupStore = ReturnType<typeof createFocusGroupStore>;

export function createFocusGroupStore(groupId: string) {
  return create<FocusGroupState>()((...a) => ({
    groupId,
    debugId: Math.random().toString(36).slice(2, 7),
    ...createCursorSlice(...a),
    ...createSpatialSlice(...a),
    ...createSelectionSlice(...a),
    ...createExpansionSlice(...a),
  }));
}

// ═══════════════════════════════════════════════════════════════════
// Store Cache (State Persistence across Remounts)
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo } from "react";

const storeCache = new Map<
  string,
  { store: FocusGroupStore; cleanup: ReturnType<typeof setTimeout> | null }
>();

export function useFocusGroupStoreInstance(groupId: string) {
  const store = useMemo(() => {
    // 1. Try to reuse existing store
    if (storeCache.has(groupId)) {
      const entry = storeCache.get(groupId)!;
      if (entry.cleanup) {
        clearTimeout(entry.cleanup);
        entry.cleanup = null;
      }
      return entry.store;
    }

    // 2. Create new store
    const newStore = createFocusGroupStore(groupId);
    storeCache.set(groupId, { store: newStore, cleanup: null });
    return newStore;
  }, [groupId]);

  useEffect(() => {
    // Component Did Mount: Ensure no pending cleanup
    const entry = storeCache.get(groupId);
    if (entry?.cleanup) {
      clearTimeout(entry.cleanup);
      entry.cleanup = null;
    }

    return () => {
      // Component Will Unmount: Schedule cleanup
      const entry = storeCache.get(groupId);
      if (entry && entry.store === store) {
        entry.cleanup = setTimeout(() => {
          storeCache.delete(groupId);
        }, 50); // 50ms grace period for remounts
      }
    };
  }, [groupId, store]);

  return store;
}
