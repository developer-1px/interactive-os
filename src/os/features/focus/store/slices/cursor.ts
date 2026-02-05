/**
 * Cursor Slice - Focus cursor state
 */

import type { StateCreator } from 'zustand';

export interface CursorSlice {
    // State
    focusedItemId: string | null;
    lastFocusedId: string | null;  // For restore-on-entry

    // Actions
    setFocus: (itemId: string | null) => void;
}

export const createCursorSlice: StateCreator<CursorSlice> = (set) => ({
    focusedItemId: null,
    lastFocusedId: null,

    setFocus: (itemId) => set((state) => ({
        focusedItemId: itemId,
        lastFocusedId: itemId ?? state.lastFocusedId,
    })),
});
