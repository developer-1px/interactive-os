import { create } from "zustand";
import { createZoneSlice } from "@os/features/focus/model/createZoneSlice";
import { createCursorSlice } from "@os/features/focus/model/createCursorSlice";
import { createSpatialSlice } from "@os/features/focus/model/createSpatialSlice";
import { createSelectionSlice } from "@os/features/focus/model/createSelectionSlice";
import type { FocusState } from "@os/features/focus/model/focusTypes";



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

