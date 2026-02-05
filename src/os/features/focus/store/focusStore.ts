import { create } from "zustand";
import { createZoneSlice } from "@os/features/focus/store/slices/zone";
import { createCursorSlice } from "@os/features/focus/store/slices/cursor";
import { createSpatialSlice } from "@os/features/focus/store/slices/spatial";
import { createSelectionSlice } from "@os/features/focus/store/slices/selection";
import type { FocusState } from "@os/features/focus/store/types";



export const useFocusStore = create<FocusState>()((...a) => ({
  ...createZoneSlice(...a),
  ...createCursorSlice(...a),
  ...createSpatialSlice(...a),
  ...createSelectionSlice(...a),
}));

// Expose for debugging in development
if (typeof window !== "undefined") {
  (window as any).__FOCUS_STORE__ = useFocusStore;
}

