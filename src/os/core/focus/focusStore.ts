import { create } from "zustand";
import type { FocusState } from "./focusTypes";
import { createZoneSlice } from "./store/zoneSlice";
import { createCursorSlice } from "./store/cursorSlice";
import { createSpatialSlice } from "./store/spatialSlice";

// Re-export common types for consumers
export type { ZoneMetadata, FocusObject, FocusState } from "./focusTypes";

export const useFocusStore = create<FocusState>()((...a) => ({
  ...createZoneSlice(...a),
  ...createCursorSlice(...a),
  ...createSpatialSlice(...a),
}));

// Expose for debugging in development
if (typeof window !== "undefined") {
  (window as any).__FOCUS_STORE__ = useFocusStore;
}
