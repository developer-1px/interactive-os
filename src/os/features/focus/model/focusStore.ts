import { create } from "zustand";
import { createZoneSlice } from "@os/features/focus/model/sliceZone";
import { createCursorSlice } from "@os/features/focus/model/sliceCursor";
import { createSpatialSlice } from "@os/features/focus/model/sliceSpatial";
import type { FocusState } from "@os/features/focus/model/focusTypes";

// Re-export common types for consumers
export type { FocusState } from "@os/features/focus/model/focusTypes";

export const useFocusStore = create<FocusState>()((...a) => ({
  ...createZoneSlice(...a),
  ...createCursorSlice(...a),
  ...createSpatialSlice(...a),
}));

// Expose for debugging in development
if (typeof window !== "undefined") {
  (window as any).__FOCUS_STORE__ = useFocusStore;
}
