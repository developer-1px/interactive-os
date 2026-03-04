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

  // ARIA Item State (direct mirror of DOM aria-* attributes)
  items: {},
  selectionAnchor: null,

  // Value
  valueNow: {},
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
  notifications: {
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
