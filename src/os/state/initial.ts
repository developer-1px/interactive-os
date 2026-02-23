import type { OSState, ZoneState } from "./OSState";

export const initialZoneState: ZoneState = {
  zoneId: "",
  // Cursor
  focusedItemId: null,
  lastFocusedId: null,

  // Field
  editingItemId: null,
  caretPositions: {},

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
    focusStack: [],
    zones: {},
  },
  overlays: {
    stack: [],
  },
  toasts: {
    stack: [],
  },
  drag: {
    isDragging: false,
    zoneId: null,
    dragItemId: null,
    overItemId: null,
    overPosition: null,
  },
};
