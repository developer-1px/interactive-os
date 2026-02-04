import type { StateCreator } from "zustand";
import type { SpatialSlice } from "@os/features/focus/model/focusTypes";
import type { FocusState } from "@os/features/focus/model/focusTypes";

export const createSpatialSlice: StateCreator<FocusState, [], [], SpatialSlice> = (set) => ({
    stickyIndex: 0,
    stickyX: null,
    stickyY: null,

    setSpatialSticky: (x, y) => set({ stickyX: x, stickyY: y }),
});
