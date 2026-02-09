export interface OSState {
  focus: {
    /** The ID of the currently active zone */
    activeZoneId: string | null;
    /** Map of zone IDs to their specific state */
    zones: Record<string, ZoneState>;
  };
}

export interface ZoneState {
  // Cursor Slice
  focusedItemId: string | null;
  lastFocusedId: string | null;
  recoveryTargetId: string | null;

  // Spatial Slice
  stickyX: number | null;
  stickyY: number | null;

  // Selection Slice
  selection: string[];
  selectionAnchor: string | null;

  // Expansion Slice
  expandedItems: string[];
}
