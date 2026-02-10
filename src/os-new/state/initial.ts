import type { OSState, ZoneState } from "./OSState";

export const initialZoneState: ZoneState = {
  // Cursor
  focusedItemId: null,
  lastFocusedId: null,
  recoveryTargetId: null,

  // Field
  editingItemId: null,
  fieldEvent: null,

  // Spatial
  stickyX: null,
  stickyY: null,

  // Selection
  selection: [],
  selectionAnchor: null,

  // Expansion
  expandedItems: [],
};

export const initialOSState: OSState = {
  focus: {
    activeZoneId: null,
    zones: {},
  },
};
