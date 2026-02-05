/**
 * Spatial Slice - Spatial memory for cross-zone navigation
 */

import type { StateCreator } from 'zustand';

export interface SpatialSlice {
    // State
    stickyX: number | null;
    stickyY: number | null;

    // Actions
    setSpatialSticky: (x: number | null, y: number | null) => void;
    clearSpatialSticky: () => void;
}

export const createSpatialSlice: StateCreator<SpatialSlice> = (set) => ({
    stickyX: null,
    stickyY: null,

    setSpatialSticky: (x, y) => set({ stickyX: x, stickyY: y }),
    clearSpatialSticky: () => set({ stickyX: null, stickyY: null }),
});
