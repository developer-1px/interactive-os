/**
 * Cursor Slice - Focus cursor state
 */

import type { StateCreator } from "zustand";

export interface CursorSlice {
  // State
  focusedItemId: string | null;
  lastFocusedId: string | null; // For restore-on-entry
  recoveryTargetId: string | null; // Pre-computed recovery target (O(1) lookup)

  // Actions
  setFocus: (itemId: string | null) => void;
}

export const createCursorSlice: StateCreator<CursorSlice> = (set) => ({
  focusedItemId: null,
  lastFocusedId: null,
  recoveryTargetId: null,

  setFocus: (itemId) =>
    set((state) => {
      if (state.focusedItemId === itemId) return state;
      return {
        focusedItemId: itemId,
        lastFocusedId: itemId ?? state.lastFocusedId,
        recoveryTargetId: null,
      };
    }),
});
