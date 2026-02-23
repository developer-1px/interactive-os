import type { FocusStackEntry } from "../schemas/focus/FocusStack";

export interface OverlayEntry {
  /** Unique overlay ID */
  id: string;
  /** Overlay type (determines behavior preset) */
  type: "dialog" | "alertdialog" | "menu" | "popover" | "tooltip";
}

export interface ToastEntry {
  /** Unique toast ID */
  id: string;
  /** Message to display */
  message: string;
  /** Optional action label (e.g. "Undo") */
  actionLabel?: string;
  /** Optional command to dispatch when action is clicked */
  actionCommand?: { type: string; payload?: unknown; scope?: string[] };
  /** Duration in ms before auto-dismiss (0 = manual only) */
  duration: number;
  /** Timestamp when toast was created */
  createdAt: number;
}

export interface OSState {
  focus: {
    /** The ID of the currently active zone */
    activeZoneId: string | null;
    /** Stack of saved focus states (modal/overlay restoration) */
    focusStack: FocusStackEntry[];
    /** Map of zone IDs to their specific state */
    zones: Record<string, ZoneState>;
  };
  overlays: {
    /** Stack of open overlays (top = most recent) */
    stack: OverlayEntry[];
  };
  toasts: {
    /** Active toast stack (bottom = oldest, top = newest) */
    stack: ToastEntry[];
  };
}

export interface ZoneState {
  // Cursor Slice
  focusedItemId: string | null;
  lastFocusedId: string | null;

  // Field Slice
  editingItemId: string | null;
  /** Per-field caret offset cache (fieldId → character offset) */
  caretPositions: Record<string, number>;

  // Spatial Slice
  stickyX: number | null;
  stickyY: number | null;

  // Selection Slice
  selection: string[];
  selectionAnchor: string | null;

  // Expansion Slice
  expandedItems: string[];
}
