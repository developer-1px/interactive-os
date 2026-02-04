import type { StateCreator } from "zustand";
import type { FocusState, SpatialSlice } from "../focusTypes";

export const createSpatialSlice: StateCreator<FocusState, [], [], SpatialSlice> = (set) => ({
    stickyIndex: 0,
    stickyX: null,
    stickyY: null,

    setSpatialSticky: (x, y) => set({ stickyX: x, stickyY: y }),
});
